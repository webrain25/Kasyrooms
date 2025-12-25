import assert from 'node:assert';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5000';

async function get(path: string) {
  const res = await fetch(`${BASE}${path}`, { cache: 'no-store' });
  const text = await res.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch {}
  return { res, json, text };
}

(async () => {
  // Single normal call should pass
  {
    const { res, json, text } = await get('/api/version');
    assert.strictEqual(res.status, 200, `Expected 200 for normal call, got ${res.status} (${text})`);
    assert.ok(json && json.version, 'Expected version payload');
  }

  // Rapid calls to trigger rate limit (assumes RATE_LIMIT_API_MAX is low, e.g., 3)
  let lastStatus = 0;
  for (let i = 0; i < 10; i++) {
    const { res } = await get('/api/version');
    lastStatus = res.status;
    if (res.status === 429) break;
  }
  assert.strictEqual(lastStatus, 429, `Expected 429 after burst, got ${lastStatus}`);

  console.log('Rate limit smoke OK');
})();
