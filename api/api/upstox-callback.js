
export default async function handler(req, res) {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("Upstox authorization code missing.");
  }

  const {
    UPSTOX_CLIENT_ID,
    UPSTOX_CLIENT_SECRET,
    UPSTOX_REDIRECT_URI
  } = process.env;

  if (!UPSTOX_CLIENT_ID || !UPSTOX_CLIENT_SECRET || !UPSTOX_REDIRECT_URI) {
    return res.status(500).send("Upstox environment variables missing.");
  }

  try {
    const body = new URLSearchParams({
      code,
      client_id: UPSTOX_CLIENT_ID,
      client_secret: UPSTOX_CLIENT_SECRET,
      redirect_uri: UPSTOX_REDIRECT_URI,
      grant_type: "authorization_code"
    });

    const response = await fetch(
      "https://api.upstox.com/v2/login/authorization/token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body
      }
    );

    const data = await response.json();

    if (!response.ok || !data.access_token) {
      return res.status(502).send("Upstox token exchange failed.");
    }

    const token = JSON.stringify(data.access_token);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(`
      <!doctype html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Upstox Connected</title>
      </head>
      <body style="font-family:system-ui;padding:25px">
        <h2>Upstox connected</h2>
        <p>Returning to scanner...</p>
        <script>
          sessionStorage.setItem("ob_upstox_access_token", ${token});
          location.replace("/");
        </script>
      </body>
      </html>
    `);
  } catch {
    return res.status(502).send("Could not connect to Upstox.");
  }
}
