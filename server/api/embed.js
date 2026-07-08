// server/api/embed.js  (dev serverMiddleware)
//
// POST /api/embed { "text": "..." } -> { "vector": [...], "dim": 768, "model": "..." }
// Delegates to the Hugging Face Inference API (see server/lib/hfEmbed.js).
// The Vercel deployment uses api/embed.js, which shares the same core.

const { hfEmbed, DEFAULT_MODEL, inferenceUrl } = require('../lib/hfEmbed');

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
  if (req.method === 'GET') {
    return send(res, 200, {
      status: 'ok',
      provider: 'huggingface-inference',
      model: DEFAULT_MODEL,
      url: inferenceUrl(),
      token_present: !!process.env.HF_TOKEN,
    });
  }
  if (req.method !== 'POST') {
    return send(res, 405, { error: 'Use POST /api/embed with JSON body { "text": "..." }' });
  }

  let text;
  try {
    const raw = await readBody(req);
    text = (JSON.parse(raw || '{}').text || '').toString();
  } catch {
    return send(res, 400, { error: 'Invalid JSON body' });
  }

  try {
    const result = await hfEmbed(text);
    return send(res, 200, result);
  } catch (err) {
    return send(res, err.status || 500, {
      error: err.message || 'Embedding failed',
      detail: err.detail || undefined,
    });
  }
};
