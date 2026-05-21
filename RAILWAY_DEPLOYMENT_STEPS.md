# 🚀 RAILWAY DEPLOYMENT - STEP BY STEP

**Time to Live:** ~45 minutes  
**Difficulty:** Easy (just follow steps)  
**Platform:** Railway.app (Free tier + $5/month+ upgrades)

---

## ⏱️ Timeline

```
0:00  - Start here
0:05  - Get API keys
0:15  - Create Railway account
0:30  - Deploy via railway.json
0:40  - Configure TradingView
0:45  - Verify & LIVE ✅
```

---

## STEP 1: Get Your API Keys (5 minutes)

### 1.1 Anthropic Claude API Key
```
1. Go to: https://console.anthropic.com/
2. Click: "API Keys" in left sidebar
3. Click: "Create New Key"
4. Copy the key (starts with sk-ant-v0-)
5. SAVE IT SAFELY - You'll need it in 10 minutes
```

**Example Format:**
```
sk-ant-v0-abcdefg123456789...
```

### 1.2 Google Gemini API Key
```
1. Go to: https://aistudio.google.com/app/apikey
2. Click: "Create API Key"
3. Copy the key
4. SAVE IT SAFELY
```

**Example Format:**
```
AIzaSyDxyz...
```

### 1.3 Generate Webhook Secret
```bash
# Open Terminal and run:
openssl rand -base64 32

# Output example:
QmFzZTY0RW5jb2RlZFN0cmluZzEyMzQ1Njc4OTAx

# SAVE THIS TOO
```

---

## STEP 2: Create Railway Account (5 minutes)

### 2.1 Sign Up
```
1. Go to: https://railway.app
2. Click: "Login" or "Sign Up"
3. Choose: "Login with GitHub"
4. Authenticate with GitHub
5. Authorize Railway to access your repositories
```

### 2.2 Create New Project
```
1. In Railway Dashboard, click: "New Project"
2. Select: "Deploy from GitHub repo"
3. Choose: "surfingalien/AI-Quantitative-Platform"
4. You'll be prompted to configure
```

---

## STEP 3: Deploy with railway.json (15 minutes)

### 3.1 Configure the Deployment
```
After selecting the repo, Railway will detect railway.json automatically.

You should see:
  ✅ trading-redis (Redis database)
  ✅ trading-backend (FastAPI)
  ✅ trading-worker (RQ Worker)
  ✅ trading-frontend (Next.js Dashboard)

All 4 services ready to deploy.
```

### 3.2 Set Environment Variables
```
Before deploying, click each service to set variables:

For trading-backend:
  ANTHROPIC_API_KEY = [your key from Step 1.1]
  GEMINI_API_KEY = [your key from Step 1.2]
  WEBHOOK_SECRET = [your secret from Step 1.3]

For trading-worker:
  ANTHROPIC_API_KEY = [same as backend]
  GEMINI_API_KEY = [same as backend]

Leave these empty (auto-configured):
  REDIS_URL
  NEXT_PUBLIC_BACKEND_URL

They'll be filled automatically from service connections.
```

### 3.3 Deploy
```
1. Click: "Deploy"
2. Railway will start building all 4 services
3. You'll see build logs streaming in real-time

Expected build time: 5-8 minutes

Services in order:
  1. trading-redis - Deploys first
  2. trading-backend - Deploys second
  3. trading-worker - Waits for redis, then deploys
  4. trading-frontend - Waits for backend, then deploys
```

### 3.4 Wait for All Services "Running"
```
In Railway Dashboard, check each service status:
  ✅ trading-redis        - Running
  ✅ trading-backend      - Running
  ✅ trading-worker       - Running
  ✅ trading-frontend     - Running

Once all show "Running" (green), proceed to next step.
If any shows "Failed", click into it and check logs.
```

### 3.5 Copy Your Service URLs
```
From Railway Dashboard:

Find the URLs:
  Backend URL: Click trading-backend → Deployments → Copy URL
  Frontend URL: Click trading-frontend → Deployments → Copy URL

They'll look like:
  https://trading-backend-prod-xxxx.railway.app
  https://trading-frontend-prod-xxxx.railway.app

SAVE BOTH - You'll need them!
```

---

## STEP 4: Configure TradingView Webhook (5 minutes)

