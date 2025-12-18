/**
 * Load Test: High Ingestion Volume
 * 
 * Tests the system's ability to handle high volumes of:
 * - Listing creation
 * - Booking requests
 * - Wallet transactions
 * - Message sending
 * 
 * Run: k6 run load-tests/ingestion.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { config, getHeaders, randomString, randomInt, randomDate } from './config.js';

// Custom metrics
const listingCreationRate = new Rate('listing_creation_success');
const bookingCreationRate = new Rate('booking_creation_success');
const walletTransactionRate = new Rate('wallet_transaction_success');
const messageRate = new Rate('message_send_success');

const listingLatency = new Trend('listing_creation_latency');
const bookingLatency = new Trend('booking_creation_latency');
const walletLatency = new Trend('wallet_transaction_latency');

const totalIngested = new Counter('total_records_ingested');

export const options = {
  scenarios: {
    // Ramp up listing creation
    listing_ingestion: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '1m', target: 50 },
        { duration: '2m', target: 100 },
        { duration: '1m', target: 100 },
        { duration: '30s', target: 0 },
      ],
      exec: 'createListings',
      gracefulRampDown: '10s',
    },
    
    // Concurrent booking requests
    booking_ingestion: {
      executor: 'constant-arrival-rate',
      rate: 50,
      timeUnit: '1s',
      duration: '3m',
      preAllocatedVUs: 100,
      maxVUs: 200,
      exec: 'createBookings',
      startTime: '30s',
    },
    
    // Wallet transactions burst
    wallet_transactions: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      stages: [
        { duration: '30s', target: 30 },
        { duration: '1m', target: 100 },
        { duration: '1m', target: 100 },
        { duration: '30s', target: 0 },
      ],
      preAllocatedVUs: 50,
      maxVUs: 150,
      exec: 'walletOperations',
      startTime: '1m',
    },
  },
  
  thresholds: {
    'listing_creation_success': ['rate>0.95'],
    'booking_creation_success': ['rate>0.90'],
    'wallet_transaction_success': ['rate>0.99'],
    'listing_creation_latency': ['p(95)<2000'],
    'booking_creation_latency': ['p(95)<1500'],
    'wallet_transaction_latency': ['p(95)<500'],
    'http_req_failed': ['rate<0.05'],
  },
};

// Listing creation scenario
export function createListings() {
  const payload = JSON.stringify({
    title: `Load Test Listing ${randomString(8)}`,
    description: `This is a load test listing created at ${new Date().toISOString()}. ${randomString(100)}`,
    category: ['EXCAVATOR', 'CRANE', 'FORKLIFT', 'TRACTOR'][randomInt(0, 3)],
    pricePerDay: randomInt(100, 1000),
    pricePerWeek: randomInt(500, 5000),
    bondAmount: randomInt(500, 2000),
    location: {
      address: `${randomInt(1, 999)} Test Street`,
      city: ['Auckland', 'Wellington', 'Christchurch', 'Hamilton'][randomInt(0, 3)],
      region: 'Test Region',
      country: 'New Zealand',
    },
    specifications: {
      weight: `${randomInt(1000, 50000)}kg`,
      capacity: `${randomInt(1, 100)} tons`,
    },
  });

  const start = Date.now();
  const res = http.post(`${config.baseUrl}/api/listings`, payload, {
    headers: getHeaders(),
  });
  const duration = Date.now() - start;

  const success = check(res, {
    'listing created': (r) => r.status === 201 || r.status === 200,
    'has listing id': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.id !== undefined;
      } catch {
        return false;
      }
    },
  });

  listingCreationRate.add(success);
  listingLatency.add(duration);
  if (success) totalIngested.add(1);

  sleep(randomInt(1, 3) / 10);
}

// Booking creation scenario
export function createBookings() {
  const startDate = randomDate(7);
  const endDate = randomDate(14);
  
  const payload = JSON.stringify({
    listingId: config.testListingId,
    startDate: startDate,
    endDate: endDate,
    message: `Load test booking request ${randomString(20)}`,
  });

  const start = Date.now();
  const res = http.post(`${config.baseUrl}/api/bookings`, payload, {
    headers: getHeaders(),
  });
  const duration = Date.now() - start;

  const success = check(res, {
    'booking created or conflict': (r) => [200, 201, 409].includes(r.status),
    'response has body': (r) => r.body.length > 0,
  });

  bookingCreationRate.add(res.status === 200 || res.status === 201);
  bookingLatency.add(duration);
  if (success) totalIngested.add(1);

  sleep(randomInt(1, 5) / 10);
}

// Wallet operations scenario
export function walletOperations() {
  group('wallet_topup', () => {
    const payload = JSON.stringify({
      amount: randomInt(50, 500),
      method: 'BANK_TRANSFER',
      reference: `LT-${randomString(10)}`,
    });

    const start = Date.now();
    const res = http.post(`${config.baseUrl}/api/wallet/topup`, payload, {
      headers: getHeaders(),
    });
    const duration = Date.now() - start;

    const success = check(res, {
      'topup initiated': (r) => [200, 201, 202].includes(r.status),
    });

    walletTransactionRate.add(success);
    walletLatency.add(duration);
    if (success) totalIngested.add(1);
  });

  sleep(randomInt(1, 3) / 10);
}

// Default function for simple runs
export default function() {
  createListings();
}

// Setup function - runs once before test
export function setup() {
  console.log(`Starting ingestion load test against ${config.baseUrl}`);
  
  // Verify API is reachable
  const healthCheck = http.get(`${config.baseUrl}/api/health`);
  if (healthCheck.status !== 200) {
    throw new Error(`API health check failed: ${healthCheck.status}`);
  }
  
  return { startTime: Date.now() };
}

// Teardown function - runs once after test
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`Ingestion test completed in ${duration}s`);
}
