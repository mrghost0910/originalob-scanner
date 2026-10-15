
export default function handler(req, res) {
  const clientId = process.env.UPSTOX_CLIENT_ID;
  const redirectUri = process.env.UPSTOX_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return res.status(500).json({
      error: "Upstox environment variables missing"
    });
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri
  });

  res.redirect(
    "https://api.upstox.com/v2/login/authorization/dialog?" +
    params.toString()
  );
}
