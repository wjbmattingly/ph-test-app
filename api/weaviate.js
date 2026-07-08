const allowOrigin = process.env.CORS_ALLOW_ORIGIN || '*';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Use POST /api/weaviate' });
    return;
  }

  let body = req.body;
  if (body == null) {
    body = '';
  } else if (typeof body !== 'string') {
    body = JSON.stringify(body);
  }

  try {
    const upstream = await fetch(process.env.WEAVIATE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WEAVIATE_API_KEY}`
      },
      body
    });

    const text = await upstream.text();
    try {
      res.status(upstream.status).json(JSON.parse(text));
    } catch {
      res.status(upstream.status).send(text);
    }
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Proxy request failed' });
  }
};
