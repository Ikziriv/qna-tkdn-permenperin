/**
 * K6 Load Test: Quiz Flow
 * 
 * Run with:
 *   k6 run --env BASE_URL=http://localhost:4000 tests/load/k6-quiz-flow.js
 * 
 * Or against staging:
 *   k6 run --env BASE_URL=https://your-app.up.railway.app tests/load/k6-quiz-flow.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';

export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Ramp up to 10 users
    { duration: '3m', target: 10 },  // Stay at 10 users
    { duration: '1m', target: 20 },  // Ramp up to 20 users
    { duration: '3m', target: 20 },  // Stay at 20 users
    { duration: '1m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% errors
  },
};

export default function () {
  // 1. Health check
  const healthRes = http.get(`${BASE_URL}/api/health`);
  check(healthRes, {
    'health status is 200': (r) => r.status === 200,
    'health response has status ok': (r) => r.json('status') === 'ok',
  });

  sleep(1);

  // 2. Get quizzes (public endpoint)
  const quizzesRes = http.get(`${BASE_URL}/api/quiz/quizzes`);
  check(quizzesRes, {
    'quizzes status is 200': (r) => r.status === 200,
    'quizzes returns array': (r) => Array.isArray(r.json('quizzes')),
  });

  sleep(2);
}
