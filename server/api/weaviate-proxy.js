// server/api/weaviate-proxy.js
//
// Proxies GraphQL queries to the Weaviate instance so the browser never sees
// credentials. Configuration comes from .env (see .env.example):
//   WEAVIATE_HOST     - e.g. acg-floating-204-197-5-43.acg.maine.edu
//   WEAVIATE_PORT     - default 8080
//   WEAVIATE_SCHEME   - http (default) or https
//   WEAVIATE_API_KEY  - bearer token
//   WEAVIATE_TIMEOUT_MS - request timeout (default 30000)

function weaviateGraphqlUrl() {
  if (process.env.WEAVIATE_GRAPHQL_URL) return process.env.WEAVIATE_GRAPHQL_URL;
  const scheme = process.env.WEAVIATE_SCHEME || 'http';
  const host = process.env.WEAVIATE_HOST;
  const port = process.env.WEAVIATE_PORT || '8080';
  if (!host) return null;
  return `${scheme}://${host}:${port}/v1/graphql`;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function send(res, status, obj) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(obj));
}

module.exports = async function handler(req, res) {
  const url = weaviateGraphqlUrl();

  if (req.method === 'GET') {
    return send(res, 200, {
      status: 'ok',
      configured: !!url,
      target: url ? url.replace(/\/\/.*@/, '//') : null,
      hint: url ? undefined : 'Set WEAVIATE_HOST (and WEAVIATE_API_KEY) in .env',
    });
  }

  if (req.method !== 'POST') {
    return send(res, 405, { error: 'Use POST with JSON body { "query": "..." }' });
  }

  if (!url) {
    return send(res, 500, { error: 'Weaviate is not configured. Set WEAVIATE_HOST in .env (see .env.example).' });
  }

  let query;
  try {
    const raw = await readBody(req);
    ({ query } = JSON.parse(raw || '{}'));
  } catch (err) {
    return send(res, 400, { error: 'Invalid JSON body' });
  }
  if (!query) return send(res, 400, { error: 'Missing "query" in request body' });

  const timeoutMs = Number(process.env.WEAVIATE_TIMEOUT_MS) || 30000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (process.env.WEAVIATE_API_KEY) {
      headers.Authorization = `Bearer ${process.env.WEAVIATE_API_KEY}`;
    }
    const resp = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query }),
      signal: controller.signal,
    });
    const text = await resp.text();
    res.statusCode = resp.status;
    res.setHeader('Content-Type', 'application/json');
    try {
      res.end(JSON.stringify(JSON.parse(text)));
    } catch {
      res.end(JSON.stringify({ error: 'Non-JSON response from Weaviate', body: text.slice(0, 2000) }));
    }
  } catch (err) {
    const aborted = err && err.name === 'AbortError';
    console.error('[weaviate-proxy] Error:', err);
    send(res, aborted ? 504 : 502, {
      error: aborted
        ? `Weaviate did not respond within ${timeoutMs}ms`
        : 'Could not reach Weaviate',
      detail: (err && err.message) || String(err),
      target: url,
    });
  } finally {
    clearTimeout(timer);
  }
};
