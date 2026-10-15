export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    ok: true,
    app: "Original OB Scanner",
    configured: Boolean(process.env.UPSTOX_CLIENT_ID && process.env.UPSTOX_CLIENT_SECRET && process.env.UPSTOX_REDIRECT_URI),
    message: "Health endpoint only; market data requires Upstox login."
  });
}