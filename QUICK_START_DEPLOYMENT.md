# Quick Start: Deploy in 30 Minutes

**For:** Suhas GM  
**Time:** ~30 minutes  
**Status:** Production Ready  

---

## ⚡ TL;DR Quick Checklist

```
10 min  │ [ ] Gather API keys (Anthropic, Gemini)
        │ [ ] Generate webhook secret: openssl rand -base64 32
─────────
10 min  │ [ ] Create Render.com account (sign up with GitHub)
        │ [ ] Deploy using render.yaml blueprint
        │ [ ] Configure environment variables
─────────
5 min   │ [ ] Get backend URL from Render Dashboard
        │ [ ] Configure TradingView webhook URL
        │ [ ] Send test webhook signal
─────────
5 min   │ [ ] Run verification script: bash scripts/verify_deployment.sh
        │ [ ] Open frontend dashboard
        │ [ ] See test signal appear
```

---

## 🚀 Step-by-Step (30 min)

### Step 1: API Keys (5 minutes)

**Get Anthropic Key:**
1. Go to https://console.anthropic.com/
2. Click **API Keys** → **Create New Key**
3. Copy the key (starts with `sk-ant-v0-`)
4. Save it somewhere safe

**Get Gemini Key:**
1. Go to https://aistudio.google.com/app/apikey
2. Click **Create API Key**
3. Copy the key
4. Save it

**Generate Webhook Secret:**
```bash
openssl rand -base64 32
# Output: QmFzZTY0RW5jb2RlZFN0cmluZzEyMzQ1Njc4OTAx
# Copy this value
```

### Step 2: Deploy to Render (10 minutes)

**Create Render Account:**
1. Go to https://render.com
2. Sign up with **GitHub** (easiest)
3. Grant permission to your repos

**Deploy Platform:**
1. In Render Dashboard → **New** → **Blueprint**
2. Select repo: `surfingalien/AI-Quantitative-Platform`
3. Branch: `main`
4. Click **Deploy**

**Configure Environment Variables:**
1. Wait for deployment to start
2. Go to **trading-backend** service
3. **Environment** tab
4. Add these variables:
   ```
   ANTHROPIC_API_KEY = [your key from step 1]
   GEMINI_API_KEY = [your key from step 1]
   WEBHOOK_SECRET = [your secret from step 1]
   ```
5. **Save** and services will restart

**Wait for Status:**
```
✅ trading-redis          LIVE
✅ trading-backend       LIVE
✅ trading-worker        LIVE
✅ trading-frontend      LIVE
```

This takes ~5-8 minutes.

### Step 3: TradingView Setup (5 minutes)

**Get Your Backend URL:**
1. Render Dashboard → **trading-backend** service
2. Copy **Render URL** (looks like: `https://trading-backend-abcd1234.onrender.com`)

**Create Alert in TradingView:**
1. Open any chart in TradingView Desktop
2. **Alert Settings** → **New Alert**
3. Set your condition (your trading strategy)
4. Message: 
   ```json
   {
     "secret": "YOUR_WEBHOOK_SECRET",
     "symbol": "{{exchange}}:{{ticker}}",
     "action": "BUY",
     "price": {{close}},
     "volume": {{volume}},
     "rsi": {{your_rsi_value}},
     "macd": "bullish"
   }
   ```
5. **Webhook URL:**
   ```
   https://trading-backend-[your-id].onrender.com/api/tv-webhook
   ```
6. Click **Test** to verify
7. **Create Alert**

### Step 4: Verify It Works (5 minutes)

**Run Verification Script:**
```bash
cd /tmp/AI-Quantitative-Platform
bash scripts/verify_deployment.sh https://trading-backend-[your-id].onrender.com
```

Expected output:
```
✅ Health check - PASS
✅ Portfolio endpoint - PASS
✅ Signals endpoint - PASS
✅ Webhook endpoint - PASS
✅ Performance endpoint - PASS
✅ Signal processing - PASS
✅ Response time - PASS (< 1000ms)
✅ SSL certificate - PASS
```

**Open Frontend Dashboard:**
1. Get frontend URL from Render: `https://trading-frontend-[your-id].onrender.com`
2. Open in browser
3. Go to **Signals** tab
4. Should be empty initially

**Send Test Signal:**
```bash
curl -X POST https://trading-backend-[your-id].onrender.com/api/tv-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "YOUR_WEBHOOK_SECRET",
    "symbol": "AAPL",
    "action": "BUY",
    "price": 150.25,
    "volume": 1000000,
    "rsi": 65,
    "macd": "bullish_cross",
    "confidence": 7.5
  }'
```

