// middleware.js — Vercel Routing (Edge) Middleware
//
// Gates the entire deployment behind HTTP Basic Auth. Runs on every request
// (static pages, assets, and the /api functions) before anything is served,
// so nothing is reachable without the shared username/password.
//
// Credentials come from environment variables set in the Vercel dashboard
// (Settings -> Environment Variables): USERNAME and PASSWORD. Set them for
// the Production (and Preview) environments, then redeploy.
//
// Fails CLOSED: if the credentials aren't configured, the site returns a
// 503 with a clear message rather than silently staying open. This also
// makes it easy to tell whether the middleware is running at all:
//   - login prompt      -> working; enter the shared credentials
//   - "not configured"  -> middleware runs, but env vars are missing
//   - normal site loads -> middleware is NOT running (not deployed, or the
//                          file isn't at the repo root)
//
// Note: this runs only on Vercel — local `npm run dev` is not gated.
//
// No `config`/matcher is exported, so it runs on every path by default.

export default function middleware(request) {
  const USER = process.env.USERNAME;
  const PASS = process.env.PASSWORD;

  if (!USER || !PASS) {
    return new Response(
      'Access gate is not configured. Set USERNAME and PASSWORD environment '
        + 'variables in Vercel (Settings → Environment Variables), then redeploy.',
      { status: 503, headers: { 'content-type': 'text/plain' } },
    );
  }

  const header = request.headers.get('authorization') || '';
  const [scheme, encoded] = header.split(' ');
  if (scheme === 'Basic' && encoded) {
    let decoded = '';
    try { decoded = atob(encoded); } catch (e) { decoded = ''; }
    const i = decoded.indexOf(':');
    if (i >= 0 && decoded.slice(0, i) === USER && decoded.slice(i + 1) === PASS) {
      return; // authorized -> continue to the site
    }
  }

  return new Response('Authentication required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Placing the Holocaust", charset="UTF-8"',
    },
  });
}
