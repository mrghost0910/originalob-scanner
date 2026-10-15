export default function handler(req, res) {
  const clientId = process.env.UPSTOX_CLIENT_ID;
  const redirectUri = process.env.UPSTOX_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return res.status(500).json({ error: "Missing UPSTOX_CLIENT_ID or UPSTOX_REDIRECT_URI in Vercel Environment Variables." });
  }
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri
  });
  res.setHeader("Cache-Control", "no-store");
  res.redirect(`https://api.upstox.com/v2/login/authorization/dialog?${params.toString()}`);
}