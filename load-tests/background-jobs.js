/**
 * Load Test: Background Job Scaling
 * 
 * Tests the system's ability to handle background processing:
 * - Bulk listing imports
 * - Payment processing webhooks
 * - Email notification triggers
 * - Wallet reconciliation
 * 
 * Run: k6 run load-tests/background-jobs.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { config, getHeaders, randomString, randomInt } from './config.js';

// Custom metrics
const bulkImportRate = new Rate('bulk_import_success');
const webhookRate = new Rate('webhook_processing_success');
const notificationRate = new Rate('notification_trigger_success');

const bulkImportLatency = new Trend('bulk_import_latency');
const webhookLatency = new Trend('webhook_latency');
const jobsQueued = new Counter('jobs_queued');

export const options = {
  scenarios: {
    // Bulk import operations
    bulk_imports: {
      executor: 'per-vu-iterations',
      vus: 10,
      iterations: 5,
      maxDuration: '10m',
      exec: 'bulkImport',
    },
    
    // Webhook flood (simulating Stripe webhooks)
    webhook_flood: {
      executor: 'constant-arrival-rate',
      rate: 100,
      timeUnit: '1s',
      duration: '2m',
      preAllocatedVUs: 50,
      maxVUs: 200,
      exec: 'processWebhook',
      startTime: '30s',
    },
    
    // Notification triggers
    notification_burst: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      stages: [
        { duration: '30s', target: 50 },
        { duration: '1m', target: 200 },
        { duration: '30s', target: 200 },
        { duration: '30s', target: 0 },
      ],
      preAllocatedVUs: 50,
      maxVUs: 300,
      exec: 'triggerNotifications',
      startTime: '1m',
    },
    
    // Concurrent wallet operations
    wallet_reconciliation: {
      executor: 'shared-iterations',
      vus: 20,
      iterations: 500,
      maxDuration: '5m',
      exec: 'walletReconciliation',
      startTime: '2m',
    },
  },
  
  thresholds: {
    'bulk_import_success': ['rate>0.80'],
    'webhook_processing_success': ['rate>0.99'],
    'notification_trigger_success': ['rate>0.95'],
    'bulk_import_latency': ['p(95)<30000'],
    'webhook_latency': ['p(95)<200', 'p(99)<500'],
    'http_req_failed': ['rate<0.05'],
  },
};

// Bulk import scenario
export function bulkImport() {
  group('bulk_listing_import', () => {
    // Generate CSV data for bulk import
    const csvRows = [];
    csvRows.push('title,description,category,pricePerDay,pricePerWeek,bondAmount');
    
    const numListings = randomInt(50, 200);
    for (let i = 0; i < numListings; i++) {
      csvRows.push([
        `Bulk Import Listing ${randomString(6)}`,
        `Description for bulk imported listing ${i}`,
        ['EXCAVATOR', 'CRANE', 'FORKLIFT', 'TRACTOR'][randomInt(0, 3)],
        randomInt(100, 1000),
        randomInt(500, 5000),
        randomInt(500, 2000),
      ].join(','));
    }
    
    const csvContent = csvRows.join('\n');
    
    // Create form data for file upload
    const formData = {
      file: http.file(csvContent, 'listings.csv', 'text/csv'),
      mode: 'create',
    };
    
    const start = Date.now();
    const res = http.post(`${config.baseUrl}/api/listings/import`, formData, {
      headers: {
        'Cookie': config.authToken ? `next-auth.session-token=${config.authToken}` : '',
      },
    });
    const duration = Date.now() - start;
    
    const success = check(res, {
      'bulk import accepted': (r) => [200, 201, 202].includes(r.status),
      'import processed': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.imported !== undefined || body.created !== undefined;
        } catch {
          return r.status === 200;
        }
      },
    });
    
    bulkImportRate.add(success);
    bulkImportLatency.add(duration);
    if (success) jobsQueued.add(numListings);
    
    console.log(`Bulk import of ${numListings} listings: ${success ? 'SUCCESS' : 'FAILED'} in ${duration}ms`);
    
    sleep(randomInt(5, 15));
  });
}

// Webhook processing scenario (simulating Stripe webhooks)
export function processWebhook() {
  const webhookTypes = [
    'payment_intent.succeeded',
    'payment_intent.payment_failed',
    'charge.refunded',
    'customer.subscription.updated',
    'invoice.paid',
  ];
  
  const payload = JSON.stringify({
    id: `evt_${randomString(24)}`,
    type: webhookTypes[randomInt(0, webhookTypes.length - 1)],
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: `pi_${randomString(24)}`,
        amount: randomInt(1000, 100000),
        currency: 'nzd',
        status: 'succeeded',
        metadata: {
          bookingId: `booking_${randomString(10)}`,
          userId: config.testUserId,
        },
      },
    },
  });
  
  const start = Date.now();
  const res = http.post(`${config.baseUrl}/api/stripe/webhook`, payload, {
    headers: {
      'Content-Type': 'application/json',
      'Stripe-Signature': `t=${Math.floor(Date.now() / 1000)},v1=${randomString(64)}`,
    },
  });
  const duration = Date.now() - start;
  
  const success = check(res, {
    'webhook processed': (r) => [200, 400].includes(r.status), // 400 is expected for invalid signature
  });
  
  webhookRate.add(res.status === 200);
  webhookLatency.add(duration);
  if (success) jobsQueued.add(1);
}

// Notification trigger scenario
export function triggerNotifications() {
  const notificationTypes = [
    { endpoint: '/api/messages', method: 'POST', payload: { recipientId: config.testUserId, content: `Test message ${randomString(20)}`, bookingId: config.testListingId } },
    { endpoint: '/api/bookings', method: 'POST', payload: { listingId: config.testListingId, startDate: '2025-01-15', endDate: '2025-01-20' } },
    { endpoint: '/api/offers', method: 'POST', payload: { listingId: config.testListingId, amount: randomInt(100, 500), message: 'Load test offer' } },
  ];
  
  const notification = notificationTypes[randomInt(0, notificationTypes.length - 1)];
  
  const res = http.post(
    `${config.baseUrl}${notification.endpoint}`,
    JSON.stringify(notification.payload),
    { headers: getHeaders() }
  );
  
  const success = check(res, {
    'notification triggered': (r) => r.status < 500,
  });
  
  notificationRate.add(success);
  if (success) jobsQueued.add(1);
  
  sleep(randomInt(1, 3) / 10);
}

// Wallet reconciliation scenario
export function walletReconciliation() {
  group('wallet_operations', () => {
    // Get wallet balance
    const balanceRes = http.get(`${config.baseUrl}/api/wallet`, {
      headers: getHeaders(),
    });
    
    check(balanceRes, {
      'balance retrieved': (r) => r.status === 200 || r.status === 401,
    });
    
    sleep(randomInt(1, 2) / 10);
    
    // Initiate topup
    const topupRes = http.post(
      `${config.baseUrl}/api/wallet/topup`,
      JSON.stringify({
        amount: randomInt(50, 500),
        method: 'BANK_TRANSFER',
        reference: `LOAD-${randomString(8)}`,
      }),
      { headers: getHeaders() }
    );
    
    check(topupRes, {
      'topup initiated': (r) => [200, 201, 401].includes(r.status),
    });
    
    sleep(randomInt(1, 3) / 10);
    
    // Check transaction history
    http.get(`${config.baseUrl}/api/wallet?include=transactions`, {
      headers: getHeaders(),
    });
    
    jobsQueued.add(1);
  });
}

// Default function
export default function() {
  processWebhook();
}

// Setup
export function setup() {
  console.log(`Starting background jobs load test against ${config.baseUrl}`);
  
  const healthCheck = http.get(`${config.baseUrl}/api/health`);
  if (healthCheck.status !== 200) {
    throw new Error(`API health check failed: ${healthCheck.status}`);
  }
  
  return { startTime: Date.now() };
}

// Teardown
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`Background jobs load test completed in ${duration}s`);
  console.log(`Total jobs queued: Check k6 metrics for 'jobs_queued' counter`);
}