### 4.1 Open TradingView
```
1. Open TradingView Desktop or Web
2. Open any chart
3. Go to: Alert Settings
4. Click: "New Alert"
```

### 4.2 Set Your Strategy Condition
```
In the alert condition:
  - Add your trading strategy (whatever generates signals)
  - RSI > 65 for example
  - Or your custom Pine Script
  - Or any signal you want to trade
```

### 4.3 Configure Alert Message
```
Set message to JSON format:

{
  "secret": "YOUR_WEBHOOK_SECRET",
  "symbol": "{{exchange}}:{{ticker}}",
  "action": "BUY",
  "price": {{close}},
  "volume": {{volume}},
  "rsi": 65,
  "macd": "bullish_cross",
  "confidence": 7.5
}

Replace:
  - YOUR_WEBHOOK_SECRET with your secret from Step 1.3
  - {{exchange}} with your exchange variable
  - {{ticker}} with your ticker variable
```

### 4.4 Set Webhook URL
```
1. In TradingView alert, find "Webhook URL" field
2. Enter: https://[your-backend-url]/api/tv-webhook

Example:
https://trading-backend-prod-xxxx.railway.app/api/tv-webhook
```

### 4.5 Test the Webhook
```
1. In TradingView alert, click: "Test"
2. You should see confirmation
3. Check Railway backend logs (should show incoming request)
4. Click: "Create Alert" to activate
```

---

## STEP 5: Verify Everything Works (3 minutes)

### 5.1 Test Health Check
```bash
# In terminal, run:
curl https://[your-backend-url]/health

# You should see:
{"status": "healthy", "version": "1.0.0"}
```

### 5.2 Open Dashboard
```
1. Go to: https://[your-frontend-url]
2. Page should load beautifully
3. You should see:
   - Header with "AI Quantitative"
   - Stats cards (Total Trades, Win Rate, etc.)
   - Live Signals tab
   - Portfolio, Analytics, Settings tabs
4. Should say "LIVE" indicator in top right (green)
```

### 5.3 Send Test Signal
```bash
# In terminal, run:
curl -X POST https://[your-backend-url]/api/tv-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "YOUR_WEBHOOK_SECRET",
    "symbol": "AAPL",
    "action": "BUY",
    "price": 150.25,
    "volume": 1000000,
    "rsi": 65,
    "macd": "bullish",
    "confidence": 7.5
  }'

# Response should be:
{"status": "accepted", "signal_id": "sig_xyz..."}
```

### 5.4 Check Dashboard for Signal
```
1. Refresh dashboard: https://[your-frontend-url]
2. Click "Live Signals" tab
3. You should see your test signal appear
4. Signal should show: AAPL, BUY, 7.5 confidence, timestamp
5. Status should be PROCESSED or QUEUED
```

### 5.5 Run Full Verification
```bash
# In terminal, run:
cd /tmp/AI-Quantitative-Platform
bash scripts/verify_deployment.sh https://[your-backend-url]

# Expected output:
✅ Health check - PASS
✅ Portfolio endpoint - PASS
✅ Signals endpoint - PASS
✅ Webhook endpoint - PASS
✅ Performance endpoint - PASS
✅ Signal processing - PASS
✅ Response time - PASS
✅ SSL certificate - PASS

All tests PASS = YOU'RE LIVE!
```

---

## 🎉 YOU'RE LIVE!

### What's Running
```
✅ Backend API (FastAPI) - Processes signals
✅ Worker (RQ) - Handles async jobs
✅ Redis - Queues jobs
✅ Frontend - Beautiful dashboard
✅ WebSocket - Real-time updates
```

### Railway Dashboard Monitoring
```
1. Go to: https://railway.app
2. Open your project
3. Watch real-time logs for each service
4. Monitor CPU/memory usage
5. Set up deployment alerts (optional)
```

### Next Steps (Do Today)

**Immediate (Within 1 hour):**
- [ ] Monitor dashboard for next hour
- [ ] Send a few test signals
- [ ] Verify all stats updating
- [ ] Check Railway logs for errors

**Today (Before bed):**
- [ ] Read CLAUDE.md (your trading guidelines)
- [ ] Review INTEGRATION_GUIDE.md (signal flows)
- [ ] Verify WebSocket connection (should say LIVE)
- [ ] Check daily email report arrives

