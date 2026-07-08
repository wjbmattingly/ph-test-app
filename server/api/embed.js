// server/api/embed.js
//
// Local embedding service using transformers.js (no external API needed).
// Loads the LaBSE model once (lazily, on first request) and serves
// POST /api/embed  { "text": "..." }  ->  { "vector": [...], "dim": 768, "model": "..." }
//
// IMPORTANT: the corpus in Weaviate was indexed with the full
// sentence-transformers/LaBSE pipeline, which is:
//   transformer -> CLS pooling -> Dense(768x768) + tanh -> L2 normalize
// The Xenova/LaBSE ONNX export only contains the transformer, so this
// module applies the Dense+tanh layer itself (weights are fetched once
// from the sentence-transformers/LaBSE repo, ~2.3 MB, and cached on disk).
// Without it, local vectors are unrelated to the stored ones (cosine ~ 0).
//
// Environment variables (see .env.example):
//   EMBED_MODEL    - HF model id (default: Xenova/LaBSE, the ONNX port of
//                    sentence-transformers/LaBSE used to index the corpus)
//   EMBED_DTYPE    - fp32 (default, exact) | q8 (smaller/faster, slight drift)
//   EMBED_POOLING  - cls (default, per LaBSE model card) | mean
//   HF_HOME        - optional cache dir for downloaded model weights
//
// The first request after a fresh install downloads the model weights from
// the Hugging Face Hub (~1.8 GB for fp32). Subsequent runs use the local cache.

const fs = require('fs');
const path = require('path');
const os = require('os');

const MODEL_ID = process.env.EMBED_MODEL || 'Xenova/LaBSE';
const DTYPE = process.env.EMBED_DTYPE || 'fp32';
const POOLING = process.env.EMBED_POOLING || 'cls';

const DENSE_URL = 'https://huggingface.co/sentence-transformers/LaBSE/resolve/main/2_Dense/model.safetensors';
const DENSE_DIM = 768;

let extractorPromise = null;
let densePromise = null;

function cacheDir() {
  return process.env.HF_HOME || path.join(os.homedir(), '.cache', 'placing-holocaust');
}

// Minimal safetensors parser: 8-byte LE header length, JSON header with
// per-tensor { dtype, shape, data_offsets }, then raw tensor data.
function parseSafetensors(buf) {
  const headerLen = Number(buf.readBigUInt64LE(0));
  const header = JSON.parse(buf.subarray(8, 8 + headerLen).toString('utf8'));
  const dataStart = 8 + headerLen;
  const tensors = {};
  for (const [name, info] of Object.entries(header)) {
    if (name === '__metadata__') continue;
    if (info.dtype !== 'F32') throw new Error(`Unsupported dtype ${info.dtype} for ${name}`);
    const [from, to] = info.data_offsets;
    // Float32Array view needs 4-byte alignment; copy to be safe.
    const bytes = Buffer.from(buf.subarray(dataStart + from, dataStart + to));
    tensors[name] = {
      shape: info.shape,
      data: new Float32Array(bytes.buffer, bytes.byteOffset, bytes.length / 4),
    };
  }
  return tensors;
}

function getDense() {
  if (!densePromise) {
    densePromise = (async () => {
      const file = path.join(cacheDir(), 'labse-2_Dense.safetensors');
      let buf;
      if (fs.existsSync(file)) {
        buf = fs.readFileSync(file);
      } else {
        console.log('[embed] Downloading LaBSE dense-layer weights (~2.3 MB)...');
        const resp = await fetch(DENSE_URL);
        if (!resp.ok) throw new Error(`Dense weights download failed: HTTP ${resp.status}`);
        buf = Buffer.from(await resp.arrayBuffer());
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, buf);
      }
      const t = parseSafetensors(buf);
      const w = t['linear.weight'];
      const b = t['linear.bias'];
      if (!w || !b || w.shape[0] !== DENSE_DIM || w.shape[1] !== DENSE_DIM) {
        throw new Error('Unexpected dense layer weights layout');
      }
      console.log('[embed] Dense layer ready.');
      return { weight: w.data, bias: b.data };
    })();
    densePromise.catch(() => { densePromise = null; });
  }
  return densePromise;
}

// sentence-transformers 2_Dense module: y = tanh(W x + b), torch Linear
// weight is [out, in] so row i of W produces output i.
function denseTanh(vec, { weight, bias }) {
  const out = new Float32Array(DENSE_DIM);
  for (let i = 0; i < DENSE_DIM; i++) {
    let sum = bias[i];
    const row = i * DENSE_DIM;
    for (let j = 0; j < DENSE_DIM; j++) sum += weight[row + j] * vec[j];
    out[i] = Math.tanh(sum);
  }
  return out;
}

function l2normalize(vec) {
  let norm = 0;
  for (let i = 0; i < vec.length; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm) || 1;
  const out = new Array(vec.length);
  for (let i = 0; i < vec.length; i++) out[i] = vec[i] / norm;
  return out;
}

function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      // @huggingface/transformers is ESM-only; use dynamic import from CJS.
      const { pipeline, env } = await import('@huggingface/transformers');
      if (process.env.HF_HOME) env.cacheDir = process.env.HF_HOME;
      console.log(`[embed] Loading ${MODEL_ID} (dtype=${DTYPE})... first run downloads weights.`);
      const extractor = await pipeline('feature-extraction', MODEL_ID, { dtype: DTYPE });
      console.log('[embed] Model ready.');
      return extractor;
    })();
    // Allow retry on failure (e.g. transient network error during download).
    extractorPromise.catch(() => { extractorPromise = null; });
  }
  return extractorPromise;
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
  // Health check / readiness probe
  if (req.method === 'GET') {
    return send(res, 200, {
      status: 'ok',
      model: MODEL_ID,
      dtype: DTYPE,
      pooling: POOLING,
      dense_layer: 'sentence-transformers/LaBSE 2_Dense (tanh)',
      loaded: extractorPromise != null,
    });
  }

  if (req.method !== 'POST') {
    return send(res, 405, { error: 'Use POST /api/embed with JSON body { "text": "..." }' });
  }

  let text;
  try {
    const raw = await readBody(req);
    const parsed = JSON.parse(raw || '{}');
    text = (parsed.text || '').toString().trim();
  } catch (err) {
    return send(res, 400, { error: 'Invalid JSON body' });
  }

  if (!text) {
    return send(res, 400, { error: 'Missing "text" in request body' });
  }

  try {
    const [extractor, dense] = await Promise.all([getExtractor(), getDense()]);
    // Raw CLS vector; Dense+tanh+normalize happen below, matching the
    // sentence-transformers module order (Pooling -> Dense -> Normalize).
    const output = await extractor(text, { pooling: POOLING, normalize: false });
    const vector = l2normalize(denseTanh(output.data, dense));
    return send(res, 200, { vector, dim: vector.length, model: MODEL_ID, pooling: POOLING });
  } catch (err) {
    console.error('[embed] Error:', err);
    return send(res, 500, {
      error: 'Embedding failed',
      detail: (err && err.message) || String(err),
      hint: 'First request downloads model weights from huggingface.co - check network access and disk space.',
    });
  }
};
