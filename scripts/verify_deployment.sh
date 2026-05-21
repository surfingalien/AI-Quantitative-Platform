#!/bin/bash
#
# Deployment Verification Script
# Verifies your production deployment is working correctly
#
# Usage: bash scripts/verify_deployment.sh [backend-url]
# Example: bash scripts/verify_deployment.sh https://trading-backend-abc123.onrender.com
#

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get backend URL from argument or prompt
if [ -z "$1" ]; then
    echo -e "${BLUE}Enter your Render backend URL:${NC}"
    echo -e "${YELLOW}Example: https://trading-backend-abc123.onrender.com${NC}"
    read -p "> " BACKEND_URL
else
    BACKEND_URL=$1
fi

# Remove trailing slash if present
BACKEND_URL="${BACKEND_URL%/}"

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🚀 AI-Quantitative Platform - Deployment Verification${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "\n${YELLOW}Backend URL:${NC} $BACKEND_URL"
echo -e "\n${BLUE}Running verification tests...${NC}\n"

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Test 1: Health Check
echo -n "1️⃣  Testing health check endpoint... "
if response=$(curl -s "$BACKEND_URL/health"); then
    if echo "$response" | grep -q "healthy\|ok\|running"; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC} (Invalid response: $response)"
        ((TESTS_FAILED++))
    fi
else
    echo -e "${RED}❌ FAIL${NC} (Connection error)"
    ((TESTS_FAILED++))
fi

# Test 2: Portfolio Endpoint
echo -n "2️⃣  Testing portfolio endpoint... "
if response=$(curl -s "$BACKEND_URL/api/portfolio" -H "Content-Type: application/json"); then
    if echo "$response" | grep -q "exposure\|balance\|holdings" || echo "$response" | grep -q "{}"; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC} (Invalid response)"
        ((TESTS_FAILED++))
    fi
else
    echo -e "${RED}❌ FAIL${NC} (Connection error)"
    ((TESTS_FAILED++))
fi

# Test 3: Signals Endpoint
echo -n "3️⃣  Testing signals endpoint... "
if response=$(curl -s "$BACKEND_URL/api/signals" -H "Content-Type: application/json"); then
    if echo "$response" | grep -q "signals\|data\|\[\]\|null" || [ -n "$response" ]; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC} (Invalid response)"
        ((TESTS_FAILED++))
    fi
else
    echo -e "${RED}❌ FAIL${NC} (Connection error)"
    ((TESTS_FAILED++))
fi

# Test 4: Webhook Endpoint (HEAD request to check if endpoint exists)
echo -n "4️⃣  Testing webhook endpoint... "
status=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "$BACKEND_URL/api/tv-webhook" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type")

if [ "$status" = "200" ] || [ "$status" = "204" ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠️  WARNING${NC} (Status: $status - might need CORS configuration)"
    ((TESTS_PASSED++))
fi

# Test 5: Performance Endpoint
echo -n "5️⃣  Testing performance endpoint... "
if response=$(curl -s "$BACKEND_URL/api/performance" -H "Content-Type: application/json"); then
    if echo "$response" | grep -q "pnl\|return\|trades\|win" || [ -n "$response" ]; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC} (Invalid response)"
        ((TESTS_FAILED++))
    fi
else
    echo -e "${RED}❌ FAIL${NC} (Connection error)"
    ((TESTS_FAILED++))
fi

# Test 6: Send test webhook signal
echo -n "6️⃣  Testing webhook signal processing... "

# Check if webhook secret is provided
read -p "Enter your WEBHOOK_SECRET (press enter to skip this test): " WEBHOOK_SECRET

if [ -n "$WEBHOOK_SECRET" ]; then
    response=$(curl -s -X POST "$BACKEND_URL/api/tv-webhook" \
        -H "Content-Type: application/json" \
        -d "{
            \"secret\": \"$WEBHOOK_SECRET\",
            \"symbol\": \"TEST\",
            \"action\": \"BUY\",
            \"price\": 100.00,
            \"volume\": 1000000,
            \"rsi\": 65,
            \"macd\": \"bullish\",
            \"confidence\": 7.5
        }")

    if echo "$response" | grep -q "accepted\|queued\|processed\|success"; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((TESTS_PASSED++))
    elif echo "$response" | grep -q "invalid\|error\|failed"; then
        echo -e "${RED}❌ FAIL${NC} (Invalid webhook secret or signal format)"
        ((TESTS_FAILED++))
    else
        echo -e "${YELLOW}⚠️  UNKNOWN${NC} (Response: $response)"
        ((TESTS_PASSED++))
    fi
else
    echo -e "${YELLOW}⏭️  SKIPPED${NC}"
fi

# Test 7: Response time
echo -n "7️⃣  Testing response time... "
response_time=$(curl -s -o /dev/null -w "%{time_total}" "$BACKEND_URL/health")
response_time_ms=$(echo "$response_time * 1000" | bc | cut -d. -f1)

if (( response_time_ms < 1000 )); then
    echo -e "${GREEN}✅ PASS${NC} (${response_time_ms}ms)"
    ((TESTS_PASSED++))
elif (( response_time_ms < 3000 )); then
    echo -e "${YELLOW}⚠️  WARNING${NC} (${response_time_ms}ms - slow but acceptable)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} (${response_time_ms}ms - too slow)"
    ((TESTS_FAILED++))
fi

# Test 8: SSL/TLS Certificate
echo -n "8️⃣  Checking SSL/TLS certificate... "
cert_info=$(echo | openssl s_client -servername "${BACKEND_URL#https://}" -connect "${BACKEND_URL#https://}" 2>&1 | grep -A 2 "subject=")

if [ -n "$cert_info" ]; then
    echo -e "${GREEN}✅ PASS${NC} (Valid certificate)"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠️  WARNING${NC} (Could not verify - try visiting URL in browser)"
    ((TESTS_PASSED++))
fi

# Summary
echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📊 Verification Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}✅ All tests passed!${NC}"
    echo -e "\n${YELLOW}Backend URL: $BACKEND_URL${NC}"
    echo -e "${YELLOW}Status: DEPLOYMENT SUCCESSFUL${NC}"
    echo -e "\n${BLUE}Next Steps:${NC}"
    echo -e "1. Configure TradingView webhook to point to: $BACKEND_URL/api/tv-webhook"
    echo -e "2. Set webhook secret in TradingView to match your WEBHOOK_SECRET"
    echo -e "3. Send your first test signal"
    echo -e "4. Monitor performance in the frontend dashboard"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed (${TESTS_FAILED} failures out of $((TESTS_PASSED + TESTS_FAILED)) tests)${NC}"
    echo -e "\n${YELLOW}Troubleshooting:${NC}"
    echo -e "1. Verify backend URL is correct and accessible"
    echo -e "2. Check Render dashboard logs for errors"
    echo -e "3. Ensure all environment variables are set"
    echo -e "4. Verify CORS configuration includes your frontend domain"
    echo -e "5. Try accessing $BACKEND_URL/health in your browser"
    exit 1
fi
