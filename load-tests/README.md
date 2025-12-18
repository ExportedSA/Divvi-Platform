# Load Testing Suite

Load tests for the Machinery Rentals platform using [k6](https://k6.io/).

## Prerequisites

Install k6:

```bash
# Windows (chocolatey)
choco install k6

# Windows (winget)
winget install k6

# macOS
brew install k6

# Docker
docker pull grafana/k6
```

## Configuration

Set environment variables before running tests:

```bash
# Required
export K6_BASE_URL="http://localhost:3000"

# Authentication (get from browser session)
export K6_AUTH_TOKEN="your-session-token"
export K6_ADMIN_TOKEN="admin-session-token"

# Test data
export K6_TEST_USER_ID="test-user-id"
export K6_TEST_LISTING_ID="test-listing-id"
```

## Test Suites

### 1. High Ingestion Volume (`ingestion.js`)

Tests system capacity for high-volume data creation:
- **Listing creation**: Ramps to 100 concurrent users creating listings
- **Booking requests**: 50 requests/second sustained load
- **Wallet transactions**: Burst traffic up to 100 req/s

```bash
k6 run load-tests/ingestion.js
```

**Thresholds:**
- 95% of listing creations succeed
- 90% of booking creations succeed
- 99% of wallet transactions succeed
- p95 latency < 2s for listings, < 1.5s for bookings

### 2. Concurrent Dashboards (`dashboards.js`)

Tests concurrent user access patterns:
- **User dashboards**: Ramps to 300 concurrent users
- **Admin dashboards**: 20 concurrent admins with heavy queries
- **Spike test**: Sudden surge to 500 users

```bash
k6 run load-tests/dashboards.js
```

**Thresholds:**
- 95% dashboard load success rate
- p95 latency < 1s for user dashboards
- p95 latency < 2s for admin stats

### 3. Background Job Scaling (`background-jobs.js`)

Tests background processing capacity:
- **Bulk imports**: 10 users importing 50-200 listings each
- **Webhook flood**: 100 webhooks/second for 2 minutes
- **Notification burst**: Ramps to 200 notifications/second
- **Wallet reconciliation**: 500 concurrent wallet operations

```bash
k6 run load-tests/background-jobs.js
```

**Thresholds:**
- 80% bulk import success (allows for validation failures)
- 99% webhook processing success
- p95 webhook latency < 200ms

## Running All Tests

```bash
# Run sequentially
k6 run load-tests/ingestion.js && \
k6 run load-tests/dashboards.js && \
k6 run load-tests/background-jobs.js

# With HTML report
k6 run --out json=results.json load-tests/ingestion.js
```

## Docker Usage

```bash
docker run -i --network=host \
  -e K6_BASE_URL=http://localhost:3000 \
  -v $(pwd)/load-tests:/scripts \
  grafana/k6 run /scripts/ingestion.js
```

## Output & Reporting

### Console Summary
k6 provides a built-in summary with pass/fail thresholds.

### JSON Output
```bash
k6 run --out json=results.json load-tests/ingestion.js
```

### InfluxDB + Grafana
```bash
k6 run --out influxdb=http://localhost:8086/k6 load-tests/ingestion.js
```

### Cloud (k6 Cloud)
```bash
k6 cloud load-tests/ingestion.js
```

## Interpreting Results

| Metric | Good | Warning | Critical |
|--------|------|---------|----------|
| http_req_duration p95 | < 500ms | 500-1000ms | > 1000ms |
| http_req_failed | < 1% | 1-5% | > 5% |
| iterations | Stable | Declining | Crashing |

## Customizing Tests

Edit `config.js` to adjust:
- Base URL
- Authentication tokens
- Test data IDs
- Default thresholds

Modify scenario options in each test file:
- `stages`: Ramp-up/down patterns
- `rate`: Requests per second
- `vus`: Virtual users
- `duration`: Test length
