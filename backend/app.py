from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import google.generativeai as genai
import time
import hashlib
from typing import Any, Dict, Tuple
from werkzeug.exceptions import HTTPException
import yfinance as yf

# Configure Gemini API
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

app = Flask(__name__)
# Limit request payload size to 1MB
app.config['MAX_CONTENT_LENGTH'] = 1 * 1024 * 1024
CORS(app) # Enable CORS for all routes

# Simple in-memory rate limiter (per-IP)
RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMIT_MAX_REQUESTS = 60
_rate_bucket: Dict[str, list] = {}

# Simple in-memory cache with TTL
_cache: Dict[str, Tuple[float, Any]] = {}


@app.before_request
def apply_rate_limit():
    try:
        ip = request.headers.get('X-Forwarded-For', request.remote_addr) or 'unknown'
        now = time.time()
        window_start = now - RATE_LIMIT_WINDOW_SECONDS
        history = _rate_bucket.get(ip, [])
        # Drop old entries
        history = [t for t in history if t > window_start]
        if len(history) >= RATE_LIMIT_MAX_REQUESTS:
            return jsonify({"error": "Too many requests, please slow down."}), 429
        history.append(now)
        _rate_bucket[ip] = history
    except Exception:
        # Never block request due to limiter failure
        pass


@app.errorhandler(HTTPException)
def handle_http_exception(err: HTTPException):
    return jsonify({"error": err.description or err.name, "status": err.code}), err.code


@app.errorhandler(Exception)
def handle_exception(err: Exception):
    # Avoid leaking internals; log if needed
    return jsonify({"error": "Internal Server Error"}), 500

@app.route('/')
def healthcheck():
    return jsonify(message="Finance Advisor backend is running")


# ---------- AI Endpoints ----------

def ensure_api_key():
    if not GEMINI_API_KEY:
        # Don't hard error; allow endpoints to return mock responses for smooth UX
        return None
    return None


def _cache_key(prefix: str, payload: Dict[str, Any]) -> str:
    key_raw = prefix + "::" + hashlib.sha256(repr(sorted(payload.items())).encode()).hexdigest()
    return key_raw


def _get_cached(key: str, ttl_seconds: int):
    entry = _cache.get(key)
    if not entry:
        return None
    ts, value = entry
    if time.time() - ts <= ttl_seconds:
        return value
    _cache.pop(key, None)
    return None


def _set_cached(key: str, value: Any):
    _cache[key] = (time.time(), value)


def generate_text(prompt: str, model: str = "gemini-2.0-flash"):  # use a fast default
    # Retry with backoff
    last_exc = None
    for attempt in range(3):
        try:
            model_client = genai.GenerativeModel(model)
            response = model_client.generate_content(prompt)
            return response.text
        except Exception as e:
            last_exc = e
            sleep_time = 0.5 * (2 ** attempt)
            time.sleep(sleep_time)
    raise last_exc


@app.post('/api/ai/analyze-portfolio')
def analyze_portfolio():
    err = ensure_api_key()
    if err:
        return err
    data = request.get_json(force=True) or {}
    if not isinstance(data, dict):
        return jsonify({"error": "Invalid JSON body"}), 400
    portfolio = data.get('portfolio', [])
    if not isinstance(portfolio, list) or len(portfolio) > 200:
        return jsonify({"error": "Invalid portfolio payload"}), 400
    prompt = (
        "Analyze the following investment portfolio. Provide: diversification, risk profile, "
        "opportunities, strengths and weaknesses. Return concise markdown.\n\n" +
        "\n".join([f"- {p.get('name')} ({p.get('ticker')}): {p.get('shares')} shares" for p in portfolio])
    )
    try:
        cache_key = _cache_key('analyze_portfolio', {"p": portfolio})
        cached = _get_cached(cache_key, ttl_seconds=120)
        if cached is not None:
            return jsonify({"text": cached})
        if GEMINI_API_KEY:
            text = generate_text(prompt)
        else:
            text = """
            ## Portfolio Overview (Mock)
            - Diversification looks reasonable across current holdings.
            - Risk profile: Moderate, given concentration in a few large-cap tech names.
            - Consider adding non-tech exposure and fixed income for balance.
            """.strip()
        _set_cached(cache_key, text)
        return jsonify({"text": text})
    except Exception as e:
        # Fallback mock if AI call failed
        text = (
            "## Portfolio Overview (Fallback)\n"
            "- Unable to fetch live analysis right now.\n"
            "- Suggest keeping allocations balanced and reviewing costs."
        )
        return jsonify({"text": text}), 200


