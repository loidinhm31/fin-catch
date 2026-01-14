use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

use crate::auth::AuthService;
use crate::db::{Database, Portfolio, PortfolioEntry, BondCouponPayment};

/// Sync service for synchronizing local data with sync-center
#[derive(Clone)]
pub struct SyncService {
    server_url: String,
    client: Client,
    db: Arc<Database>,
    auth: Arc<std::sync::Mutex<AuthService>>,
}

/// Sync record in the format expected by sync-center
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SyncRecord {
    pub table_name: String,
    pub row_id: String, // UUID
    pub data: serde_json::Value,
    pub version: i64,
    pub deleted: bool,
}

/// Result of a sync operation
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SyncResult {
    pub pushed: usize,
    pub pulled: usize,
    pub conflicts: usize,
    pub success: bool,
    pub error: Option<String>,
    pub synced_at: i64, // Unix timestamp
}

/// Sync status
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SyncStatus {
    pub configured: bool,
    pub authenticated: bool,
    pub last_sync_at: Option<i64>,
    pub pending_changes: usize,
    pub server_url: Option<String>,
}

/// Push request to sync-center
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PushRequest {
    records: Vec<SyncRecord>,
    client_timestamp: i64,
}

/// Pull request to sync-center
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PullRequest {
    last_sync_timestamp: Option<i64>,
}

/// Delta sync request (combined push and pull)
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct DeltaSyncRequest {
    push: PushRequest,
    pull: PullRequest,
}

/// Delta sync response
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct DeltaSyncResponse {
    push_result: PushResult,
    pull_result: PullResult,
}

/// Push result from server
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PushResult {
    accepted: usize,
    conflicts: Vec<ConflictInfo>,
}

/// Pull result from server
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PullResult {
    records: Vec<SyncRecord>,
    server_timestamp: i64,
}

/// Conflict information
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ConflictInfo {
    table_name: String,
    row_id: String,
    reason: String,
}

impl SyncService {
    /// Create a new SyncService
    pub fn new(
        server_url: String,
        db: Arc<Database>,
        auth: Arc<std::sync::Mutex<AuthService>>,
    ) -> Self {
        Self {
            server_url,
            client: Client::new(),
            db,
            auth,
        }
    }

    /// Get sync status
    pub async fn get_sync_status(
        &self,
        app_handle: &tauri::AppHandle,
    ) -> Result<SyncStatus, String> {
        // Check if authenticated
        let is_authenticated = {
            let auth = self.auth.lock().map_err(|e| format!("Failed to lock auth: {}", e))?.clone();
            auth.is_authenticated(app_handle).await
        };

        // Get last sync timestamp from metadata
        let last_sync_at = self.get_last_sync_timestamp()?;

        // Count pending changes (records with synced_at = NULL or is_deleted = 1)
        let pending_changes = self.count_pending_changes()?;

        Ok(SyncStatus {
            configured: !self.server_url.is_empty(),
            authenticated: is_authenticated,
            last_sync_at,
            pending_changes,
            server_url: Some(self.server_url.clone()),
        })
    }

