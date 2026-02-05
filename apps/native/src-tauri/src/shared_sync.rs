//! Shared sync status for http server access
//!
//! This module provides a thread-safe way to share sync status between
//! the Tauri commands and the embedded http server.

use serde::{Deserialize, Serialize};
use std::sync::{Arc, RwLock};

/// Sync status (matches frontend SyncStatus type)
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct SharedSyncStatus {
    pub configured: bool,
    pub authenticated: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub server_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_sync_at: Option<i64>,
    pub pending_changes: i32,
}

/// Thread-safe shared sync status holder
#[derive(Clone)]
pub struct SyncStatusHolder {
    status: Arc<RwLock<SharedSyncStatus>>,
}

impl SyncStatusHolder {
    /// Create a new sync status holder
    pub fn new() -> Self {
        Self {
            status: Arc::new(RwLock::new(SharedSyncStatus::default())),
        }
    }

    /// Get the current sync status
    pub fn get(&self) -> SharedSyncStatus {
        self.status.read().unwrap().clone()
    }

    /// Update the sync status
    pub fn update(&self, status: SharedSyncStatus) {
        let mut writer = self.status.write().unwrap();
        *writer = status;
    }
}

impl Default for SyncStatusHolder {
    fn default() -> Self {
        Self::new()
    }
}

/// Shared reference type for use in Tauri state
pub type SharedSyncStatusHolder = Arc<SyncStatusHolder>;

/// Create a new shared sync status holder
pub fn create_sync_status_holder() -> SharedSyncStatusHolder {
    Arc::new(SyncStatusHolder::new())
}
