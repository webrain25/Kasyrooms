import assert from "node:assert";

const BASE = process.env.BASE_URL || "http://localhost:5000";

async function getJson(path: string) {
  const res = await fetch(`${BASE}${path}`);
  const text = await res.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch {}
  return { res, json, text };
}

(async () => {
  // 1) Nested proxy missing inner url
  {
    const { res, json, text } = await getJson(`/api/proxy/img?u=${encodeURIComponent("/api/proxy/img")}`);
    assert.strictEqual(res.status, 400, `Expected 400, got ${res.status} (${text})`);
    assert.ok(json && json.error === "nested_proxy_missing_inner_url",
      `Expected nested_proxy_missing_inner_url, got: ${JSON.stringify(json)}`);
  }

  // 2) SSRF blocked host
  {
    const { res, json, text } = await getJson(`/api/proxy/img?u=${encodeURIComponent("https://127.0.0.1/test.jpg")}`);
    assert.strictEqual(res.status, 400, `Expected 400, got ${res.status} (${text})`);
    assert.ok(json && json.error === "blocked_host",
      `Expected blocked_host, got: ${JSON.stringify(json)}`);
  }

  console.log("Image proxy security OK");
})();