    /// Main sync operation
    pub async fn sync_now(
        &self,
        app_handle: &tauri::AppHandle,
    ) -> Result<SyncResult, String> {
        let start_time = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_err(|e| format!("Time error: {}", e))?
            .as_secs() as i64;

        // Check authentication
        let access_token = {
            let auth = self.auth.lock().map_err(|e| format!("Failed to lock auth: {}", e))?.clone();
            auth.get_access_token(app_handle).await?
        };

        // Collect local changes
        let local_changes = self.collect_local_changes().await?;

        // Get last sync timestamp
        let last_sync_timestamp = self.get_last_sync_timestamp()?;

        // Build delta sync request
        let request = DeltaSyncRequest {
            push: PushRequest {
                records: local_changes.clone(),
                client_timestamp: start_time,
            },
            pull: PullRequest {
                last_sync_timestamp,
            },
        };

        // Get app_id from auth service (stored during login/configure)
        let app_id = self.get_app_id(app_handle).await?;

        // Send delta sync request
        let response = self
            .client
            .post(format!("{}/api/v1/sync/{}/delta", self.server_url, app_id))
            .header("Authorization", format!("Bearer {}", access_token))
            .json(&request)
            .send()
            .await
            .map_err(|e| format!("Failed to send sync request: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            return Err(format!("Sync failed ({}): {}", status, error_text));
        }

        let sync_response: DeltaSyncResponse = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse sync response: {}", e))?;

        // Mark pushed records as synced
        self.mark_records_synced(&local_changes, start_time)?;

        // Apply remote changes
        self.apply_remote_changes(&sync_response.pull_result.records).await?;

        // Update sync metadata
        self.update_last_sync_timestamp(sync_response.pull_result.server_timestamp)?;

        Ok(SyncResult {
            pushed: sync_response.push_result.accepted,
            pulled: sync_response.pull_result.records.len(),
            conflicts: sync_response.push_result.conflicts.len(),
            success: true,
            error: None,
            synced_at: start_time,
        })
    }

    /// Collect local changes since last sync
    async fn collect_local_changes(&self) -> Result<Vec<SyncRecord>, String> {
        let mut records = Vec::new();

        // Collect portfolio changes
        let portfolios = self.db.list_portfolios().map_err(|e| e.to_string())?;
        for portfolio in portfolios {
            if portfolio.synced_at.is_none() || portfolio.is_deleted == Some(1) {
                records.push(self.portfolio_to_sync_record(&portfolio)?);
            }
        }

        // Collect portfolio entry changes (need to iterate through all portfolios)
        for portfolio in self.db.list_portfolios().map_err(|e| e.to_string())? {
            if let Some(portfolio_id) = portfolio.id {
                let entries = self.db.list_entries(portfolio_id).map_err(|e| e.to_string())?;
                for entry in entries {
                    if entry.synced_at.is_none() || entry.is_deleted == Some(1) {
                        records.push(self.entry_to_sync_record(&entry, &portfolio).await?);
                    }
                }

                // Collect bond coupon payment changes
                for entry in self.db.list_entries(portfolio_id).map_err(|e| e.to_string())? {
                    if let Some(entry_id) = entry.id {
                        let payments = self.db.list_coupon_payments(entry_id).map_err(|e| e.to_string())?;
                        for payment in payments {
                            if payment.synced_at.is_none() || payment.is_deleted == Some(1) {
                                records.push(self.payment_to_sync_record(&payment, &entry).await?);
                            }
                        }
                    }
                }
            }
        }

        Ok(records)
    }

    /// Convert Portfolio to SyncRecord
    fn portfolio_to_sync_record(&self, portfolio: &Portfolio) -> Result<SyncRecord, String> {
        // Get or generate UUID
        let sync_uuid = match &portfolio.sync_uuid {
            Some(uuid) => uuid.clone(),
            None => {
                let new_uuid = Uuid::new_v4().to_string();
                // Store mapping
                if let Some(id) = portfolio.id {
                    self.store_uuid_mapping("portfolios", id, &new_uuid)?;
                }
                new_uuid
            }
        };

        let mut data = serde_json::json!({
            "name": portfolio.name,
            "description": portfolio.description,
            "baseCurrency": portfolio.base_currency,
            "createdAt": portfolio.created_at,
        });

        // Remove null fields
        if let Some(obj) = data.as_object_mut() {
            obj.retain(|_, v| !v.is_null());
        }

        Ok(SyncRecord {
            table_name: "portfolios".to_string(),
            row_id: sync_uuid,
            data,
            version: portfolio.sync_version.unwrap_or(1),
            deleted: portfolio.is_deleted == Some(1),
        })
    }

    /// Convert PortfolioEntry to SyncRecord
    async fn entry_to_sync_record(
        &self,
        entry: &PortfolioEntry,
        portfolio: &Portfolio,
    ) -> Result<SyncRecord, String> {
        // Get or generate UUID for entry
        let sync_uuid = match &entry.sync_uuid {
            Some(uuid) => uuid.clone(),
            None => {
                let new_uuid = Uuid::new_v4().to_string();
                if let Some(id) = entry.id {
                    self.store_uuid_mapping("portfolio_entries", id, &new_uuid)?;
                }
                new_uuid
            }
        };

        // Get portfolio UUID
        let portfolio_sync_uuid = match &portfolio.sync_uuid {
            Some(uuid) => uuid.clone(),
            None => return Err("Portfolio must have sync_uuid before syncing entries".to_string()),
        };

        let mut data = serde_json::json!({
            "portfolioSyncUuid": portfolio_sync_uuid,
            "assetType": entry.asset_type,
            "symbol": entry.symbol,
            "quantity": entry.quantity,
            "purchasePrice": entry.purchase_price,
            "currency": entry.currency,
            "purchaseDate": entry.purchase_date,
            "notes": entry.notes,
            "tags": entry.tags,
            "transactionFees": entry.transaction_fees,
            "source": entry.source,
            "createdAt": entry.created_at,
            "unit": entry.unit,
            "goldType": entry.gold_type,
            "faceValue": entry.face_value,
            "couponRate": entry.coupon_rate,
            "maturityDate": entry.maturity_date,
            "couponFrequency": entry.coupon_frequency,
            "currentMarketPrice": entry.current_market_price,
            "lastPriceUpdate": entry.last_price_update,
            "ytm": entry.ytm,
        });

        // Remove null fields
        if let Some(obj) = data.as_object_mut() {
            obj.retain(|_, v| !v.is_null());
        }

        Ok(SyncRecord {
            table_name: "portfolio_entries".to_string(),
            row_id: sync_uuid,
            data,
            version: entry.sync_version.unwrap_or(1),
            deleted: entry.is_deleted == Some(1),
        })
    }

    /// Convert BondCouponPayment to SyncRecord
    async fn payment_to_sync_record(
        &self,
        payment: &BondCouponPayment,
        entry: &PortfolioEntry,
    ) -> Result<SyncRecord, String> {
        // Get or generate UUID for payment
        let sync_uuid = match &payment.sync_uuid {
            Some(uuid) => uuid.clone(),
            None => {
                let new_uuid = Uuid::new_v4().to_string();
                if let Some(id) = payment.id {
                    self.store_uuid_mapping("bond_coupon_payments", id, &new_uuid)?;
                }
                new_uuid
            }
        };

        // Get entry UUID
        let entry_sync_uuid = match &entry.sync_uuid {
            Some(uuid) => uuid.clone(),
            None => return Err("Entry must have sync_uuid before syncing payments".to_string()),
        };

        let mut data = serde_json::json!({
            "entrySyncUuid": entry_sync_uuid,
            "paymentDate": payment.payment_date,
            "amount": payment.amount,
            "currency": payment.currency,
            "notes": payment.notes,
            "createdAt": payment.created_at,
        });

        // Remove null fields
        if let Some(obj) = data.as_object_mut() {
            obj.retain(|_, v| !v.is_null());
        }

        Ok(SyncRecord {
            table_name: "bond_coupon_payments".to_string(),
            row_id: sync_uuid,
            data,
            version: payment.sync_version.unwrap_or(1),
            deleted: payment.is_deleted == Some(1),
        })
    }

    /// Apply remote changes to local database
    async fn apply_remote_changes(&self, records: &[SyncRecord]) -> Result<(), String> {
        for record in records {
            match record.table_name.as_str() {
                "portfolios" => self.apply_portfolio_change(record)?,
                "portfolio_entries" => self.apply_entry_change(record).await?,
                "bond_coupon_payments" => self.apply_payment_change(record).await?,
                _ => {
                    eprintln!("Unknown table: {}", record.table_name);
                }
            }
        }
        Ok(())
    }

    /// Apply portfolio change from remote
    fn apply_portfolio_change(&self, record: &SyncRecord) -> Result<(), String> {
        // Check if portfolio exists locally by sync_uuid
        let existing = self.find_local_id_by_uuid("portfolios", &record.row_id)?;

        let data = &record.data;
        let portfolio = Portfolio {
            id: existing,
            name: data["name"].as_str().unwrap_or("").to_string(),
            description: data["description"].as_str().map(|s| s.to_string()),
            base_currency: data["baseCurrency"].as_str().map(|s| s.to_string()),
            created_at: data["createdAt"].as_i64().unwrap_or(0),
            sync_uuid: Some(record.row_id.clone()),
            sync_version: Some(record.version),
            synced_at: Some(chrono::Utc::now().timestamp()),
            is_deleted: Some(if record.deleted { 1 } else { 0 }),
        };

        if let Some(_id) = existing {
            // Update existing
            self.db.update_portfolio(&portfolio).map_err(|e| e.to_string())?;
        } else {
            // Insert new
            let new_id = self.db.create_portfolio(&portfolio).map_err(|e| e.to_string())?;
            self.store_uuid_mapping("portfolios", new_id, &record.row_id)?;
        }

        Ok(())
    }

    /// Apply entry change from remote
    async fn apply_entry_change(&self, record: &SyncRecord) -> Result<(), String> {
        let existing = self.find_local_id_by_uuid("portfolio_entries", &record.row_id)?;

        let data = &record.data;

        // Get portfolio_id from portfolioSyncUuid
        let portfolio_sync_uuid = data["portfolioSyncUuid"].as_str()
            .ok_or("Missing portfolioSyncUuid")?;
        let portfolio_id = self.find_local_id_by_uuid("portfolios", portfolio_sync_uuid)?
            .ok_or("Portfolio not found for entry")?;

        let entry = PortfolioEntry {
            id: existing,
            portfolio_id,
            asset_type: data["assetType"].as_str().unwrap_or("").to_string(),
            symbol: data["symbol"].as_str().unwrap_or("").to_string(),
            quantity: data["quantity"].as_f64().unwrap_or(0.0),
            purchase_price: data["purchasePrice"].as_f64().unwrap_or(0.0),
            currency: data["currency"].as_str().map(|s| s.to_string()),
            purchase_date: data["purchaseDate"].as_i64().unwrap_or(0),
            notes: data["notes"].as_str().map(|s| s.to_string()),
            tags: data["tags"].as_str().map(|s| s.to_string()),
            transaction_fees: data["transactionFees"].as_f64(),
            source: data["source"].as_str().map(|s| s.to_string()),
            created_at: data["createdAt"].as_i64().unwrap_or(0),
            unit: data["unit"].as_str().map(|s| s.to_string()),
            gold_type: data["goldType"].as_str().map(|s| s.to_string()),
            face_value: data["faceValue"].as_f64(),
            coupon_rate: data["couponRate"].as_f64(),
            maturity_date: data["maturityDate"].as_i64(),
            coupon_frequency: data["couponFrequency"].as_str().map(|s| s.to_string()),
            current_market_price: data["currentMarketPrice"].as_f64(),
            last_price_update: data["lastPriceUpdate"].as_i64(),
            ytm: data["ytm"].as_f64(),
            sync_uuid: Some(record.row_id.clone()),
            sync_version: Some(record.version),
            synced_at: Some(chrono::Utc::now().timestamp()),
            is_deleted: Some(if record.deleted { 1 } else { 0 }),
        };

        if let Some(_id) = existing {
            self.db.update_entry(&entry).map_err(|e| e.to_string())?;
        } else {
            let new_id = self.db.create_entry(&entry).map_err(|e| e.to_string())?;
            self.store_uuid_mapping("portfolio_entries", new_id, &record.row_id)?;
        }

        Ok(())
    }

    /// Apply payment change from remote
    async fn apply_payment_change(&self, record: &SyncRecord) -> Result<(), String> {
        let existing = self.find_local_id_by_uuid("bond_coupon_payments", &record.row_id)?;

        let data = &record.data;

        // Get entry_id from entrySyncUuid
        let entry_sync_uuid = data["entrySyncUuid"].as_str()
            .ok_or("Missing entrySyncUuid")?;
        let entry_id = self.find_local_id_by_uuid("portfolio_entries", entry_sync_uuid)?
            .ok_or("Entry not found for payment")?;

        let payment = BondCouponPayment {
            id: existing,
            entry_id,
            payment_date: data["paymentDate"].as_i64().unwrap_or(0),
            amount: data["amount"].as_f64().unwrap_or(0.0),
            currency: data["currency"].as_str().unwrap_or("").to_string(),
            notes: data["notes"].as_str().map(|s| s.to_string()),
            created_at: data["createdAt"].as_i64().unwrap_or(0),
            sync_uuid: Some(record.row_id.clone()),
            sync_version: Some(record.version),
            synced_at: Some(chrono::Utc::now().timestamp()),
            is_deleted: Some(if record.deleted { 1 } else { 0 }),
        };

        if let Some(_id) = existing {
            self.db.update_coupon_payment(&payment).map_err(|e| e.to_string())?;
        } else {
            let new_id = self.db.create_coupon_payment(&payment).map_err(|e| e.to_string())?;
            self.store_uuid_mapping("bond_coupon_payments", new_id, &record.row_id)?;
        }

        Ok(())
    }

    /// Store UUID mapping in sync_id_mapping table
    fn store_uuid_mapping(&self, table_name: &str, local_id: i64, sync_uuid: &str) -> Result<(), String> {
        self.db
            .execute_sql(
                "INSERT OR REPLACE INTO sync_id_mapping (table_name, local_id, sync_uuid) VALUES (?, ?, ?)",
                &[table_name, &local_id.to_string(), sync_uuid],
            )
            .map_err(|e| e.to_string())
    }

    /// Find local ID by sync UUID
    fn find_local_id_by_uuid(&self, table_name: &str, sync_uuid: &str) -> Result<Option<i64>, String> {
        self.db
            .query_optional_i64(
                "SELECT local_id FROM sync_id_mapping WHERE table_name = ? AND sync_uuid = ?",
                &[table_name, sync_uuid],
            )
            .map_err(|e| e.to_string())
    }

    /// Mark records as synced
    fn mark_records_synced(&self, records: &[SyncRecord], synced_at: i64) -> Result<(), String> {
        for record in records {
            let query = format!(
                "UPDATE {} SET synced_at = ?, sync_version = sync_version + 1 WHERE sync_uuid = ?",
                record.table_name
            );
            self.db
                .execute_sql(&query, &[&synced_at.to_string(), &record.row_id])
                .map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    /// Get last sync timestamp from metadata
    fn get_last_sync_timestamp(&self) -> Result<Option<i64>, String> {
        self.db
            .query_optional_i64(
                "SELECT last_sync_timestamp FROM sync_metadata WHERE table_name = 'global' LIMIT 1",
                &[],
            )
            .map_err(|e| e.to_string())
    }

    /// Update last sync timestamp
    fn update_last_sync_timestamp(&self, timestamp: i64) -> Result<(), String> {
        self.db
            .execute_sql(
                "INSERT OR REPLACE INTO sync_metadata (table_name, last_sync_timestamp) VALUES ('global', ?)",
                &[&timestamp.to_string()],
            )
            .map_err(|e| e.to_string())
    }

    /// Count pending changes
    fn count_pending_changes(&self) -> Result<usize, String> {
        let mut count = 0;

        // Count portfolios
        count += self.db
            .query_count("SELECT COUNT(*) FROM portfolios WHERE synced_at IS NULL OR is_deleted = 1")
            .map_err(|e| e.to_string())?;

        // Count entries
        count += self.db
            .query_count("SELECT COUNT(*) FROM portfolio_entries WHERE synced_at IS NULL OR is_deleted = 1")
            .map_err(|e| e.to_string())?;

        // Count payments
        count += self.db
            .query_count("SELECT COUNT(*) FROM bond_coupon_payments WHERE synced_at IS NULL OR is_deleted = 1")
            .map_err(|e| e.to_string())?;

        Ok(count)
    }

    /// Get app_id from stored auth data
    async fn get_app_id(&self, app_handle: &tauri::AppHandle) -> Result<String, String> {
        use tauri_plugin_store::StoreExt;

        let store = app_handle
            .store("auth.json")
            .map_err(|e| format!("Failed to access store: {}", e))?;

        store
            .get("app_id")
            .and_then(|v| v.as_str().map(|s| s.to_string()))
            .ok_or_else(|| "No app ID found".to_string())
    }
}
