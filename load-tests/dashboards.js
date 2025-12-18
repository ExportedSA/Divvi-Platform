/**
 * Load Test: Concurrent Dashboard Access
 * 
 * Tests the system's ability to handle many users accessing:
 * - Main dashboard
 * - Admin dashboard with stats
 * - Analytics pages
 * - Listings management
 * - Booking management
 * 
 * Run: k6 run load-tests/dashboards.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { config, getHeaders, randomInt } from './config.js';

// Custom metrics
const dashboardLoadRate = new Rate('dashboard_load_success');
const adminStatsRate = new Rate('admin_stats_success');
const listingsLoadRate = new Rate('listings_load_success');
const bookingsLoadRate = new Rate('bookings_load_success');

const dashboardLatency = new Trend('dashboard_latency');
const adminStatsLatency = new Trend('admin_stats_latency');
const listingsLatency = new Trend('listings_latency');
const bookingsLatency = new Trend('bookings_latency');

export const options = {
  scenarios: {
    // Simulate normal user dashboard access
    user_dashboards: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '2m', target: 200 },
        { duration: '3m', target: 200 },
        { duration: '1m', target: 300 },
        { duration: '2m', target: 300 },
        { duration: '30s', target: 0 },
      ],
      exec: 'userDashboard',
      gracefulRampDown: '15s',
    },
    
    // Admin dashboard with heavy stats queries
    admin_dashboards: {
      executor: 'constant-vus',
      vus: 20,
      duration: '5m',
      exec: 'adminDashboard',
      startTime: '30s',
    },
    
    // Spike test - sudden surge of users
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 500 },
        { duration: '30s', target: 500 },
        { duration: '10s', target: 0 },
      ],
      exec: 'spikeAccess',
      startTime: '3m',
    },
  },
  
  thresholds: {
    'dashboard_load_success': ['rate>0.95'],
    'admin_stats_success': ['rate>0.90'],
    'listings_load_success': ['rate>0.95'],
    'bookings_load_success': ['rate>0.95'],
    'dashboard_latency': ['p(95)<1000', 'p(99)<2000'],
    'admin_stats_latency': ['p(95)<2000', 'p(99)<3000'],
    'http_req_failed': ['rate<0.05'],
  },
};

// User dashboard scenario
export function userDashboard() {
  group('user_dashboard_flow', () => {
    // Load main dashboard page
    const dashStart = Date.now();
    const dashRes = http.get(`${config.baseUrl}/dashboard`, {
      headers: getHeaders(),
    });
    dashboardLatency.add(Date.now() - dashStart);
    dashboardLoadRate.add(check(dashRes, {
      'dashboard loaded': (r) => r.status === 200,
    }));

    sleep(randomInt(1, 3));

    // Load user's listings
    const listingsStart = Date.now();
    const listingsRes = http.get(`${config.baseUrl}/api/listings/my`, {
      headers: getHeaders(),
    });
    listingsLatency.add(Date.now() - listingsStart);
    listingsLoadRate.add(check(listingsRes, {
      'listings loaded': (r) => r.status === 200,
    }));

    sleep(randomInt(1, 2));

    // Load user's bookings
    const bookingsStart = Date.now();
    const bookingsRes = http.get(`${config.baseUrl}/api/bookings`, {
      headers: getHeaders(),
    });
    bookingsLatency.add(Date.now() - bookingsStart);
    bookingsLoadRate.add(check(bookingsRes, {
      'bookings loaded': (r) => r.status === 200,
    }));

    sleep(randomInt(1, 2));

    // Load wallet balance
    http.get(`${config.baseUrl}/api/wallet`, {
      headers: getHeaders(),
    });

    sleep(randomInt(2, 5));
  });
}

// Admin dashboard scenario
export function adminDashboard() {
  group('admin_dashboard_flow', () => {
    // Load admin stats (heavy query)
    const statsStart = Date.now();
    const statsRes = http.get(`${config.baseUrl}/api/admin/stats`, {
      headers: getHeaders(config.adminToken),
    });
    adminStatsLatency.add(Date.now() - statsStart);
    adminStatsRate.add(check(statsRes, {
      'admin stats loaded': (r) => r.status === 200 || r.status === 403,
    }));

    sleep(randomInt(2, 4));

    // Load pending listings for review
    http.get(`${config.baseUrl}/api/admin/listings?status=PENDING_REVIEW`, {
      headers: getHeaders(config.adminToken),
    });

    sleep(randomInt(1, 3));

    // Load pending topups
    http.get(`${config.baseUrl}/api/admin/topups?status=PENDING`, {
      headers: getHeaders(config.adminToken),
    });

    sleep(randomInt(1, 3));

    // Load disputes
    http.get(`${config.baseUrl}/api/admin/disputes`, {
      headers: getHeaders(config.adminToken),
    });

    sleep(randomInt(3, 6));
  });
}

// Spike access scenario
export function spikeAccess() {
  // Simulate users hitting various endpoints during a spike
  const endpoints = [
    '/api/listings',
    '/api/health',
    '/dashboard',
    '/api/listings/my',
  ];
  
  const endpoint = endpoints[randomInt(0, endpoints.length - 1)];
  
  const res = http.get(`${config.baseUrl}${endpoint}`, {
    headers: getHeaders(),
    timeout: '10s',
  });
  
  check(res, {
    'spike request handled': (r) => r.status < 500,
  });
  
  sleep(randomInt(1, 3) / 10);
}

// Default function
export default function() {
  userDashboard();
}

// Setup
export function setup() {
  console.log(`Starting dashboard load test against ${config.baseUrl}`);
  
  const healthCheck = http.get(`${config.baseUrl}/api/health`);
  if (healthCheck.status !== 200) {
    throw new Error(`API health check failed: ${healthCheck.status}`);
  }
  
  return { startTime: Date.now() };
}

// Teardown
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`Dashboard load test completed in ${duration}s`);
}
