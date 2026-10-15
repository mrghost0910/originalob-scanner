const ALLOWED = new Set([
  "NSE_INDEX|Nifty 50",
  "NSE_INDEX|Nifty Bank",
  "NSE_EQ|INE002A01018", // RELIANCE
  "NSE_EQ|INE040A01034", // HDFCBANK
  "NSE_EQ|INE090A01021", // ICICIBANK
  "NSE_EQ|INE062A01020", // SBIN
  "NSE_EQ|INE009A01021", // INFY
  "NSE_EQ|INE467B01029"  // TCS
]);
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Upstox is not connected. Tap Connect Upstox." });
  const key = typeof req.body?.instrument_key === "string" ? req.body.instrument_key : "";
  if (!ALLOWED.has(key)) return res.status(400).json({ error: "Instrument is not in the starter allow-list. Add it deliberately to api/scan.js." });
  try {
    const url = new URL("https://api.upstox.com/v3/historical-candle/intraday/" + encodeURIComponent(key) + "/minutes/5");
    const response = await fetch(url, { headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(response.status).json({ error: data.errors?.[0]?.message || data.message || `Upstox returned HTTP ${response.status}`, provider_status: response.status });
    }
    const candles = data.data?.candles;
    if (!Array.isArray(candles)) return res.status(502).json({ error: "Upstox response did not contain candle data. No signal generated." });
    const normalized = candles.map(c => ({
      timestamp: c[0], open: Number(c[1]), high: Number(c[2]), low: Number(c[3]), close: Number(c[4]), volume: Number(c[5] || 0)
    })).filter(c => [c.open,c.high,c.low,c.close].every(Number.isFinite)).sort((a,b)=>new Date(a.timestamp)-new Date(b.timestamp));
    const zones = findOrderBlocks(normalized);
    return res.status(200).json({ source: "Upstox", instrument_key: key, timeframe: "5m", candles: normalized, zones, last_candle_at: normalized.at(-1)?.timestamp || null });
  } catch (e) {
    return res.status(502).json({ error: "Could not reach Upstox API. Check deployment logs and try again." });
  }
}
function findOrderBlocks(candles) {
  // Transparent starter heuristic, not a guarantee of profitable trading.
  // Bullish OB: last bearish candle before a strong bullish displacement candle.
  // Bearish OB: last bullish candle before a strong bearish displacement candle.
  const zones = [];
  for (let i = 1; i < candles.length - 1; i++) {
    const prev = candles[i], next = candles[i + 1];
    const prevRange = Math.max(prev.high - prev.low, 0.000001);
    const nextBody = Math.abs(next.close - next.open);
    const nextRange = Math.max(next.high - next.low, 0.000001);
    const displacement = nextBody / nextRange >= 0.65 && nextBody >= prevRange * 1.2;
    if (!displacement) continue;
    if (prev.close < prev.open && next.close > next.open) {
      zones.push({ type: "Bullish OB", low: prev.low, high: prev.open, formed_at: prev.timestamp, status: "candidate" });
    } else if (prev.close > prev.open && next.close < next.open) {
      zones.push({ type: "Bearish OB", low: prev.open, high: prev.high, formed_at: prev.timestamp, status: "candidate" });
    }
  }
  return zones.slice(-12).reverse();
}