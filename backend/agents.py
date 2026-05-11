import os
import json
from anthropic import Anthropic
import yfinance as yf
import google.generativeai as genai

anthropic_client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", "dummy_key"))
genai.configure(api_key=os.getenv("GEMINI_API_KEY", "dummy_key"))

class AIBrain:
    """
    The master orchestrator that delegates tasks to sub-agents.
    """
    def __init__(self):
        self.market_agent = MarketResearchAgent()
        self.technical_agent = TechnicalResearchAgent()
        self.gemini_agent = GeminiQualitativeAgent()

    def generate_comprehensive_report(self, symbol: str, technical_data: dict, timeframe: str):
        print(f"[AI Brain] Delegating research for {symbol}...")
        market_context = self.market_agent.research_fundamentals(symbol)
        technical_context = self.technical_agent.analyze_price_action(symbol, technical_data, timeframe)
        
        print(f"[AI Brain] Requesting qualitative analysis from Gemini for {symbol}...")
        qualitative_narrative = self.gemini_agent.analyze_narrative(symbol, market_context, technical_context)
        
        return {
            "market_context": market_context,
            "technical_context": technical_context,
            "qualitative_narrative_gemini": qualitative_narrative,
            "synthesis": "Synthesis complete. Data ready for Claude's final verdict."
        }

class MarketResearchAgent:
    """
    Agent responsible for fetching company info and macro context.
    """
    def research_fundamentals(self, symbol: str) -> str:
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            sector = info.get("sector", "Unknown Sector")
            industry = info.get("industry", "Unknown Industry")
            market_cap = info.get("marketCap", "Unknown Market Cap")
            return f"{symbol} operates in {sector} ({industry}) with a market cap of {market_cap}. Check latest earnings for more context."
        except Exception as e:
            return f"Failed to retrieve fundamental data for {symbol}: {e}"

class TechnicalResearchAgent:
    """
    Agent responsible for translating raw numbers into an AI-readable technical summary.
    """
    def analyze_price_action(self, symbol: str, data: dict, timeframe: str) -> str:
        trend = data.get("trend", "unknown")
        rsi = data.get("rsi_14", 50)
        volume = "high" if data.get("volume_spike") else "normal"
        
        analysis = f"On the {timeframe} timeframe, {symbol} is in a {trend}. "
        analysis += f"RSI is currently at {rsi:.1f}. "
        if rsi > 70:
            analysis += "The asset is technically overbought. "
        elif rsi < 30:
            analysis += "The asset is technically oversold. "
            
        analysis += f"Volume is currently {volume}."
        return analysis

class GeminiQualitativeAgent:
    """
    Uses Gemini to perform qualitative research and narrative analysis.
    """
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-1.5-flash')

    def analyze_narrative(self, symbol: str, fundamental_context: str, technical_context: str) -> str:
        if os.getenv("GEMINI_API_KEY", "dummy_key") == "dummy_key":
            return "Gemini API key not configured. Qualitative research skipped."
            
        prompt = f'''
You are a seasoned qualitative market researcher.
We are analyzing the stock ticker: {symbol}.

Fundamental Context: {fundamental_context}
Technical Context: {technical_context}

Please provide a concise 2-sentence qualitative narrative analyzing the market regime, sentiment, and potential catalysts for this asset based on this context. 
Focus strictly on narrative logic, don't just repeat the numbers.
        '''
        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            return f"Gemini research failed: {e}"

# Singleton instance
brain = AIBrain()
