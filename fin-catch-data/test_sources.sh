#!/bin/bash

# Pure Rust integration tests for all data sources
# This script runs the Rust tests that verify connections to all sources

echo "=== Running Rust Integration Tests for All Sources ==="
echo ""
echo "These tests will make actual API calls to verify connectivity."
echo "Please ensure you have an internet connection."
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if cargo is available
if ! command -v cargo &> /dev/null; then
    echo -e "${RED}Error: cargo is not installed or not in PATH${NC}"
    echo "Please install Rust: https://rustup.rs/"
    exit 1
fi

echo -e "${YELLOW}Building tests...${NC}"
echo ""

# Run all integration tests with output
echo -e "${YELLOW}Running all source integration tests...${NC}"
echo ""

cargo test --test sources_integration_test -- --test-threads=1 --nocapture

TEST_EXIT_CODE=$?

echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}=== All tests passed! ===${NC}"
else
    echo -e "${RED}=== Some tests failed ===${NC}"
    echo ""
    echo "Possible reasons for test failures:"
    echo "  - Network connectivity issues"
    echo "  - External APIs are down or rate-limiting"
    echo "  - API endpoints have changed"
    echo "  - Invalid test data (timestamps, symbols, etc.)"
fi

exit $TEST_EXIT_CODE
