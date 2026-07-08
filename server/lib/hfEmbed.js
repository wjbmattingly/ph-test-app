// server/lib/hfEmbed.js
//
// Query embedding via the Hugging Face Inference API (feature-extraction on
// sentence-transformers/LaBSE). HF runs the FULL sentence-transformers
// pipeline (transformer -> pooling -> Dense+tanh -> L2 normalize), so the
// returned vector is identical to the vectors indexed in the corpus —
// verified at cosine 1.0000 against stored objects. No model is loaded
// locally or in the browser; the token stays server-side.
//
// Environment variables:
//   HF_TOKEN      - Hugging Face access token (required)
//   EMBED_MODEL   - model id (default: sentence-transformers/LaBSE)
//   EMBED_HF_URL  - full override for the inference URL (optional)
//
// Only the search query is sent to HF — never corpus text or user identity.

const DEFAULT_MODEL = process.env.EMBED_MODEL || 'sentence-transformers/LaBSE';

function inferenceUrl() {
  if (process.env.EMBED_HF_URL) return process.env.EMBED_HF_URL;
  return `https://router.huggingface.co/hf-inference/models/${DEFAULT_MODEL}/pipeline/feature-extraction`;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Returns { vector: number[], dim, model }. Throws Error with .status on failure.
async function hfEmbed(text, { retries = 5, waitMs = 6000 } = {}) {
  const t = (text || '').toString().trim();
  if (!t) {
    const e = new Error('Missing "text" to embed');
    e.status = 400;
    throw e;
  }
  const token = process.env.HF_TOKEN;
  if (!token) {
    const e = new Error('HF_TOKEN is not set on the server');
    e.status = 500;
    throw e;
  }

  const url = inferenceUrl();
  let lastDetail = '';
  for (let attempt = 0; attempt <= retries; attempt++) {
    let resp;
    try {
      resp = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: t }),
      });
    } catch (err) {
      lastDetail = (err && err.message) || String(err);
      await sleep(waitMs);
      continue;
    }

    // 503 = model loading (cold start); 429 = rate limited. Both retry.
    if (resp.status === 503 || resp.status === 429 || resp.status === 502) {
      lastDetail = `HF HTTP ${resp.status} (model loading or rate limit)`;
      await sleep(waitMs);
      continue;
    }

    const body = await resp.text();
    if (!resp.ok) {
      const e = new Error(`HF Inference error: HTTP ${resp.status}`);
      e.status = 502;
      e.detail = body.slice(0, 300);
      throw e;
    }

    let data;
    try {
      data = JSON.parse(body);
    } catch {
      const e = new Error('HF returned a non-JSON response');
      e.status = 502;
      e.detail = body.slice(0, 300);
      throw e;
    }

    // feature-extraction returns [768] for a single input, sometimes [[768]]
    const vector = Array.isArray(data) && Array.isArray(data[0]) ? data[0] : data;
    if (!Array.isArray(vector) || !vector.length || !Number.isFinite(vector[0])) {
      const e = new Error('Unexpected embedding payload from HF');
      e.status = 502;
      e.detail = JSON.stringify(data).slice(0, 300);
      throw e;
    }
    return { vector, dim: vector.length, model: DEFAULT_MODEL };
  }

  const e = new Error('HF Inference did not become ready in time');
  e.status = 504;
  e.detail = lastDetail;
  throw e;
}

module.exports = { hfEmbed, DEFAULT_MODEL, inferenceUrl };
