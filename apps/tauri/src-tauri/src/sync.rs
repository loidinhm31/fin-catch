use std::sync::Arc;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use qm_sync_client::{Checkpoint, ReqwestHttpClient, QmSyncClient, SyncClientConfig, SyncRecord};

use crate::auth::AuthService;
use crate::db::{BondCouponPayment, Database, Portfolio, PortfolioEntry};

/// Sync service for synchronizing local data with qm-sync
#[derive(Clone)]
pub struct SyncService {
    db: Arc<Database>,
    auth: Arc<std::sync::Mutex<AuthService>>,
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

impl SyncService {
    /// Create a new SyncService
    pub fn new(
        db: Arc<Database>,
        auth: Arc<std::sync::Mutex<AuthService>>,
    ) -> Self {
        Self { db, auth }
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

        // Get last sync timestamp from checkpoint
        let last_sync_at = self.get_last_sync_timestamp()?;

        // Count pending changes (records with synced_at = NULL)
        let pending_changes = self.count_pending_changes()?;

        // Get server URL from env
        let server_url = std::env::var("SYNC_SERVER_URL").ok();

        Ok(SyncStatus {
            configured: server_url.is_some(),
            authenticated: is_authenticated,
            last_sync_at,
            pending_changes,
            server_url,
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

        // Get config from auth/env
        let (server_url, app_id, api_key, access_token, refresh_token) = {
            let auth = self.auth.lock().map_err(|e| format!("Failed to lock auth: {}", e))?.clone();
            let access_token = auth.get_access_token(app_handle).await?;
            let refresh_token = auth.get_refresh_token(app_handle).await?;
            let server_url = std::env::var("SYNC_SERVER_URL")
                .map_err(|_| "SYNC_SERVER_URL not configured")?;
            let app_id = self.get_app_id(app_handle).await?;
            let api_key = auth.get_stored_api_key(app_handle)?;
            (server_url, app_id, api_key, access_token, refresh_token)
        };

        // Create QmSyncClient with ReqwestHttpClient
        let config = SyncClientConfig::new(&server_url, &app_id, &api_key);
        let http = ReqwestHttpClient::new();
        let client = QmSyncClient::new(config, http);

        // Set tokens from our AuthService
        client.set_tokens(access_token, refresh_token, None).await;

        // Collect local changes
        let local_changes = self.collect_local_changes().await?;

        // Get checkpoint
        let checkpoint = self.get_checkpoint()?;

        println!("Syncing {} local changes, checkpoint: {:?}", local_changes.len(), checkpoint);
        for record in &local_changes {
            println!("DEBUG: Sending record: table={}, row_id={}, deleted={}, version={}", 
                record.table_name, record.row_id, record.deleted, record.version);
        }

        // Call delta sync via client library
        let response = client.delta(local_changes.clone(), checkpoint).await
            .map_err(|e| format!("Sync failed: {}", e))?;

        let mut pushed = 0;
        let mut conflicts = 0;
        let mut pulled = 0;

        // Process push result
        if let Some(push) = &response.push {
            pushed = push.synced;
            conflicts = push.conflicts.len();
            self.mark_records_synced(&local_changes, start_time)?;
        }

        // Process pull result
        if let Some(pull) = &response.pull {
            pulled = pull.records.len();
            
            // Convert PullRecords to SyncRecords and apply
            let sync_records: Vec<SyncRecord> = pull.records.iter().map(|r| SyncRecord {
                table_name: r.table_name.clone(),
                row_id: r.row_id.clone(),
                data: r.data.clone(),
                version: r.version,
                deleted: r.deleted,
            }).collect();
            
            self.apply_remote_changes(&sync_records).await?;
            
            // Save new checkpoint
            self.save_checkpoint(&pull.checkpoint)?;
        }

        Ok(SyncResult {
            pushed,
            pulled,
            conflicts,
            success: true,
            error: None,
            synced_at: start_time,
        })
    }

    /// Collect local changes since last sync
    async fn collect_local_changes(&self) -> Result<Vec<SyncRecord>, String> {
        let mut records = Vec::new();

        // Collect unsynced deleted portfolios
        let deleted_portfolios = self.db.query_deleted_portfolios().map_err(|e| e.to_string())?;
        println!("DEBUG: Found {} deleted portfolios to sync", deleted_portfolios.len());
        for portfolio in &deleted_portfolios {
            println!("DEBUG: Deleted portfolio: id={}, synced_at={:?}", portfolio.id, portfolio.synced_at);
        }
        for portfolio in deleted_portfolios {
            records.push(SyncRecord {
                table_name: "portfolios".to_string(),
                row_id: portfolio.id,
                data: serde_json::json!({}),
                version: portfolio.sync_version,
                deleted: true,
            });
        }

        // Collect portfolio changes (active records)
        let portfolios = self.db.list_portfolios().map_err(|e| e.to_string())?;
        for portfolio in portfolios {
            if portfolio.synced_at.is_none() {
                records.push(self.portfolio_to_sync_record(&portfolio, false)?);
            }
        }

        // Collect unsynced deleted entries
        let deleted_entries = self.db.query_deleted_entries().map_err(|e| e.to_string())?;
        for entry in deleted_entries {
            records.push(SyncRecord {
                table_name: "portfolio_entries".to_string(),
                row_id: entry.id,
                data: serde_json::json!({}),
                version: entry.sync_version,
                deleted: true,
            });
        }

        // Collect portfolio entry changes (active records)
        for portfolio in self.db.list_portfolios().map_err(|e| e.to_string())? {
            let entries = self.db.list_entries(&portfolio.id).map_err(|e| e.to_string())?;
            for entry in entries {
                if entry.synced_at.is_none() {
                    records.push(self.entry_to_sync_record(&entry, &portfolio, false).await?);
                }
            }

            // Collect unsynced deleted payments
            let deleted_payments = self.db.query_deleted_payments(&portfolio.id).map_err(|e| e.to_string())?;
            for payment in deleted_payments {
                records.push(SyncRecord {
                    table_name: "bond_coupon_payments".to_string(),
                    row_id: payment.id,
                    data: serde_json::json!({}),
                    version: payment.sync_version,
                    deleted: true,
                });
            }

            // Collect bond coupon payment changes (active records)
            for entry in self.db.list_entries(&portfolio.id).map_err(|e| e.to_string())? {
                let payments = self.db.list_coupon_payments(&entry.id).map_err(|e| e.to_string())?;
                for payment in payments {
                    if payment.synced_at.is_none() {
                        records.push(self.payment_to_sync_record(&payment, &entry, false).await?);
                    }
                }
            }
        }

        Ok(records)
    }

    /// Convert Portfolio to SyncRecord
    fn portfolio_to_sync_record(&self, portfolio: &Portfolio, deleted: bool) -> Result<SyncRecord, String> {
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
            row_id: portfolio.id.clone(),
            data,
            version: portfolio.sync_version,
            deleted,
        })
    }

