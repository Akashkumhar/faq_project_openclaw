const http = require('http');
const jwt = require('jsonwebtoken');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const opts = { hostname: 'localhost', port: 5000, path, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } };
    const req = http.request(opts, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(d) }));
    });
    req.on('error', reject); req.write(data); req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: 'localhost', port: 5000, path, method: 'GET',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } };
    const req = http.request(opts, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(d) }); } catch (e) { resolve({ status: res.statusCode, body: d }); } });
    });
    req.on('error', reject); req.end();
  });
}

async function main() {
  const login = await post('/api/auth/login', { email: 'admin@faq.edu', password: 'Admin@12345' });
  console.log('Login:', login.status, login.body.success, login.body.message || '');
  if (!login.body.success) { console.log('Failed:', JSON.stringify(login.body)); return; }

  const token = login.body.data.accessToken;
  const decoded = jwt.decode(token);
  console.log('Token payload id:', decoded.id, 'role:', decoded.role);
  console.log('Token exp:', new Date(decoded.exp * 1000));

  // Check what the auth middleware actually gets
  const me = await get('/api/reputation/me', token);
  console.log('GET /reputation/me status:', me.status, JSON.stringify(me.body).substring(0, 200));

  const analytics = await get('/api/analytics/overview', token);
  console.log('Analytics status:', analytics.status, JSON.stringify(analytics.body).substring(0, 300));
}

main().catch(console.error);