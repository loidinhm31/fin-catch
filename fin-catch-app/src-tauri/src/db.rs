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
    pub asset_type: String, // "stock" or "gold"
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
}

pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    pub fn new(db_path: PathBuf) -> Result<Self> {
        let conn = Connection::open(db_path)?;

        // Create tables
        conn.execute(
            "CREATE TABLE IF NOT EXISTS portfolios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                created_at INTEGER NOT NULL
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS portfolio_entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                portfolio_id INTEGER NOT NULL,
                asset_type TEXT NOT NULL CHECK(asset_type IN ('stock', 'gold')),
                symbol TEXT NOT NULL,
                quantity REAL NOT NULL,
                purchase_price REAL NOT NULL,
                purchase_date INTEGER NOT NULL,
                notes TEXT,
                tags TEXT,
                transaction_fees REAL,
                source TEXT,
                created_at INTEGER NOT NULL,
                FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // Create indexes
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_entries_portfolio_id ON portfolio_entries(portfolio_id)",
            [],
        )?;

        // Migrate existing tables to add currency columns if they don't exist
        // For portfolios table
        let portfolio_has_currency = conn
            .prepare("SELECT base_currency FROM portfolios LIMIT 1")
            .is_ok();

        if !portfolio_has_currency {
            conn.execute(
                "ALTER TABLE portfolios ADD COLUMN base_currency TEXT",
                [],
            )?;
        }

        // For portfolio_entries table
        let entry_has_currency = conn
            .prepare("SELECT currency FROM portfolio_entries LIMIT 1")
            .is_ok();

        if !entry_has_currency {
            conn.execute(
                "ALTER TABLE portfolio_entries ADD COLUMN currency TEXT",
                [],
            )?;
        }

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
                purchase_date, notes, tags, transaction_fees, source, created_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
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
            ],
        )?;
        Ok(conn.last_insert_rowid())
    }

    pub fn get_entry(&self, id: i64) -> Result<PortfolioEntry> {
        let conn = self.conn.lock().unwrap();
        conn.query_row(
            "SELECT id, portfolio_id, asset_type, symbol, quantity, purchase_price, currency,
                    purchase_date, notes, tags, transaction_fees, source, created_at
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
                })
            },
        )
    }

    pub fn list_entries(&self, portfolio_id: i64) -> Result<Vec<PortfolioEntry>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, portfolio_id, asset_type, symbol, quantity, purchase_price, currency,
                    purchase_date, notes, tags, transaction_fees, source, created_at
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
            })
        })?;

        entries.collect()
    }

    pub fn update_entry(&self, entry: &PortfolioEntry) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE portfolio_entries SET
                asset_type = ?1, symbol = ?2, quantity = ?3, purchase_price = ?4, currency = ?5,
                purchase_date = ?6, notes = ?7, tags = ?8, transaction_fees = ?9, source = ?10
             WHERE id = ?11",
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
}
