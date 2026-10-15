
const ALLOWED = new Set([
  "NSE_INDEX|Nifty 50",
  "NSE_INDEX|Nifty Bank",
  "NSE_EQ|INE002A01018",
  "NSE_EQ|INE040A01034",
  "NSE_EQ|INE090A01021",
  "NSE_EQ|INE062A01020",
  "NSE_EQ|INE009A01021",
  "NSE_EQ|INE467B01029"
]);

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }

  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return res.status(401).json({
      error: "Connect Upstox first"
    });
  }

  const key = req.body?.instrument_key;

  if (!ALLOWED.has(key)) {
    return res.status(400).json({
      error: "Unsupported instrument"
    });
  }

  try {
    const url =
      "https://api.upstox.com/v3/historical-candle/intraday/" +
      encodeURIComponent(key) + "/minutes/5";

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + token
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.message || "Upstox API error"
      });
    }

    const candles = (data.data?.candles || [])
      .map(c => ({
        timestamp: c[0],
        open: Number(c[1]),
        high: Number(c[2]),
        low: Number(c[3]),
        close: Number(c[4]),
        volume: Number(c[5] || 0)
      }))
      .sort((a, b) =>
        new Date(a.timestamp) - new Date(b.timestamp)
      );

    return res.status(200).json({
      source: "Upstox",
      instrument_key: key,
      timeframe: "5m",
      candles,
      zones: []
    });
  } catch (error) {
    return res.status(502).json({
      error: "Could not connect to Upstox"
    });
  }
}
