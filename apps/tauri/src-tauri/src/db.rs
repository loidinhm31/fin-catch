use rusqlite::{Connection, Result, params};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Portfolio {
    pub id: String, // UUID
    pub name: String,
    pub description: Option<String>,
    pub base_currency: Option<String>, // Base currency for portfolio (e.g., "USD", "VND")
    pub created_at: i64, // Unix timestamp
    // Sync fields
    pub sync_version: i64,
    pub synced_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortfolioEntry {
    pub id: String, // UUID
    pub portfolio_id: String, // UUID reference
    pub asset_type: String, // "stock", "gold", or "bond"
    pub symbol: String,
    pub quantity: f64,
    pub purchase_price: f64,
    pub currency: Option<String>, // Currency of purchase price (e.g., "USD", "VND")
    pub purchase_date: i64, // Unix timestamp
    pub notes: Option<String>,
    pub tags: Option<String>, // JSON array as string
    pub transaction_fees: Option<f64>,
    pub source: Option<String>, // Stock or gold source
    pub created_at: i64,
    // Gold-specific fields
    pub unit: Option<String>, // Unit of quantity for gold: "gram", "mace", "tael", "ounce", "kg"
    pub gold_type: Option<String>, // Type of gold (e.g., "1" for SJC HCMC, "2" for SJC Hanoi, "49" for SJC rings)
    // Bond-specific fields
    pub face_value: Option<f64>, // Par/nominal value
    pub coupon_rate: Option<f64>, // Annual rate as percentage (e.g., 5.0)
    pub maturity_date: Option<i64>, // Unix timestamp
    pub coupon_frequency: Option<String>, // "annual", "semiannual", "quarterly", "monthly"
    pub current_market_price: Option<f64>, // User-entered current price
    pub last_price_update: Option<i64>, // Unix timestamp of last price update
    pub ytm: Option<f64>, // Yield to Maturity as percentage (used in calculated mode)
    // Stock alert fields (synced to server, monitoring handled by qm-sync)
    pub target_price: Option<f64>,      // Take-profit price
    pub stop_loss: Option<f64>,         // Stop-loss price
    pub alert_enabled: Option<bool>,    // Alerts active (default true when prices set)
    // Alert tracking fields (updated by server when alerts trigger)
    pub last_alert_at: Option<i64>,     // Unix timestamp of last triggered alert
    pub alert_count: Option<i32>,       // Number of times alert has been triggered (max 3)
    pub last_alert_type: Option<String>, // Type of last triggered alert ("target" or "stop_loss")
    // Sync fields
    pub sync_version: i64,
    pub synced_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BondCouponPayment {
    pub id: String, // UUID
    pub entry_id: String, // UUID reference to PortfolioEntry.id
    pub payment_date: i64, // Unix timestamp
    pub amount: f64, // Coupon amount received
    pub currency: String, // Payment currency
    pub notes: Option<String>,
    pub created_at: i64,
    // Sync fields
    pub sync_version: i64,
    pub synced_at: Option<i64>,
}

pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    pub fn new(db_path: PathBuf) -> Result<Self> {
        let conn = Connection::open(db_path)?;

        // Create portfolios table with UUID primary key
        conn.execute(
            "CREATE TABLE IF NOT EXISTS portfolios (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                base_currency TEXT,
                created_at INTEGER NOT NULL,
                sync_version INTEGER DEFAULT 1,
                synced_at INTEGER,
                deleted INTEGER DEFAULT 0,
                deleted_at INTEGER
            )",
            [],
        )?;

        // Create portfolio_entries table with UUID primary key
        conn.execute(
            "CREATE TABLE IF NOT EXISTS portfolio_entries (
                id TEXT PRIMARY KEY,
                portfolio_id TEXT NOT NULL,
                asset_type TEXT NOT NULL,
                symbol TEXT NOT NULL,
                quantity REAL NOT NULL,
                purchase_price REAL NOT NULL,
                currency TEXT,
                purchase_date INTEGER NOT NULL,
                notes TEXT,
                tags TEXT,
                transaction_fees REAL,
                source TEXT,
                created_at INTEGER NOT NULL,
                unit TEXT,
                gold_type TEXT,
                face_value REAL,
                coupon_rate REAL,
                maturity_date INTEGER,
                coupon_frequency TEXT,
                current_market_price REAL,
                last_price_update INTEGER,
                ytm REAL,
                target_price REAL,
                stop_loss REAL,
                alert_enabled INTEGER DEFAULT 1,
                last_alert_at INTEGER,
                alert_count INTEGER,
                last_alert_type TEXT,
                sync_version INTEGER DEFAULT 1,
                synced_at INTEGER,
                deleted INTEGER DEFAULT 0,
                deleted_at INTEGER,
                FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // Create settings table for alert configuration
        conn.execute(
            "CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )",
            [],
        )?;

        // Run migrations for existing databases
        Self::run_migrations(&conn)?;

        // Create bond_coupon_payments table with UUID primary key
        conn.execute(
            "CREATE TABLE IF NOT EXISTS bond_coupon_payments (
                id TEXT PRIMARY KEY,
                entry_id TEXT NOT NULL,
                payment_date INTEGER NOT NULL,
                amount REAL NOT NULL,
                currency TEXT NOT NULL,
                notes TEXT,
                created_at INTEGER NOT NULL,
                sync_version INTEGER DEFAULT 1,
                synced_at INTEGER,
                deleted INTEGER DEFAULT 0,
                deleted_at INTEGER,
                FOREIGN KEY (entry_id) REFERENCES portfolio_entries(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // Create sync_metadata table with checkpoint columns
        conn.execute(
            "CREATE TABLE IF NOT EXISTS sync_metadata (
                key TEXT PRIMARY KEY,
                checkpoint_updated_at TEXT,
                checkpoint_id TEXT
            )",
            [],
        )?;

        // Create indexes for foreign keys
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_entries_portfolio_id ON portfolio_entries(portfolio_id)",
            [],
        )?;

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_payments_entry_id ON bond_coupon_payments(entry_id)",
            [],
        )?;

        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    /// Run database migrations for existing databases
    fn run_migrations(conn: &Connection) -> Result<()> {
        // Check if alert columns exist, add them if not
        let columns: Vec<String> = conn
            .prepare("PRAGMA table_info(portfolio_entries)")?
            .query_map([], |row| row.get::<_, String>(1))?
            .filter_map(|r| r.ok())
            .collect();

        if !columns.contains(&"target_price".to_string()) {
            conn.execute("ALTER TABLE portfolio_entries ADD COLUMN target_price REAL", [])?;
        }
        if !columns.contains(&"stop_loss".to_string()) {
            conn.execute("ALTER TABLE portfolio_entries ADD COLUMN stop_loss REAL", [])?;
        }
        if !columns.contains(&"alert_enabled".to_string()) {
            conn.execute("ALTER TABLE portfolio_entries ADD COLUMN alert_enabled INTEGER DEFAULT 1", [])?;
        }
        if !columns.contains(&"last_alert_at".to_string()) {
            conn.execute("ALTER TABLE portfolio_entries ADD COLUMN last_alert_at INTEGER", [])?;
        }
        if !columns.contains(&"alert_count".to_string()) {
            conn.execute("ALTER TABLE portfolio_entries ADD COLUMN alert_count INTEGER", [])?;
        }
        if !columns.contains(&"last_alert_type".to_string()) {
            conn.execute("ALTER TABLE portfolio_entries ADD COLUMN last_alert_type TEXT", [])?;
        }

        Ok(())
    }

    // Portfolio CRUD operations
    pub fn create_portfolio(&self, portfolio: &Portfolio) -> Result<String> {
        let conn = self.conn.lock().unwrap();
        let id = portfolio.id.clone();
        conn.execute(
            "INSERT INTO portfolios (id, name, description, base_currency, created_at, sync_version, synced_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                id,
                portfolio.name,
                portfolio.description,
                portfolio.base_currency,
                portfolio.created_at,
                portfolio.sync_version,
                portfolio.synced_at
            ],
        )?;
        Ok(id)
    }

    pub fn get_portfolio(&self, id: &str) -> Result<Portfolio> {
        let conn = self.conn.lock().unwrap();
        conn.query_row(
            "SELECT id, name, description, base_currency, created_at, sync_version, synced_at
             FROM portfolios WHERE id = ?1",
            params![id],
            |row| {
                Ok(Portfolio {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    description: row.get(2)?,
                    base_currency: row.get(3)?,
                    created_at: row.get(4)?,
                    sync_version: row.get(5)?,
                    synced_at: row.get(6)?,
                })
            },
        )
    }

    pub fn list_portfolios(&self) -> Result<Vec<Portfolio>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, description, base_currency, created_at, sync_version, synced_at
             FROM portfolios WHERE deleted = 0 ORDER BY created_at DESC"
        )?;
        let portfolios = stmt.query_map([], |row| {
            Ok(Portfolio {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                base_currency: row.get(3)?,
                created_at: row.get(4)?,
                sync_version: row.get(5)?,
                synced_at: row.get(6)?,
            })
        })?;

        portfolios.collect()
    }

    pub fn update_portfolio(&self, portfolio: &Portfolio) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        // Clear synced_at and increment sync_version to mark as pending sync
        conn.execute(
            "UPDATE portfolios SET name = ?1, description = ?2, base_currency = ?3, synced_at = NULL, sync_version = sync_version + 1 WHERE id = ?4",
            params![portfolio.name, portfolio.description, portfolio.base_currency, portfolio.id],
        )?;
        Ok(())
    }

    pub fn delete_portfolio(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64;
        
        // First, cascade soft-delete to payments of entries in this portfolio
        conn.execute(
            "UPDATE bond_coupon_payments SET deleted = 1, deleted_at = ?1, synced_at = NULL 
             WHERE entry_id IN (SELECT id FROM portfolio_entries WHERE portfolio_id = ?2)",
            params![now, id]
        )?;
        
        // Then, cascade soft-delete to entries in this portfolio
        conn.execute(
            "UPDATE portfolio_entries SET deleted = 1, deleted_at = ?1, synced_at = NULL WHERE portfolio_id = ?2",
            params![now, id]
        )?;
        
        // Finally, soft-delete the portfolio itself
        conn.execute(
            "UPDATE portfolios SET deleted = 1, deleted_at = ?1, synced_at = NULL WHERE id = ?2",
            params![now, id]
        )?;
        Ok(())
    }

    // Portfolio Entry CRUD operations
    pub fn create_entry(&self, entry: &PortfolioEntry) -> Result<String> {
        let conn = self.conn.lock().unwrap();
        let id = entry.id.clone();
        conn.execute(
            "INSERT INTO portfolio_entries (
                id, portfolio_id, asset_type, symbol, quantity, purchase_price, currency,
                purchase_date, notes, tags, transaction_fees, source, created_at, unit, gold_type,
                face_value, coupon_rate, maturity_date, coupon_frequency, current_market_price, last_price_update, ytm,
                target_price, stop_loss, alert_enabled, last_alert_at, alert_count, last_alert_type,
                sync_version, synced_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?23, ?24, ?25, ?26, ?27, ?28, ?29, ?30)",
            params![
                id,
                entry.portfolio_id,
                entry.asset_type,
                entry.symbol,
                entry.quantity,
                entry.purchase_price,
                entry.currency,
                entry.purchase_date,
                entry.notes,
                entry.tags,
                entry.transaction_fees,
                entry.source,
                entry.created_at,
                entry.unit,
                entry.gold_type,
                entry.face_value,
                entry.coupon_rate,
                entry.maturity_date,
                entry.coupon_frequency,
                entry.current_market_price,
                entry.last_price_update,
                entry.ytm,
                entry.target_price,
                entry.stop_loss,
                entry.alert_enabled,
                entry.last_alert_at,
                entry.alert_count,
                entry.last_alert_type,
                entry.sync_version,
                entry.synced_at
            ],
        )?;
        Ok(id)
    }

    pub fn get_entry(&self, id: &str) -> Result<PortfolioEntry> {
        let conn = self.conn.lock().unwrap();
        conn.query_row(
            "SELECT id, portfolio_id, asset_type, symbol, quantity, purchase_price, currency,
                    purchase_date, notes, tags, transaction_fees, source, created_at, unit, gold_type,
                    face_value, coupon_rate, maturity_date, coupon_frequency, current_market_price, last_price_update, ytm,
                    target_price, stop_loss, alert_enabled, last_alert_at, alert_count, last_alert_type,
                    sync_version, synced_at
             FROM portfolio_entries WHERE id = ?1",
            params![id],
            |row| {
                Ok(PortfolioEntry {
                    id: row.get(0)?,
                    portfolio_id: row.get(1)?,
                    asset_type: row.get(2)?,
                    symbol: row.get(3)?,
                    quantity: row.get(4)?,
                    purchase_price: row.get(5)?,
                    currency: row.get(6)?,
                    purchase_date: row.get(7)?,
                    notes: row.get(8)?,
                    tags: row.get(9)?,
                    transaction_fees: row.get(10)?,
                    source: row.get(11)?,
                    created_at: row.get(12)?,
                    unit: row.get(13)?,
                    gold_type: row.get(14)?,
                    face_value: row.get(15)?,
                    coupon_rate: row.get(16)?,
                    maturity_date: row.get(17)?,
                    coupon_frequency: row.get(18)?,
                    current_market_price: row.get(19)?,
                    last_price_update: row.get(20)?,
                    ytm: row.get(21)?,
                    target_price: row.get(22)?,
                    stop_loss: row.get(23)?,
                    alert_enabled: row.get(24)?,
                    last_alert_at: row.get(25)?,
                    alert_count: row.get(26)?,
                    last_alert_type: row.get(27)?,
                    sync_version: row.get(28)?,
                    synced_at: row.get(29)?,
                })
            },
        )
    }

    pub fn list_entries(&self, portfolio_id: &str) -> Result<Vec<PortfolioEntry>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, portfolio_id, asset_type, symbol, quantity, purchase_price, currency,
                    purchase_date, notes, tags, transaction_fees, source, created_at, unit, gold_type,
                    face_value, coupon_rate, maturity_date, coupon_frequency, current_market_price, last_price_update, ytm,
                    target_price, stop_loss, alert_enabled, last_alert_at, alert_count, last_alert_type,
                    sync_version, synced_at
             FROM portfolio_entries WHERE portfolio_id = ?1 AND deleted = 0 ORDER BY created_at DESC"
        )?;
        let entries = stmt.query_map(params![portfolio_id], |row| {
            Ok(PortfolioEntry {
                id: row.get(0)?,
                portfolio_id: row.get(1)?,
                asset_type: row.get(2)?,
                symbol: row.get(3)?,
                quantity: row.get(4)?,
                purchase_price: row.get(5)?,
                currency: row.get(6)?,
                purchase_date: row.get(7)?,
                notes: row.get(8)?,
                tags: row.get(9)?,
                transaction_fees: row.get(10)?,
                source: row.get(11)?,
                created_at: row.get(12)?,
                unit: row.get(13)?,
                gold_type: row.get(14)?,
                face_value: row.get(15)?,
                coupon_rate: row.get(16)?,
                maturity_date: row.get(17)?,
                coupon_frequency: row.get(18)?,
                current_market_price: row.get(19)?,
                last_price_update: row.get(20)?,
                ytm: row.get(21)?,
                target_price: row.get(22)?,
                stop_loss: row.get(23)?,
                alert_enabled: row.get(24)?,
                last_alert_at: row.get(25)?,
                alert_count: row.get(26)?,
                last_alert_type: row.get(27)?,
                sync_version: row.get(28)?,
                synced_at: row.get(29)?,
            })
        })?;

        entries.collect()
    }

    pub fn update_entry(&self, entry: &PortfolioEntry) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        // Clear synced_at and increment sync_version to mark as pending sync
        conn.execute(
            "UPDATE portfolio_entries SET
                asset_type = ?1, symbol = ?2, quantity = ?3, purchase_price = ?4, currency = ?5,
                purchase_date = ?6, notes = ?7, tags = ?8, transaction_fees = ?9, source = ?10,
                unit = ?11, gold_type = ?12, face_value = ?13, coupon_rate = ?14, maturity_date = ?15,
                coupon_frequency = ?16, current_market_price = ?17, last_price_update = ?18, ytm = ?19,
                target_price = ?20, stop_loss = ?21, alert_enabled = ?22,
                last_alert_at = ?23, alert_count = ?24, last_alert_type = ?25,
                synced_at = NULL, sync_version = sync_version + 1
             WHERE id = ?26",
            params![
                entry.asset_type,
                entry.symbol,
                entry.quantity,
                entry.purchase_price,
                entry.currency,
                entry.purchase_date,
                entry.notes,
                entry.tags,
                entry.transaction_fees,
                entry.source,
                entry.unit,
                entry.gold_type,
                entry.face_value,
                entry.coupon_rate,
                entry.maturity_date,
                entry.coupon_frequency,
                entry.current_market_price,
                entry.last_price_update,
                entry.ytm,
                entry.target_price,
                entry.stop_loss,
                entry.alert_enabled,
                entry.last_alert_at,
                entry.alert_count,
                entry.last_alert_type,
                entry.id,
            ],
        )?;
        Ok(())
    }

    pub fn delete_entry(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64;
        
        // First, cascade soft-delete to payments of this entry
        conn.execute(
            "UPDATE bond_coupon_payments SET deleted = 1, deleted_at = ?1, synced_at = NULL WHERE entry_id = ?2",
            params![now, id]
        )?;
        
        // Then, soft-delete the entry itself
        conn.execute(
            "UPDATE portfolio_entries SET deleted = 1, deleted_at = ?1, synced_at = NULL WHERE id = ?2",
            params![now, id]
        )?;
        Ok(())
    }

    // Bond Coupon Payment CRUD operations
    pub fn create_coupon_payment(&self, payment: &BondCouponPayment) -> Result<String> {
        let conn = self.conn.lock().unwrap();
        let id = payment.id.clone();
        conn.execute(
            "INSERT INTO bond_coupon_payments (
                id, entry_id, payment_date, amount, currency, notes, created_at, sync_version, synced_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                id,
                payment.entry_id,
                payment.payment_date,
                payment.amount,
                payment.currency,
                payment.notes,
                payment.created_at,
                payment.sync_version,
                payment.synced_at,
            ],
        )?;
        Ok(id)
    }

    pub fn list_coupon_payments(&self, entry_id: &str) -> Result<Vec<BondCouponPayment>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, entry_id, payment_date, amount, currency, notes, created_at, sync_version, synced_at
             FROM bond_coupon_payments WHERE entry_id = ?1 AND deleted = 0 ORDER BY payment_date DESC"
        )?;
        let payments = stmt.query_map(params![entry_id], |row| {
            Ok(BondCouponPayment {
                id: row.get(0)?,
                entry_id: row.get(1)?,
                payment_date: row.get(2)?,
                amount: row.get(3)?,
                currency: row.get(4)?,
                notes: row.get(5)?,
                created_at: row.get(6)?,
                sync_version: row.get(7)?,
                synced_at: row.get(8)?,
                
            })
        })?;

        payments.collect()
    }

    pub fn update_coupon_payment(&self, payment: &BondCouponPayment) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        // Clear synced_at and increment sync_version to mark as pending sync
        conn.execute(
            "UPDATE bond_coupon_payments SET
                payment_date = ?1, amount = ?2, currency = ?3, notes = ?4,
                synced_at = NULL, sync_version = sync_version + 1
             WHERE id = ?5",
            params![
                payment.payment_date,
                payment.amount,
                payment.currency,
                payment.notes,
                payment.id,
            ],
        )?;
        Ok(())
    }

    pub fn delete_coupon_payment(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64;
        
        conn.execute(
            "UPDATE bond_coupon_payments SET deleted = 1, deleted_at = ?1, synced_at = NULL WHERE id = ?2",
            params![now, id]
        )?;
        Ok(())
    }

    // Helper methods for sync operations

    pub fn execute_sql(&self, query: &str, params: &[&str]) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(query)?;
        stmt.execute(rusqlite::params_from_iter(params.iter()))?;
        Ok(())
    }

    pub fn query_optional_i64(&self, query: &str, params: &[&str]) -> Result<Option<i64>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(query)?;
        let result = stmt.query_row(rusqlite::params_from_iter(params.iter()), |row| {
            // Try to get as i64 first
            if let Ok(val) = row.get::<_, i64>(0) {
                return Ok(val);
            }
            // If that fails, try to get as TEXT and parse
            if let Ok(text) = row.get::<_, String>(0) {
                return text.parse::<i64>()
                    .map_err(|_| rusqlite::Error::InvalidColumnType(0, "last_sync_timestamp".to_string(), rusqlite::types::Type::Text));
            }
            Err(rusqlite::Error::InvalidColumnType(0, "unknown".to_string(), rusqlite::types::Type::Null))
        });
        match result {
            Ok(value) => Ok(Some(value)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    pub fn query_count(&self, query: &str) -> Result<usize> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(query)?;
        let count: i64 = stmt.query_row([], |row| row.get(0))?;
        Ok(count as usize)
    }

    // Query deleted records that need to be synced
    pub fn query_deleted_portfolios(&self) -> Result<Vec<Portfolio>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, description, base_currency, created_at, sync_version, synced_at
             FROM portfolios WHERE deleted = 1 AND synced_at IS NULL"
        )?;
        let portfolios = stmt.query_map([], |row| {
            Ok(Portfolio {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                base_currency: row.get(3)?,
                created_at: row.get(4)?,
                sync_version: row.get(5)?,
                synced_at: row.get(6)?,
            })
        })?;
        portfolios.collect()
    }

    pub fn query_deleted_entries(&self) -> Result<Vec<PortfolioEntry>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, portfolio_id, asset_type, symbol, quantity, purchase_price, currency,
                    purchase_date, notes, tags, transaction_fees, source, created_at, unit, gold_type,
                    face_value, coupon_rate, maturity_date, coupon_frequency, current_market_price, last_price_update, ytm,
                    target_price, stop_loss, alert_enabled, last_alert_at, alert_count, last_alert_type,
                    sync_version, synced_at
             FROM portfolio_entries WHERE deleted = 1 AND synced_at IS NULL"
        )?;
        let entries = stmt.query_map([], |row| {
            Ok(PortfolioEntry {
                id: row.get(0)?,
                portfolio_id: row.get(1)?,
                asset_type: row.get(2)?,
                symbol: row.get(3)?,
                quantity: row.get(4)?,
                purchase_price: row.get(5)?,
                currency: row.get(6)?,
                purchase_date: row.get(7)?,
                notes: row.get(8)?,
                tags: row.get(9)?,
                transaction_fees: row.get(10)?,
                source: row.get(11)?,
                created_at: row.get(12)?,
                unit: row.get(13)?,
                gold_type: row.get(14)?,
                face_value: row.get(15)?,
                coupon_rate: row.get(16)?,
                maturity_date: row.get(17)?,
                coupon_frequency: row.get(18)?,
                current_market_price: row.get(19)?,
                last_price_update: row.get(20)?,
                ytm: row.get(21)?,
                target_price: row.get(22)?,
                stop_loss: row.get(23)?,
                alert_enabled: row.get(24)?,
                last_alert_at: row.get(25)?,
                alert_count: row.get(26)?,
                last_alert_type: row.get(27)?,
                sync_version: row.get(28)?,
                synced_at: row.get(29)?,
            })
        })?;
        entries.collect()
    }

    pub fn query_deleted_payments(&self, _entry_id: &str) -> Result<Vec<BondCouponPayment>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, entry_id, payment_date, amount, currency, notes, created_at, sync_version, synced_at
             FROM bond_coupon_payments WHERE deleted = 1 AND synced_at IS NULL"
        )?;
        let payments = stmt.query_map([], |row| {
            Ok(BondCouponPayment {
                id: row.get(0)?,
                entry_id: row.get(1)?,
                payment_date: row.get(2)?,
                amount: row.get(3)?,
                currency: row.get(4)?,
                notes: row.get(5)?,
                created_at: row.get(6)?,
                sync_version: row.get(7)?,
                synced_at: row.get(8)?,
            })
        })?;
        payments.collect()
    }

    // Hard delete methods for permanently removing records
    pub fn hard_delete_portfolio(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        // First, delete payments for entries in this portfolio
        conn.execute(
            "DELETE FROM bond_coupon_payments WHERE entry_id IN (SELECT id FROM portfolio_entries WHERE portfolio_id = ?1)",
            params![id]
        )?;
        // Then, delete entries in this portfolio
        conn.execute("DELETE FROM portfolio_entries WHERE portfolio_id = ?1", params![id])?;
        // Finally, delete the portfolio
        conn.execute("DELETE FROM portfolios WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn hard_delete_entry(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        // First, delete payments for this entry
        conn.execute("DELETE FROM bond_coupon_payments WHERE entry_id = ?1", params![id])?;
        // Then, delete the entry
        conn.execute("DELETE FROM portfolio_entries WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn hard_delete_payment(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM bond_coupon_payments WHERE id = ?1", params![id])?;
        Ok(())
    }

    // Checkpoint management for sync
    pub fn get_checkpoint(&self) -> Result<Option<(String, String)>> {
        let conn = self.conn.lock().unwrap();
        let result = conn.query_row(
            "SELECT checkpoint_updated_at, checkpoint_id FROM sync_metadata WHERE key = 'global'",
            [],
            |row| {
                let updated_at: Option<String> = row.get(0)?;
                let id: Option<String> = row.get(1)?;
                Ok((updated_at, id))
            },
        );
        match result {
            Ok((Some(updated_at), Some(id))) => Ok(Some((updated_at, id))),
            Ok(_) => Ok(None),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    pub fn save_checkpoint(&self, updated_at: &str, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO sync_metadata (key, checkpoint_updated_at, checkpoint_id) VALUES ('global', ?1, ?2)",
            params![updated_at, id],
        )?;
        Ok(())
    }

    //==========================================================================
    // Alert-related methods (monitoring moved to qm-sync server)
    //==========================================================================

    /// Update alert settings for a specific entry (synced to server for monitoring)
    pub fn set_entry_alerts(
        &self,
        entry_id: &str,
        target_price: Option<f64>,
        stop_loss: Option<f64>,
        alert_enabled: Option<bool>,
    ) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        // Clear synced_at and increment sync_version to mark as pending sync
        conn.execute(
            "UPDATE portfolio_entries SET target_price = ?1, stop_loss = ?2, alert_enabled = ?3, synced_at = NULL, sync_version = sync_version + 1 WHERE id = ?4",
            params![target_price, stop_loss, alert_enabled, entry_id],
        )?;
        Ok(())
    }

    //==========================================================================
    // Settings methods
    //==========================================================================

    /// Get a setting value
    pub fn get_setting(&self, key: &str) -> Result<Option<String>> {
        let conn = self.conn.lock().unwrap();
        let result = conn.query_row(
            "SELECT value FROM settings WHERE key = ?1",
            params![key],
            |row| row.get::<_, String>(0),
        );
        match result {
            Ok(value) => Ok(Some(value)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    /// Set a setting value
    pub fn set_setting(&self, key: &str, value: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)",
            params![key, value],
        )?;
        Ok(())
    }
}