@app.post('/api/ai/goal-advice')
def goal_advice():
    err = ensure_api_key()
    if err:
        return err
    data = request.get_json(force=True) or {}
    if not isinstance(data, dict):
        return jsonify({"error": "Invalid JSON body"}), 400
    goal = data.get('goal', {})
    if not isinstance(goal, dict):
        return jsonify({"error": "Invalid goal payload"}), 400
    target = goal.get('targetAmount', 0)
    current = goal.get('currentAmount', 0)
    remaining = max(0, target - current)
    prompt = f"""
    I have a financial goal: "{goal.get('name','')}".
    - Target Amount: ₹{target}
    - Current Savings: ₹{current}
    - Amount still needed: ₹{remaining}
    {"- This is a loan I need to repay." if goal.get('isLoan') else ''}

    First, state clearly how much more I need to save to reach my goal.
    Then, give 2-3 actionable bullet points in concise markdown.
    """
    try:
        cache_key = _cache_key('goal_advice', {"g": goal})
        cached = _get_cached(cache_key, ttl_seconds=180)
        if cached is not None:
            return jsonify({"text": cached})
        if GEMINI_API_KEY:
            text = generate_text(prompt)
        else:
            text = f"""
            You need ₹{remaining} more to reach "{goal.get('name','your goal')}".
            - Set aside a fixed weekly amount toward the goal.
            - Reduce one discretionary expense category by 10-15% and redirect it.
            - Automate a monthly transfer on payday.
            """.strip()
        _set_cached(cache_key, text)
        return jsonify({"text": text})
    except Exception as e:
        text = (
            f"You need ₹{remaining} more.\n- Try small weekly transfers.\n- Trim a wants category by 10%."
        )
        return jsonify({"text": text}), 200


@app.post('/api/ai/expense-advice')
def expense_advice():
    err = ensure_api_key()
    if err:
        return err
    data = request.get_json(force=True) or {}
    if not isinstance(data, dict):
        return jsonify({"error": "Invalid JSON body"}), 400
    expenses = data.get('monthlyExpenses', [])
    goals = data.get('goals', [])
    monthly_income = data.get('monthlyIncome', 0)
    if not isinstance(expenses, list) or not isinstance(goals, list):
        return jsonify({"error": "Invalid expenses or goals payload"}), 400
    if len(expenses) > 1000 or len(goals) > 500:
        return jsonify({"error": "Payload too large"}), 400
    has_loan = any(g.get('isLoan') for g in goals)
    expenses_str = "\n".join([f"- {e.get('description')} ({e.get('category')}): ₹{e.get('amount')}" for e in expenses])
    goals_str = "\n".join([f"- {g.get('name')}: Target ₹{g.get('targetAmount')}" for g in goals])
    prompt = f"""
    As a financial advisor AI, analyze my spending and give personalized advice.
    - Monthly Income: ₹{monthly_income}
    - Monthly Expenses:\n{expenses_str}
    - Financial Goals:\n{goals_str}
    {"- Important Note: I have an active loan." if has_loan else ''}

    Respond in structured markdown with:
    1. Financial Health Score (0-100)
    2. Key Observations (2-3 bullets)
    3. Action Plan with a tailored 50/30/20 budget and concrete suggestions
    """
    try:
        cache_key = _cache_key('expense_advice', {"e": expenses, "g": goals, "i": monthly_income})
        cached = _get_cached(cache_key, ttl_seconds=180)
        if cached is not None:
            return jsonify({"text": cached})
        if GEMINI_API_KEY:
            text = generate_text(prompt)
        else:
            wants = max(0, round(monthly_income * 0.3))
            needs = max(0, round(monthly_income * 0.5))
            savings = max(0, monthly_income - wants - needs)
            text = f"""
            ### Financial Health (Mock)
            - Estimated score: 70/100
            - Key observations: spending is steady; consider trimming discretionary items.

            ### Action Plan
            - 50/30/20 suggestion: Needs ₹{needs}, Wants ₹{wants}, Savings ₹{savings}.
            - Reduce the highest non-essential category by 10% this month.
            - Set an auto-transfer to savings on payday.
            """.strip()
        _set_cached(cache_key, text)
        return jsonify({"text": text})
    except Exception as e:
        text = (
            "### Plan (Fallback)\n- Keep wants under 30%.\n- Automate savings first.\n- Review subscriptions."
        )
        return jsonify({"text": text}), 200