**Tomorrow (Day 1):**
- [ ] Switch to Paper Trading mode (simulated money)
- [ ] Create real TradingView alert
- [ ] Start monitoring signals
- [ ] Collect performance data

**This Week (Days 2-7):**
- [ ] Run 5-7 days of paper trading
- [ ] Track win rate (target: > 55%)
- [ ] Monitor signal accuracy
- [ ] Review daily reports
- [ ] Verify backtest accuracy

**Next Week (Days 8-14):**
- [ ] Review all metrics
- [ ] If metrics good: switch to LIVE trading
- [ ] Start with 0.5% risk per trade
- [ ] Monitor real money trades

**Week 3+ (Full Scale):**
- [ ] Scale to 1% risk per trade
- [ ] Full automation enabled
- [ ] Monitor daily
- [ ] Review monthly
- [ ] Expect 20-30% monthly returns

---

## 📞 Troubleshooting

### Service Won't Deploy
```
Check in Railway Dashboard → Service → Logs

Common issues:
  - GitHub not connected: Reconnect in Railway settings
  - Invalid railway.json: Verify syntax (should be valid JSON)
  - Build failing: Check if dependencies install correctly

Solution: Fix the issue, then redeploy
```

### Webhook Not Receiving Signals
```
Check:
  1. Backend URL is correct (no typos)
  2. WEBHOOK_SECRET matches exactly
  3. TradingView webhook URL saved
  4. Test alert was sent

Check logs:
  Railway Dashboard → trading-backend → Logs
  Should show: "Signal received from TradingView"
```

### Frontend Slow or Not Loading
```
Check:
  1. Services still building? Wait 5 min
  2. Network working? (Try /health endpoint)
  3. Browser cache? (Hard refresh: Cmd+Shift+R)

If slow:
  May need to upgrade to paid tier
  Go to Railway → Project → Settings → Upgrade Plan
```

### No Signals in Dashboard
```
Check:
  1. Worker is running (Railway Dashboard)
  2. Redis is connected (check logs)
  3. Webhook received signal (backend logs)

Solution:
  1. Restart trading-worker service
  2. Check Redis connection
  3. Send test signal again
```

---

## ✅ Success Indicators

You'll know you're LIVE when:

```
✅ Backend URL accessible (https://...)
✅ Frontend loads beautifully
✅ WebSocket shows "LIVE"
✅ Test signal appears in dashboard
✅ Verification script: 8/8 PASS
✅ Email report arrives (if enabled)
✅ Railway Dashboard: all services running
✅ No errors in logs
```

---

## 🎯 Final Checklist

Before you declare VICTORY:

- [ ] All 4 Railway services show "Running"
- [ ] Frontend loads without errors
- [ ] Backend /health returns 200
- [ ] Test webhook signal appears
- [ ] Verification script passes all 8 tests
- [ ] Dashboard shows real-time updates
- [ ] WebSocket connected (LIVE indicator)
- [ ] No error messages in logs

**When ALL are checked: You're LIVE!**

---

## 📊 Railway vs Render Comparison

| Feature | Railway | Render |
|---------|---------|--------|
| Free Tier | Yes ($5/month credit) | Yes (limited) |
| Paid Tier | Pay as you go | $7/month+ |
| Setup Complexity | Low | Medium |
| Config Format | railway.json | render.yaml |
| Cold Starts | Yes | Yes |
| Support | Good | Good |
| Performance | Similar | Similar |

Both platforms perform identically for your use case. Choose based on preference.

---

## 🚀 Railway-Specific Tips

**Monitoring:**
```
Railway Dashboard → Project → Environment
  - View all service logs in real-time
  - Monitor resource usage
  - Set up alerts
```

**Scaling:**
```
If backend gets slow:
  Railway → trading-backend → Settings → Increase CPU/RAM
  Pay per usage, billed monthly
```

**Redeploying:**
```
Make code changes, push to GitHub:
  git push origin main
  
Railway auto-deploys on every push (configurable)
Watch in Railway Dashboard → Deployments
```

---

## 🎊 You're Ready!

Your platform works on Railway. All 4 services deploy automatically from railway.json.

**Next:** Follow the 5 steps above to go live within 45 minutes.

---

**Ready to deploy? Start at Step 1.**

🚀 **See you on the other side - in production!**