    /// Convert PortfolioEntry to SyncRecord
    async fn entry_to_sync_record(
        &self,
        entry: &PortfolioEntry,
        portfolio: &Portfolio,
        deleted: bool,
    ) -> Result<SyncRecord, String> {
        let mut data = serde_json::json!({
            "portfolioSyncUuid": portfolio.id,
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
            // Alert fields (synced, but not last_alert_at and alert_triggered which are local-only)
            "targetPrice": entry.target_price,
            "stopLoss": entry.stop_loss,
            "alertEnabled": entry.alert_enabled,
        });

        // Remove null fields
        if let Some(obj) = data.as_object_mut() {
            obj.retain(|_, v| !v.is_null());
        }

        Ok(SyncRecord {
            table_name: "portfolio_entries".to_string(),
            row_id: entry.id.clone(),
            data,
            version: entry.sync_version,
            deleted,
        })
    }

    /// Convert BondCouponPayment to SyncRecord
    async fn payment_to_sync_record(
        &self,
        payment: &BondCouponPayment,
        entry: &PortfolioEntry,
        deleted: bool,
    ) -> Result<SyncRecord, String> {
        let mut data = serde_json::json!({
            "entrySyncUuid": entry.id,
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
            row_id: payment.id.clone(),
            data,
            version: payment.sync_version,
            deleted,
        })
    }

