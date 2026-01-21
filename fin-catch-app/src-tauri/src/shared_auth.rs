//! Shared authentication status for web server access
//!
//! This module provides a thread-safe way to share auth status between
//! the Tauri commands and the embedded web server.

use serde::{Deserialize, Serialize};
use std::sync::{Arc, RwLock};

/// Authentication status (matches frontend AuthStatus type)
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct SharedAuthStatus {
    pub is_authenticated: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub user_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub username: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub email: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub apps: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub is_admin: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub server_url: Option<String>,
}

/// Thread-safe shared auth status holder
#[derive(Clone)]
pub struct AuthStatusHolder {
    status: Arc<RwLock<SharedAuthStatus>>,
}

impl AuthStatusHolder {
    /// Create a new auth status holder (unauthenticated by default)
    pub fn new() -> Self {
        Self {
            status: Arc::new(RwLock::new(SharedAuthStatus::default())),
        }
    }

    /// Get the current auth status
    pub fn get(&self) -> SharedAuthStatus {
        self.status.read().unwrap().clone()
    }

    /// Update the auth status
    pub fn update(&self, status: SharedAuthStatus) {
        let mut writer = self.status.write().unwrap();
        *writer = status;
    }

    /// Clear auth status (logout)
    pub fn clear(&self) {
        let mut writer = self.status.write().unwrap();
        *writer = SharedAuthStatus::default();
    }
}

impl Default for AuthStatusHolder {
    fn default() -> Self {
        Self::new()
    }
}

/// Shared reference type for use in Tauri state
pub type SharedAuthStatusHolder = Arc<AuthStatusHolder>;

/// Create a new shared auth status holder
pub fn create_auth_status_holder() -> SharedAuthStatusHolder {
    Arc::new(AuthStatusHolder::new())
}
