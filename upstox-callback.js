export default async function handler(req, res) {
  const code = typeof req.query.code === "string" ? req.query.code : "";
  const error = typeof req.query.error === "string" ? req.query.error : "";
  if (error) return res.status(400).send(page("Upstox login failed", `Upstox returned: ${escapeHtml(error)}`));
  if (!code) return res.status(400).send(page("Authorization code missing", "No code was returned. Go back to the scanner and try Connect Upstox again."));
  const { UPSTOX_CLIENT_ID, UPSTOX_CLIENT_SECRET, UPSTOX_REDIRECT_URI } = process.env;
  if (!UPSTOX_CLIENT_ID || !UPSTOX_CLIENT_SECRET || !UPSTOX_REDIRECT_URI) {
    return res.status(500).send(page("Configuration missing", "Set UPSTOX_CLIENT_ID, UPSTOX_CLIENT_SECRET, and UPSTOX_REDIRECT_URI in Vercel settings."));
  }
  try {
    const body = new URLSearchParams({
      code,
      client_id: UPSTOX_CLIENT_ID,
      client_secret: UPSTOX_CLIENT_SECRET,
      redirect_uri: UPSTOX_REDIRECT_URI,
      grant_type: "authorization_code"
    });
    const response = await fetch("https://api.upstox.com/v2/login/authorization/token", {
      method: "POST",
      headers: { "Accept": "application/json", "Content-Type": "application/x-www-form-urlencoded" },
      body
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.access_token) {
      return res.status(502).send(page("Upstox token exchange failed", escapeHtml(data.errors?.[0]?.message || data.message || `HTTP ${response.status}`)));
    }
    // Serverless functions are stateless; token is returned to the browser only for this user's session.
    // Do not log it. The browser keeps it in sessionStorage, not localStorage.
    const token = JSON.stringify(data.access_token).replace(/</g, "\\u003c");
    return res.status(200).send(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Upstox connected</title><style>body{font:16px system-ui;background:#0b1020;color:#eaf0ff;display:grid;place-items:center;min-height:100vh;margin:0}.card{max-width:440px;padding:28px;border:1px solid #263354;border-radius:20px;background:#121a2d}p{color:#aab8d8}</style></head><body><main class="card"><h2>Upstox authorization received</h2><p>Returning to your scanner…</p><p id="status">Please keep this tab open for a moment.</p></main><script>try{const token=${token};sessionStorage.setItem("ob_upstox_access_token",token);document.getElementById("status").textContent="Connected in this browser session. You can return to the scanner.";setTimeout(()=>{location.replace("/?connected=1")},900)}catch(e){document.getElementById("status").textContent="Could not store the session token in this browser. Return to the scanner and try again."}</script></body></html>`);
  } catch (e) {
    return res.status(502).send(page("Connection error", "Could not contact Upstox. Try again later."));
  }
}
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])); }
function page(title, message) { return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{font:16px system-ui;background:#0b1020;color:#eaf0ff;padding:24px}.card{max-width:600px;margin:10vh auto;padding:24px;border:1px solid #263354;border-radius:16px;background:#121a2d}</style></head><body><main class="card"><h2>${title}</h2><p>${message}</p><p><a style="color:#71e6c2" href="/">Return to scanner</a></p></main></body></html>`; }