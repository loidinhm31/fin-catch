#!/bin/bash

# Test script to verify all data sources work (both stock and gold)

echo "=== Testing All Data Sources ==="
echo ""
echo "Make sure the server is running first: cargo run"
echo ""

# List all sources
echo "1. Listing all available sources..."
curl -s http://localhost:3000/api/v1/sources | jq '.'
echo ""

# Health check all sources
echo "2. Checking health of all sources..."
curl -s http://localhost:3000/api/v1/health/sources | jq '.'
echo ""

echo "=== Stock Data Sources ==="
echo ""

# Test VNDIRECT
echo "3. Testing VNDIRECT source with VND symbol..."
curl -s -X POST http://localhost:3000/api/v1/stock/history \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "VND",
    "resolution": "1D",
    "from": 1720396800,
    "to": 1720483200,
    "source": "vndirect"
  }' | jq '.status, .source, .data | length'
echo ""

# Test SSI
echo "4. Testing SSI source with ACB symbol..."
curl -s -X POST http://localhost:3000/api/v1/stock/history \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "ACB",
    "resolution": "1D",
    "from": 1739750400,
    "to": 1739836800,
    "source": "ssi"
  }' | jq '.status, .source, .data | length'
echo ""

# Test default stock source (should be vndirect)
echo "5. Testing default stock source (no source specified)..."
curl -s -X POST http://localhost:3000/api/v1/stock/history \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "VND",
    "resolution": "1D",
    "from": 1720396800,
    "to": 1720483200
  }' | jq '.status, .source'
echo ""

echo "=== Gold Data Sources ==="
echo ""

# Test SJC
echo "6. Testing SJC source with gold price ID 1..."
curl -s -X POST http://localhost:3000/api/v1/gold/history \
  -H "Content-Type: application/json" \
  -d '{
    "gold_price_id": "1",
    "from": 1730764800,
    "to": 1731110400,
    "source": "sjc"
  }' | jq '.status, .source, .data | length'
echo ""

# Test default gold source (should be sjc)
echo "7. Testing default gold source (no source specified)..."
curl -s -X POST http://localhost:3000/api/v1/gold/history \
  -H "Content-Type: application/json" \
  -d '{
    "gold_price_id": "1",
    "from": 1730764800,
    "to": 1731110400
  }' | jq '.status, .source'
echo ""

echo "=== Unified Data Endpoint ==="
echo ""

# Test unified endpoint with stock data
echo "8. Testing unified endpoint with stock data..."
curl -s -X POST http://localhost:3000/api/v1/data \
  -H "Content-Type: application/json" \
  -d '{
    "data_type": "stock",
    "symbol": "VND",
    "resolution": "1D",
    "from": 1720396800,
    "to": 1720483200,
    "source": "vndirect"
  }' | jq '.data_type'
echo ""

# Test unified endpoint with gold data
echo "9. Testing unified endpoint with gold data..."
curl -s -X POST http://localhost:3000/api/v1/data \
  -H "Content-Type: application/json" \
  -d '{
    "data_type": "gold",
    "gold_price_id": "1",
    "from": 1730764800,
    "to": 1731110400,
    "source": "sjc"
  }' | jq '.data_type'
echo ""

echo "=== All tests completed ==="
