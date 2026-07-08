// api/embed.js  (Vercel serverless function)
//
// POST /api/embed { "text": "..." } -> { "vector": [...], "dim": 768, "model": "..." }
// Embeds the search query via the Hugging Face Inference API. The HF token
// lives only in this function's environment (HF_TOKEN), never in the browser.
// Shares its core with the dev serverMiddleware (server/lib/hfEmbed.js).

const { hfEmbed } = require('../server/lib/hfEmbed');

const allowOrigin = process.env.CORS_ALLOW_ORIGIN || '*';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST /api/embed' });

  let text = '';
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    text = (body.text || '').toString();
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  try {
    const result = await hfEmbed(text);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({
      error: err.message || 'Embedding failed',
      detail: err.detail || undefined,
    });
  }
};
