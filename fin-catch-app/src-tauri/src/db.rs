use rusqlite::{Connection, Result, params};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Portfolio {
    pub id: Option<i64>,
    pub name: String,
    pub description: Option<String>,
    pub base_currency: Option<String>, // Base currency for portfolio (e.g., "USD", "VND")
    pub created_at: i64, // Unix timestamp
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortfolioEntry {
    pub id: Option<i64>,
    pub portfolio_id: i64,
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
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BondCouponPayment {
    pub id: Option<i64>,
    pub entry_id: i64, // References PortfolioEntry.id
    pub payment_date: i64, // Unix timestamp
    pub amount: f64, // Coupon amount received
    pub currency: String, // Payment currency
    pub notes: Option<String>,
    pub created_at: i64,
}

pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    pub fn new(db_path: PathBuf) -> Result<Self> {
        let conn = Connection::open(db_path)?;

        // Create portfolios table with all columns
        conn.execute(
            "CREATE TABLE IF NOT EXISTS portfolios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                base_currency TEXT,
                created_at INTEGER NOT NULL
            )",
            [],
        )?;

        // Create portfolio_entries table with all columns
        conn.execute(
            "CREATE TABLE IF NOT EXISTS portfolio_entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                portfolio_id INTEGER NOT NULL,
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
                FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // Create bond_coupon_payments table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS bond_coupon_payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                entry_id INTEGER NOT NULL,
                payment_date INTEGER NOT NULL,
                amount REAL NOT NULL,
                currency TEXT NOT NULL,
                notes TEXT,
                created_at INTEGER NOT NULL,
                FOREIGN KEY (entry_id) REFERENCES portfolio_entries(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // Create indexes
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_entries_portfolio_id ON portfolio_entries(portfolio_id)",
            [],
        )?;

        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    // Portfolio CRUD operations
    pub fn create_portfolio(&self, portfolio: &Portfolio) -> Result<i64> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO portfolios (name, description, base_currency, created_at) VALUES (?1, ?2, ?3, ?4)",
            params![portfolio.name, portfolio.description, portfolio.base_currency, portfolio.created_at],
        )?;
        Ok(conn.last_insert_rowid())
    }

    pub fn get_portfolio(&self, id: i64) -> Result<Portfolio> {
        let conn = self.conn.lock().unwrap();
        conn.query_row(
            "SELECT id, name, description, base_currency, created_at FROM portfolios WHERE id = ?1",
            params![id],
            |row| {
                Ok(Portfolio {
                    id: Some(row.get(0)?),
                    name: row.get(1)?,
                    description: row.get(2)?,
                    base_currency: row.get(3)?,
                    created_at: row.get(4)?,
                })
            },
        )
    }

    pub fn list_portfolios(&self) -> Result<Vec<Portfolio>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id, name, description, base_currency, created_at FROM portfolios ORDER BY created_at DESC")?;
        let portfolios = stmt.query_map([], |row| {
            Ok(Portfolio {
                id: Some(row.get(0)?),
                name: row.get(1)?,
                description: row.get(2)?,
                base_currency: row.get(3)?,
                created_at: row.get(4)?,
            })
        })?;

        portfolios.collect()
    }

    pub fn update_portfolio(&self, portfolio: &Portfolio) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE portfolios SET name = ?1, description = ?2, base_currency = ?3 WHERE id = ?4",
            params![portfolio.name, portfolio.description, portfolio.base_currency, portfolio.id],
        )?;
        Ok(())
    }

    pub fn delete_portfolio(&self, id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM portfolios WHERE id = ?1", params![id])?;
        Ok(())
    }

    // Portfolio Entry CRUD operations
    pub fn create_entry(&self, entry: &PortfolioEntry) -> Result<i64> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO portfolio_entries (
                portfolio_id, asset_type, symbol, quantity, purchase_price, currency,
                purchase_date, notes, tags, transaction_fees, source, created_at, unit, gold_type,
                face_value, coupon_rate, maturity_date, coupon_frequency, current_market_price, last_price_update, ytm
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21)",
            params![
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
            ],
        )?;
        Ok(conn.last_insert_rowid())
    }

    pub fn get_entry(&self, id: i64) -> Result<PortfolioEntry> {
        let conn = self.conn.lock().unwrap();
        conn.query_row(
            "SELECT id, portfolio_id, asset_type, symbol, quantity, purchase_price, currency,
                    purchase_date, notes, tags, transaction_fees, source, created_at, unit, gold_type,
                    face_value, coupon_rate, maturity_date, coupon_frequency, current_market_price, last_price_update, ytm
             FROM portfolio_entries WHERE id = ?1",
            params![id],
            |row| {
                Ok(PortfolioEntry {
                    id: Some(row.get(0)?),
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
                })
            },
        )
    }

    pub fn list_entries(&self, portfolio_id: i64) -> Result<Vec<PortfolioEntry>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, portfolio_id, asset_type, symbol, quantity, purchase_price, currency,
                    purchase_date, notes, tags, transaction_fees, source, created_at, unit, gold_type,
                    face_value, coupon_rate, maturity_date, coupon_frequency, current_market_price, last_price_update, ytm
             FROM portfolio_entries WHERE portfolio_id = ?1 ORDER BY created_at DESC"
        )?;
        let entries = stmt.query_map(params![portfolio_id], |row| {
            Ok(PortfolioEntry {
                id: Some(row.get(0)?),
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
            })
        })?;

        entries.collect()
    }

    pub fn update_entry(&self, entry: &PortfolioEntry) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE portfolio_entries SET
                asset_type = ?1, symbol = ?2, quantity = ?3, purchase_price = ?4, currency = ?5,
                purchase_date = ?6, notes = ?7, tags = ?8, transaction_fees = ?9, source = ?10,
                unit = ?11, gold_type = ?12, face_value = ?13, coupon_rate = ?14, maturity_date = ?15,
                coupon_frequency = ?16, current_market_price = ?17, last_price_update = ?18, ytm = ?19
             WHERE id = ?20",
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
                entry.id,
            ],
        )?;
        Ok(())
    }

    pub fn delete_entry(&self, id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM portfolio_entries WHERE id = ?1", params![id])?;
        Ok(())
    }

    // Bond Coupon Payment CRUD operations
    pub fn create_coupon_payment(&self, payment: &BondCouponPayment) -> Result<i64> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO bond_coupon_payments (
                entry_id, payment_date, amount, currency, notes, created_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                payment.entry_id,
                payment.payment_date,
                payment.amount,
                payment.currency,
                payment.notes,
                payment.created_at,
            ],
        )?;
        Ok(conn.last_insert_rowid())
    }

    pub fn list_coupon_payments(&self, entry_id: i64) -> Result<Vec<BondCouponPayment>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, entry_id, payment_date, amount, currency, notes, created_at
             FROM bond_coupon_payments WHERE entry_id = ?1 ORDER BY payment_date DESC"
        )?;
        let payments = stmt.query_map(params![entry_id], |row| {
            Ok(BondCouponPayment {
                id: Some(row.get(0)?),
                entry_id: row.get(1)?,
                payment_date: row.get(2)?,
                amount: row.get(3)?,
                currency: row.get(4)?,
                notes: row.get(5)?,
                created_at: row.get(6)?,
            })
        })?;

        payments.collect()
    }

    pub fn update_coupon_payment(&self, payment: &BondCouponPayment) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE bond_coupon_payments SET
                payment_date = ?1, amount = ?2, currency = ?3, notes = ?4
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

    pub fn delete_coupon_payment(&self, id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM bond_coupon_payments WHERE id = ?1", params![id])?;
        Ok(())
    }
}