@app.get('/api/ai/news')
def market_news():
    err = ensure_api_key()
    if err:
        return err
    topic = request.args.get('topic', 'global markets')
    if not isinstance(topic, str) or len(topic) > 200:
        return jsonify({"error": "Invalid topic"}), 400
    prompt = (
        f"Provide a JSON object with key 'articles' which is an array of 3 objects with keys "
        f"'title', 'summary', 'source'. Summarize the latest financial news about '{topic}'. "
        f"Keep summaries brief."
    )
    try:
        cache_key = _cache_key('news', {"t": topic})
        cached = _get_cached(cache_key, ttl_seconds=300)
        if cached is not None:
            return jsonify(cached)
        if GEMINI_API_KEY:
            text = generate_text(prompt)
        else:
            parsed = {
                "articles": [
                    {"title": f"{topic.title()} update", "summary": "Markets mixed; investors watch guidance.", "source": "https://example.com"},
                    {"title": "Rates and inflation", "summary": "Policy outlook remains data-dependent.", "source": "https://example.com"},
                    {"title": "Earnings season", "summary": "Select sectors beat expectations.", "source": "https://example.com"},
                ]
            }
            _set_cached(cache_key, parsed)
            return jsonify(parsed)
        # Try extract JSON between fences if present
        cleaned = text.strip().removeprefix("```json").removesuffix("```").strip()
        import json
        try:
            parsed = json.loads(cleaned)
        except Exception:
            parsed = {"articles": []}
        _set_cached(cache_key, parsed)
        return jsonify(parsed)
    except Exception as e:
        return jsonify({"articles": [], "error": str(e)})