**Check Frontend:**
1. Refresh the dashboard
2. Go to **Signals** tab
3. You should see your test signal
4. It should show status: **PROCESSED** or **QUEUED**

---

## 📱 What's Running Now?

Your platform is now **LIVE**:

```
┌─────────────────────────────────────┐
│      Your Trading Platform Live     │
├─────────────────────────────────────┤
│                                     │
│  TradingView Alerts                 │
│         ↓                           │
│  Webhook: /api/tv-webhook           │
│         ↓                           │
│  Signal Validation Skill            │
│  ↓      ↓        ↓                  │
│ Data  Confidence  Quality Check     │
│         ↓                           │
│  Portfolio Optimization Skill       │
│  ↓                  ↓               │
│ Position Size    Risk Limits        │
│         ↓                           │
│  Trading Executor Agent             │
│  ↓          ↓         ↓             │
│ Execute   Set Stops  Update P&L     │
│         ↓                           │
│  Real-time Dashboard                │
│  (Frontend at your-domain.onrender) │
│                                     │
└─────────────────────────────────────┘
```

---

## 🎯 What's Next?

### Immediate (Today)
- [x] Deploy platform ✅
- [x] Configure webhooks ✅
- [x] Send test signal ✅
- [ ] Monitor for 24 hours
- [ ] Check daily performance report

### This Week
- [ ] Review CLAUDE.md (your guidelines)
- [ ] Test with 5-10 real signals
- [ ] Verify backtest accuracy
- [ ] Confirm risk limits working

### Next Week
- [ ] Switch to **paper trading mode**
- [ ] Run for 7-10 days
- [ ] Collect performance data
- [ ] Monitor win rate (target: > 55%)

### Week After
- [ ] Review all metrics
- [ ] Check vs backtest results
- [ ] If all good: switch to **live trading**
- [ ] Start with 0.5% risk per trade

---

## 🐛 Quick Troubleshooting

**Platform won't deploy:**
- Check Render logs: Dashboard → service → Logs
- Verify GitHub repo is public or connected
- Try restarting deployment

**Webhook not receiving signals:**
- Check webhook URL is correct
- Verify WEBHOOK_SECRET matches in both places
- Check Render logs for errors
- Try sending manual curl command (see above)

**Signals not appearing in dashboard:**
- Check worker process is running: Dashboard → trading-worker → check status
- Try refreshing browser
- Check browser console for errors
- Verify Redis is connected

**Slow response times:**
- Check if services are still starting (first deploy takes longer)
- Check CPU/Memory in Render Dashboard
- If consistently slow, upgrade to paid tier

---

## 📊 Performance Baseline

After first day of paper trading, you should see:

```
✓ Signals received:      5-20 per day
✓ Processing latency:    < 2 seconds
✓ Error rate:            0% (or very low)
✓ Dashboard loading:     < 1 second
✓ WebSocket connected:   Yes
✓ Worker processing:     Active
```

---

## 🔐 Security Checklist

Before **LIVE TRADING**:

```
[ ] WEBHOOK_SECRET is strong (32+ chars)
[ ] API keys are in Render environment (NOT in code)
[ ] Frontend runs on HTTPS (Render auto-enables)
[ ] Backend runs on HTTPS (Render auto-enables)
[ ] CORS origins restricted to your domain
[ ] Rate limiting enabled (10/min default)
[ ] Database is secure
[ ] No keys in git history
[ ] Backups configured
```

---

## 📞 Support

**Documentation:**
- PRODUCTION_DEPLOYMENT_GUIDE.md — Full details
- CLAUDE.md — Your custom guidelines
- INTEGRATION_GUIDE.md — How signals flow

**Endpoints Reference:**
```
Health:         GET  /health
Portfolio:      GET  /api/portfolio
Signals:        GET  /api/signals
Performance:    GET  /api/performance
Webhook:        POST /api/tv-webhook
WebSocket:      WS   /ws
```

**Monitoring:**
- Render Dashboard: https://dashboard.render.com
- Frontend Dashboard: https://your-frontend-domain.onrender.com
- Performance Reports: Daily at 9 AM UTC to your email

---

## ✅ Success Criteria

Your deployment is successful when:

1. ✅ All 4 services show "Live" in Render
2. ✅ Health check returns 200
3. ✅ Test webhook signal appears in dashboard
4. ✅ Verification script reports all PASS
5. ✅ Frontend loads without errors
6. ✅ Real signal from TradingView processes successfully

**You are now LIVE and ready to trade!**

---

**Generated:** 2026-05-21  
**For:** Suhas GM (suhasgm@gmail.com)  
**Platform:** AI-Quantitative Trading System v1.0.0
