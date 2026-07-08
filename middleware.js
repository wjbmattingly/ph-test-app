// middleware.js — Vercel Edge Middleware
//
// Gates the entire deployment behind HTTP Basic Auth. Runs on every request
// (static pages, assets, and the /api functions) before anything is served,
// so nothing is reachable without the shared username/password.
//
// Credentials come from environment variables set in the Vercel dashboard
// (Settings -> Environment Variables): USERNAME and PASSWORD. If either is
// unset, the gate is disabled and the site stays open (so a missing var
// can't lock you out of your own deployment).
//
// Note: this runs only on Vercel — local `npm run dev` is not gated.

export const config = {
  // Match every path. Basic Auth credentials are re-sent by the browser on
  // all same-origin requests, so the /api calls keep working once signed in.
  matcher: '/(.*)',
};

export default function middleware(request) {
  const USER = process.env.USERNAME;
  const PASS = process.env.PASSWORD;

  // Not configured -> don't lock anyone out.
  if (!USER || !PASS) return;

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
