// Load test configuration
export const config = {
  // Base URL - override with K6_BASE_URL env var
  baseUrl: __ENV.K6_BASE_URL || 'http://localhost:3000',
  
  // Authentication - set via environment
  authToken: __ENV.K6_AUTH_TOKEN || '',
  adminToken: __ENV.K6_ADMIN_TOKEN || '',
  
  // Test data
  testUserId: __ENV.K6_TEST_USER_ID || 'test-user-id',
  testListingId: __ENV.K6_TEST_LISTING_ID || 'test-listing-id',
  
  // Thresholds
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};

// Common headers
export function getHeaders(token = config.authToken) {
  return {
    'Content-Type': 'application/json',
    'Cookie': token ? `next-auth.session-token=${token}` : '',
  };
}

// Generate random data
export function randomString(length = 10) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomDate(daysFromNow = 30) {
  const date = new Date();
  date.setDate(date.getDate() + randomInt(1, daysFromNow));
  return date.toISOString().split('T')[0];
}
