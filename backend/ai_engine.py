import os
import json
from anthropic import Anthropic
from dotenv import load_dotenv
from agents import brain

load_dotenv()

anthropic_client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", "dummy_key"))

def calculate_hybrid_score(ai_confidence: int, technical_data: dict) -> float:
    '''
    Deterministic scoring engine.
    Weights: Trend (30%), Momentum (20%), Volume (20%), AI Confidence (30%)
    '''
    # Mock technical scores for demonstration
    trend_score = 80 if technical_data.get("trend") == "strong_uptrend" else 40
    momentum_score = 75 if technical_data.get("rsi_14", 50) < 70 else 30
    volume_score = 85 if technical_data.get("volume_spike") else 50
    
    score = (
        trend_score * 0.3 +
        momentum_score * 0.2 +
        volume_score * 0.2 +
        (ai_confidence * 10) * 0.3  # assuming AI confidence is 1-10
    )
    return round(score, 2)

def analyze_with_claude(alert_data: dict, portfolio_context: list, technical_data: dict) -> dict:
    symbol = alert_data.get("symbol", "UNKNOWN")
    timeframe = alert_data.get("timeframe", "15m")
    
    # Delegate to AI Agents
    research_report = brain.generate_comprehensive_report(symbol, technical_data, timeframe)
    
    prompt = f'''
ROLE:
You are a professional quantitative analyst.

MARKET CONTEXT (WEBHOOK & AGENTS):
Webhook Payload: {json.dumps(alert_data, indent=2)}
Agent Research: {json.dumps(research_report, indent=2)}

TECHNICAL DATA (ENRICHED):
{json.dumps(technical_data, indent=2)}

PORTFOLIO CONTEXT:
{json.dumps(portfolio_context, indent=2)}

TASK:
Provide a structured trade assessment based on the data provided.

RULES:
- Never hallucinate prices.
- Use only supplied data.
- Return strict JSON matching this structure exactly:
{{
  "decision": "BUY|SELL|IGNORE",
  "confidence": 8,
  "reasoning": [
    "reason 1",
    "reason 2"
  ],
  "risk_factors": [
    "risk 1"
  ]
}}
'''
    
    try:
        response = anthropic_client.messages.create(
            model="claude-3-sonnet-20240229",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}]
        )
        
        content = response.content[0].text
        # In a real scenario, robust JSON parsing is needed here to extract just the JSON
        ai_response = json.loads(content)
        
        return ai_response
    except Exception as e:
        print(f"Error calling Claude: {e}")
        return {
            "decision": "IGNORE",
            "confidence": 0,
            "reasoning": [f"Error in AI evaluation: {str(e)}"],
            "risk_factors": []
        }