@app.post('/api/ai/chat')
def chat():
    err = ensure_api_key()
    if err:
        return err
    data = request.get_json(force=True) or {}
    if not isinstance(data, dict):
        return jsonify({"error": "Invalid JSON body"}), 400
    history = data.get('history', [])  # [{role, parts:[{text}]}]
    new_message = data.get('newMessage', '')
    system_instruction = data.get('systemInstruction')
    try:
        if system_instruction:
            model_client = genai.GenerativeModel("gemini-2.0-flash", system_instruction=system_instruction)
        else:
            model_client = genai.GenerativeModel("gemini-2.0-flash")

        # Convert history to the Python SDK's expected format (list of contents)
        contents = []
        for h in history:
            role = h.get('role')
            parts = h.get('parts', [])
            text = "\n".join([p.get('text', '') for p in parts])
            contents.append({"role": role, "parts": [text]})
        contents.append({"role": "user", "parts": [new_message]})
        # Not cached because chat should be real-time, but we keep retries via generate_text logic if refactored
        response = model_client.generate_content(contents)
        return jsonify({"text": response.text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------- Market Quotes Endpoint ----------

@app.get('/api/quotes')
def get_quotes():
    symbols_param = request.args.get('symbols', '')
    if not symbols_param:
        return jsonify({"error": "symbols query param required"}), 400
    # sanitize and cap number of symbols
    symbols = [s.strip().upper() for s in symbols_param.split(',') if s.strip()]
    symbols = list(dict.fromkeys(symbols))[:50]
    cache_key = _cache_key('quotes', {"symbols": symbols})
    cached = _get_cached(cache_key, ttl_seconds=30)
    if cached is not None:
        return jsonify(cached)
    try:
        data = {}
        # yfinance Ticker info can be slow; use fast info when possible
        tickers = yf.Tickers(' '.join(symbols))
        for sym in symbols:
            try:
                t = getattr(tickers, sym)
                price = None
                if hasattr(t, 'fast_info') and getattr(t.fast_info, 'last_price', None) is not None:
                    price = float(t.fast_info.last_price)
                else:
                    hist = t.history(period='1d', interval='1m')
                    if not hist.empty:
                        price = float(hist['Close'].iloc[-1])
                if price is not None:
                    data[sym] = {"price": price}
            except Exception:
                # skip individual symbol errors
                continue
        result = {"quotes": data}
        _set_cached(cache_key, result)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e), "quotes": {}}), 500


@app.get('/api/history')
def get_history():
    symbol = request.args.get('symbol', '').strip().upper()
    period = request.args.get('period', '1mo')  # e.g., 5d,1mo,3mo,6mo,1y,5y
    interval = request.args.get('interval', '1d')  # 1m,5m,15m,1d,1wk,1mo
    if not symbol:
        return jsonify({"error": "symbol query param required"}), 400
    cache_key = _cache_key('history', {"s": symbol, "p": period, "i": interval})
    cached = _get_cached(cache_key, ttl_seconds=300)
    if cached is not None:
        return jsonify(cached)
    try:
        t = yf.Ticker(symbol)
        hist = t.history(period=period, interval=interval)
        series = []
        if not hist.empty:
            for ts, row in hist.iterrows():
                series.append({
                    "t": int(ts.timestamp() * 1000),
                    "o": float(row.get('Open', 0) or 0),
                    "h": float(row.get('High', 0) or 0),
                    "l": float(row.get('Low', 0) or 0),
                    "c": float(row.get('Close', 0) or 0),
                    "v": float(row.get('Volume', 0) or 0),
                })
        result = {"symbol": symbol, "period": period, "interval": interval, "series": series}
        _set_cached(cache_key, result)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e), "series": []}), 500


@app.get('/api/convert')
def convert_currency():
    # Simple FX via yfinance (uses ticker like USDINR=X)
    base = (request.args.get('base') or 'USD').upper()
    quote = (request.args.get('quote') or 'INR').upper()
    amount = float(request.args.get('amount') or '1')
    if amount < 0:
        return jsonify({"error": "amount must be >= 0"}), 400
    if base == quote:
        return jsonify({"amount": amount, "rate": 1.0, "converted": amount})
    pair = f"{base}{quote}=X"
    cache_key = _cache_key('fx', {"p": pair})
    cached = _get_cached(cache_key, ttl_seconds=180)
    try:
        if cached is None:
            t = yf.Ticker(pair)
            info = getattr(t, 'fast_info', None)
            rate = None
            if info and getattr(info, 'last_price', None) is not None:
                rate = float(info.last_price)
            else:
                hist = t.history(period='1d', interval='1h')
                if not hist.empty:
                    rate = float(hist['Close'].iloc[-1])
            if rate is None:
                return jsonify({"error": "FX rate unavailable"}), 502
            _set_cached(cache_key, {"rate": rate})
            cached = {"rate": rate}
        rate = cached["rate"]
        converted = amount * rate
        return jsonify({"amount": amount, "rate": rate, "converted": converted, "base": base, "quote": quote})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=int(os.environ.get('PORT', 5000)))
