# OB Sentinel — Original Order Block Scanner

Mobile-first, original interface for a 5-minute Order Block scanner. Uses Upstox OAuth and Upstox candle data. It intentionally does not invent prices or signals.

## Included
- Original responsive dashboard
- Upstox OAuth login redirect and callback
- Real intraday 5-minute candles endpoint
- Rule-based bullish/bearish OB candidates
- Recent 20-candle high/low liquidity proxies
- Browser notifications while the page is open
- Clear API errors and no fake/demo fallback

## Important limitations
- This is a starter implementation, not financial advice and not a validated profitable strategy.
- The included OB detector is a transparent heuristic and should be backtested before use.
- The initial watchlist includes Nifty 50, Nifty Bank, and six large-cap stocks only. It is not a complete live F&O universe. Expand it with the official Upstox instrument master and confirm each instrument key.
- Upstox API access, permissions, market hours, plan limits, and current endpoint support determine whether a response is available.
- Vercel serverless functions are stateless. This implementation keeps the access token in browser `sessionStorage` for the current tab session; it is not persisted server-side. Do not use on a shared/public device. For production multi-user use, implement encrypted server-side sessions, CSRF/state validation, token refresh policy, and secure cookie handling.
- Browser alerts require the tab to remain open and notifications to be allowed.
- Historical intraday endpoint returns what Upstox makes available; the app does not synthesize missing candles.

## Deploy on Vercel (mobile-friendly workflow)
1. Download and unzip this project.
2. Upload the files to a new GitHub repository. Keep the folder structure exactly as provided: `api/`, `public/`, `package.json`, `vercel.json`.
3. In Vercel, choose **Add New → Project**, import that repository, and deploy.
4. Copy the assigned domain, e.g. `https://your-project.vercel.app`.
5. In the Upstox Developer Console, create/configure an app with this exact redirect URL:
   `https://YOUR-PROJECT.vercel.app/api/upstox-callback`
6. In Vercel → Project → Settings → Environment Variables, add:
   - `UPSTOX_CLIENT_ID` = your Upstox API key/client ID
   - `UPSTOX_CLIENT_SECRET` = your Upstox API secret
   - `UPSTOX_REDIRECT_URI` = exact callback URL above
7. Redeploy after setting environment variables.
8. Open `https://YOUR-PROJECT.vercel.app/api/health`. `configured: true` means the three environment variables exist; it does not prove Upstox credentials are valid.
9. Open the website and tap **Connect Upstox**, sign in and approve access, then return to the scanner and run a live scan.
10. If scan fails, read the exact API error shown. Do not paste your API secret or access token into chats/screenshots.

## Local test
Use Node.js 20+:
```bash
npm install
npx vercel dev
```
Then open the local URL shown by Vercel. Set environment variables in a local `.env` file (do not commit it). Local OAuth requires a redirect URL configured in the Upstox console that matches the local callback exactly.

## API routes
- `GET /api/health`
- `GET /api/upstox-login`
- `GET /api/upstox-callback`
- `POST /api/scan` with `Authorization: Bearer <access_token>` and JSON `{ "instrument_key": "NSE_INDEX|Nifty 50" }`

## Security checklist before real use
- Restrict allowed origins and add CSRF/state validation to OAuth.
- Prefer secure, HttpOnly, SameSite cookies and encrypted server-side token storage for production.
- Add request throttling and authenticated user/session isolation.
- Keep API secrets in deployment environment variables only.
- Review official Upstox API documentation for current URLs, scopes, rate limits, and instrument identifiers.
