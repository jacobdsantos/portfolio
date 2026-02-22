/**
 * Cloudflare Pages Function middleware — protects /_ctrl/ admin routes.
 *
 * Authentication uses a shared passphrase stored in Cloudflare env:
 *   ADMIN_PASSPHRASE — set via `wrangler pages secret put ADMIN_PASSPHRASE`
 *
 * Flow:
 * 1. Check for `_ctrl_auth` cookie with valid token
 * 2. If no valid cookie, check for ?token= query param
 * 3. If neither, show a minimal login form
 * 4. On successful auth, set HttpOnly Secure cookie (24h TTL)
 *
 * The token is a SHA-256 hash of the passphrase, so the raw passphrase
 * is never stored in cookies or transmitted after initial login.
 */

const COOKIE_NAME = '_ctrl_auth';
const COOKIE_MAX_AGE = 86400; // 24 hours

async function hashPassphrase(passphrase) {
  const encoder = new TextEncoder();
  const data = encoder.encode(passphrase);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function getCookie(request, name) {
  const cookieHeader = request.headers.get('Cookie') || '';
  const cookies = cookieHeader.split(';').map((c) => c.trim());
  for (const cookie of cookies) {
    const [key, ...valueParts] = cookie.split('=');
    if (key === name) return valueParts.join('=');
  }
  return null;
}

function loginPage(error = '') {
  const errorHtml = error
    ? `<div style="color:#f56565;font-size:0.8rem;margin-bottom:1rem;padding:0.5rem 1rem;background:rgba(245,101,101,0.1);border:1px solid rgba(245,101,101,0.2);border-radius:8px;">${error}</div>`
    : '';

  return new Response(
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex, nofollow" />
  <title>Admin Access</title>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Space Grotesk', system-ui, sans-serif;
      background: #07090f;
      color: #e8edf5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-image:
        linear-gradient(rgba(0,223,162,0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,223,162,0.02) 1px, transparent 1px);
      background-size: 60px 60px;
    }
    .card {
      background: #131920;
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 20px;
      padding: 2.5rem;
      width: 100%;
      max-width: 380px;
      text-align: center;
    }
    .logo {
      width: 56px; height: 56px;
      border-radius: 16px;
      background: linear-gradient(135deg, rgba(0,223,162,0.15), rgba(108,92,231,0.1));
      border: 1px solid rgba(0,223,162,0.15);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 18px;
      color: #00dfa2;
      font-family: 'JetBrains Mono', monospace;
      margin-bottom: 1.5rem;
    }
    h1 { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.25rem; }
    h1 span { color: #00dfa2; }
    .sub { font-size: 0.7rem; color: #545d68; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 1.5rem; }
    form { display: flex; flex-direction: column; gap: 1rem; }
    input[type="password"] {
      width: 100%;
      padding: 0.75rem 1rem;
      background: #0d1117;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      color: #e8edf5;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      outline: none;
      transition: border-color 0.2s;
    }
    input[type="password"]:focus { border-color: rgba(0,223,162,0.4); }
    input[type="password"]::placeholder { color: #545d68; }
    button {
      padding: 0.75rem;
      background: #00dfa2;
      color: #07090f;
      border: none;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s;
      font-family: 'Space Grotesk', sans-serif;
    }
    button:hover { box-shadow: 0 0 30px -5px rgba(0,223,162,0.4); transform: scale(1.02); }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">JS</div>
    <h1>Portfolio <span>Admin</span></h1>
    <div class="sub">Authentication Required</div>
    ${errorHtml}
    <form method="POST">
      <input type="password" name="passphrase" placeholder="Enter passphrase" autofocus autocomplete="current-password" />
      <button type="submit">Authenticate</button>
    </form>
  </div>
</body>
</html>`,
    {
      status: 401,
      headers: {
        'Content-Type': 'text/html;charset=utf-8',
        'X-Robots-Tag': 'noindex, nofollow',
        'Cache-Control': 'no-store',
      },
    },
  );
}

export async function onRequest(context) {
  const { request, next, env } = context;

  // If no passphrase is configured, let requests through (dev/unconfigured)
  const passphrase = env.ADMIN_PASSPHRASE;
  if (!passphrase) {
    return next();
  }

  const expectedToken = await hashPassphrase(passphrase);

  // Check cookie auth
  const cookieToken = getCookie(request, COOKIE_NAME);
  if (cookieToken === expectedToken) {
    return next();
  }

  // Check query param auth (for bookmarkable links)
  const url = new URL(request.url);
  const queryToken = url.searchParams.get('token');
  if (queryToken === expectedToken) {
    // Set cookie and redirect to clean URL
    url.searchParams.delete('token');
    const response = new Response(null, {
      status: 302,
      headers: { Location: url.pathname + url.search },
    });
    response.headers.set(
      'Set-Cookie',
      `${COOKIE_NAME}=${expectedToken}; Path=/_ctrl; HttpOnly; Secure; SameSite=Strict; Max-Age=${COOKIE_MAX_AGE}`,
    );
    return response;
  }

  // Handle POST login form
  if (request.method === 'POST') {
    try {
      const formData = await request.formData();
      const submitted = formData.get('passphrase');
      if (submitted && (await hashPassphrase(submitted)) === expectedToken) {
        // Success — set cookie and redirect to requested page
        const response = new Response(null, {
          status: 302,
          headers: { Location: url.pathname + url.search },
        });
        response.headers.set(
          'Set-Cookie',
          `${COOKIE_NAME}=${expectedToken}; Path=/_ctrl; HttpOnly; Secure; SameSite=Strict; Max-Age=${COOKIE_MAX_AGE}`,
        );
        return response;
      }
      return loginPage('Invalid passphrase. Try again.');
    } catch {
      return loginPage('Invalid request.');
    }
  }

  // Show login form
  return loginPage();
}