    /// Apply remote changes to local database
    /// 
    /// Records are sorted to handle FK constraints properly:
    /// - For non-deleted records: parents first (portfolios -> entries -> payments)
    /// - For deleted records: children first (payments -> entries -> portfolios)
    async fn apply_remote_changes(&self, records: &[SyncRecord]) -> Result<(), String> {
        // Separate records by deleted status
        let mut non_deleted: Vec<&SyncRecord> = records.iter().filter(|r| !r.deleted).collect();
        let mut deleted: Vec<&SyncRecord> = records.iter().filter(|r| r.deleted).collect();

        // Sort non-deleted: parents first (portfolios=0, entries=1, payments=2)
        non_deleted.sort_by_key(|r| match r.table_name.as_str() {
            "portfolios" => 0,
            "portfolio_entries" => 1,
            "bond_coupon_payments" => 2,
            _ => 3,
        });

        // Sort deleted: children first (payments=0, entries=1, portfolios=2)
        deleted.sort_by_key(|r| match r.table_name.as_str() {
            "bond_coupon_payments" => 0,
            "portfolio_entries" => 1,
            "portfolios" => 2,
            _ => 3,
        });

        // Apply non-deleted records first (inserts/updates)
        for record in non_deleted {
            match record.table_name.as_str() {
                "portfolios" => self.apply_portfolio_change(record)?,
                "portfolio_entries" => self.apply_entry_change(record).await?,
                "bond_coupon_payments" => self.apply_payment_change(record).await?,
                _ => {
                    eprintln!("Unknown table: {}", record.table_name);
                }
            }
        }

        // Apply deleted records (children first to avoid FK violations)
        for record in deleted {
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
        // If deleted, hard delete locally
        if record.deleted {
            self.db.hard_delete_portfolio(&record.row_id).map_err(|e| e.to_string())?;
            return Ok(());
        }

        // Check if portfolio exists locally by id
        let exists = self.db.get_portfolio(&record.row_id).is_ok();

        let data = &record.data;
        let portfolio = Portfolio {
            id: record.row_id.clone(),
            name: data["name"].as_str().unwrap_or("").to_string(),
            description: data["description"].as_str().map(|s| s.to_string()),
            base_currency: data["baseCurrency"].as_str().map(|s| s.to_string()),
            created_at: data["createdAt"].as_i64().unwrap_or(0),
            sync_version: record.version,
            synced_at: Some(chrono::Utc::now().timestamp()),
        };

        if exists {
            // Update existing
            self.db.update_portfolio(&portfolio).map_err(|e| e.to_string())?;
        } else {
            // Insert new
            self.db.create_portfolio(&portfolio).map_err(|e| e.to_string())?;
        }

        Ok(())
    }

    /// Apply entry change from remote
    async fn apply_entry_change(&self, record: &SyncRecord) -> Result<(), String> {
        // If deleted, hard delete locally
        if record.deleted {
            self.db.hard_delete_entry(&record.row_id).map_err(|e| e.to_string())?;
            return Ok(());
        }

        let exists = self.db.get_entry(&record.row_id).is_ok();

        let data = &record.data;

        // Get portfolio_id from portfolioSyncUuid
        let portfolio_id = data["portfolioSyncUuid"].as_str()
            .ok_or("Missing portfolioSyncUuid")?
            .to_string();

        let entry = PortfolioEntry {
            id: record.row_id.clone(),
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
            // Alert fields (synced to server for qm-sync monitoring)
            target_price: data["targetPrice"].as_f64(),
            stop_loss: data["stopLoss"].as_f64(),
            alert_enabled: data["alertEnabled"].as_bool(),
            sync_version: record.version,
            synced_at: Some(chrono::Utc::now().timestamp()),
        };

        if exists {
            self.db.update_entry(&entry).map_err(|e| e.to_string())?;
        } else {
            self.db.create_entry(&entry).map_err(|e| e.to_string())?;
        }

        Ok(())
    }

    /// Apply payment change from remote
    async fn apply_payment_change(&self, record: &SyncRecord) -> Result<(), String> {
        // If deleted, hard delete locally
        if record.deleted {
            self.db.hard_delete_payment(&record.row_id).map_err(|e| e.to_string())?;
            return Ok(());
        }

        let exists = self.db.list_coupon_payments(&record.row_id).is_ok();

        let data = &record.data;

        // Get entry_id from entrySyncUuid
        let entry_id = data["entrySyncUuid"].as_str()
            .ok_or("Missing entrySyncUuid")?
            .to_string();

        let payment = BondCouponPayment {
            id: record.row_id.clone(),
            entry_id,
            payment_date: data["paymentDate"].as_i64().unwrap_or(0),
            amount: data["amount"].as_f64().unwrap_or(0.0),
            currency: data["currency"].as_str().unwrap_or("").to_string(),
            notes: data["notes"].as_str().map(|s| s.to_string()),
            created_at: data["createdAt"].as_i64().unwrap_or(0),
            sync_version: record.version,
            synced_at: Some(chrono::Utc::now().timestamp()),
        };

        if exists {
            self.db.update_coupon_payment(&payment).map_err(|e| e.to_string())?;
        } else {
            self.db.create_coupon_payment(&payment).map_err(|e| e.to_string())?;
        }

        Ok(())
    }

    /// Mark records as synced (or hard-delete if they were deleted records)
    fn mark_records_synced(&self, records: &[SyncRecord], synced_at: i64) -> Result<(), String> {
        for record in records {
            if record.deleted {
                // Hard-delete locally after successful push of deleted record
                match record.table_name.as_str() {
                    "portfolios" => self.db.hard_delete_portfolio(&record.row_id),
                    "portfolio_entries" => self.db.hard_delete_entry(&record.row_id),
                    "bond_coupon_payments" => self.db.hard_delete_payment(&record.row_id),
                    _ => Ok(()),
                }.map_err(|e| e.to_string())?;
            } else {
                // Normal: update synced_at for active records
                let query = format!(
                    "UPDATE {} SET synced_at = ?, sync_version = sync_version + 1 WHERE id = ?",
                    record.table_name
                );
                self.db
                    .execute_sql(&query, &[&synced_at.to_string(), &record.row_id])
                    .map_err(|e| e.to_string())?;
            }
        }
        Ok(())
    }

    /// Get checkpoint from database
    fn get_checkpoint(&self) -> Result<Option<Checkpoint>, String> {
        let result = self.db.get_checkpoint().map_err(|e| e.to_string())?;
        match result {
            Some((updated_at_str, id)) => {
                let updated_at = DateTime::parse_from_rfc3339(&updated_at_str)
                    .map(|dt| dt.with_timezone(&Utc))
                    .map_err(|e| format!("Failed to parse checkpoint timestamp: {}", e))?;
                Ok(Some(Checkpoint::new(updated_at, id)))
            }
            None => Ok(None),
        }
    }

    /// Save checkpoint to database
    fn save_checkpoint(&self, checkpoint: &Checkpoint) -> Result<(), String> {
        let updated_at_str = checkpoint.updated_at.to_rfc3339();
        self.db.save_checkpoint(&updated_at_str, &checkpoint.id)
            .map_err(|e| e.to_string())
    }

    /// Get last sync timestamp from checkpoint (for status display)
    fn get_last_sync_timestamp(&self) -> Result<Option<i64>, String> {
        let result = self.db.get_checkpoint().map_err(|e| e.to_string())?;
        match result {
            Some((updated_at_str, _)) => {
                let updated_at = DateTime::parse_from_rfc3339(&updated_at_str)
                    .map(|dt| dt.with_timezone(&Utc))
                    .map_err(|e| format!("Failed to parse checkpoint timestamp: {}", e))?;
                Ok(Some(updated_at.timestamp()))
            }
            None => Ok(None),
        }
    }

    /// Count pending changes
    fn count_pending_changes(&self) -> Result<usize, String> {
        let mut count = 0;

        // Count portfolios
        count += self.db
            .query_count("SELECT COUNT(*) FROM portfolios WHERE synced_at IS NULL")
            .map_err(|e| e.to_string())?;

        // Count entries
        count += self.db
            .query_count("SELECT COUNT(*) FROM portfolio_entries WHERE synced_at IS NULL")
            .map_err(|e| e.to_string())?;

        // Count payments
        count += self.db
            .query_count("SELECT COUNT(*) FROM bond_coupon_payments WHERE synced_at IS NULL")
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
