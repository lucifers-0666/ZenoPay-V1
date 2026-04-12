import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = __ENV.TEST_EMAIL || 'test@zenopay.com';
const TEST_PASSWORD = __ENV.TEST_PASSWORD || 'Test@1234';

export default function () {
  const loginRes = http.post(`${BASE_URL}/auth/login`, {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  check(loginRes, {
    'login success': (r) => r.status === 200,
  });

  const cookie = loginRes.headers['Set-Cookie'] || loginRes.headers['set-cookie'] || '';
  const balanceRes = http.get(`${BASE_URL}/wallet/balance`, {
    headers: {
      Cookie: cookie,
    },
  });

  check(balanceRes, {
    'balance fetched': (r) => r.status === 200,
  });

  sleep(1);
}