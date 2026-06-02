# Railway Deployment — AI Finance Brain

## Services
| Service | Purpose |
|---------|---------|
| `trading-backend` | FastAPI — Quant predict + RAG streaming + TradingView webhooks |
| `trading-frontend` | Next.js 14 — Finance Brain dashboard |
| `trading-worker` | RQ worker — async webhook processing |
| `trading-redis` | Redis — message broker + task queue |

## Deploy Steps

### 1. Push this repo to GitHub (already done if you ran git push)

### 2. Create Railway project
```
railway login
railway init        # choose "Empty project"
railway link        # link to this repo
```

### 3. Set environment variables in Railway dashboard
For **trading-backend** and **trading-worker**:
- `ANTHROPIC_API_KEY` — your Claude API key (required for research streaming)
- `GEMINI_API_KEY` — optional
- `WEBHOOK_SECRET` — any secret string for TradingView webhooks
- `FINNHUB_API_KEY` — optional (for Qdrant news ingestion later)

For **trading-frontend**:
- `NEXT_PUBLIC_BACKEND_URL` — set to the Railway URL of trading-backend
  e.g. `https://trading-backend-production-xxxx.up.railway.app`

### 4. Deploy via CLI
```bash
railway up
```
Or push to main — Railway auto-deploys on every push.

### 5. Verify
- Backend health: `https://<backend-url>/health`
- API docs:       `https://<backend-url>/docs`
- Frontend:       `https://<frontend-url>`

## Architecture Notes
- The Quant Brain uses an untrained PyTorch model by default.
  Run `python scripts/train_quant.py` locally and commit `quant_brain_weights.pth` to the repo to use real predictions.
- RAG research streams Claude Sonnet responses via WebSocket — requires `ANTHROPIC_API_KEY`.
- The Qdrant vector DB is optional for Railway MVP; the app falls back to yfinance fundamentals.
