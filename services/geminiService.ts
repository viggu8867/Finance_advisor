
import type { PortfolioItem, FinancialGoal, Expense, NewsArticle } from '../types';

const BASE_URL = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:5000';

export const fetchQuotes = async (symbols: string[]): Promise<Record<string, number>> => {
    if (!symbols.length) return {};
    const uniq = Array.from(new Set(symbols.map(s => s.toUpperCase())));
    try {
        const res = await fetch(`${BASE_URL}/api/quotes?symbols=${encodeURIComponent(uniq.join(','))}`);
        const data = await res.json();
        const quotes: Record<string, number> = {};
        Object.entries((data.quotes || {}) as Record<string, { price: number }>).forEach(([sym, q]) => {
            quotes[sym] = q.price;
        });
        return quotes;
    } catch (e) {
        console.error('Error fetching quotes', e);
        return {};
    }
};

export const fetchHistory = async (symbol: string, period = '1mo', interval = '1d') => {
    try {
        const res = await fetch(`${BASE_URL}/api/history?symbol=${encodeURIComponent(symbol)}&period=${encodeURIComponent(period)}&interval=${encodeURIComponent(interval)}`);
        return await res.json();
    } catch (e) {
        console.error('Error fetching history', e);
        return { symbol, series: [] };
    }
};

export const convertCurrency = async (amount: number, base = 'USD', quote = 'INR') => {
    try {
        const res = await fetch(`${BASE_URL}/api/convert?amount=${encodeURIComponent(String(amount))}&base=${encodeURIComponent(base)}&quote=${encodeURIComponent(quote)}`);
        return await res.json();
    } catch (e) {
        console.error('Error converting currency', e);
        return { amount, rate: null, converted: null };
    }
};

export const analyzePortfolio = async (portfolio: PortfolioItem[]): Promise<string> => {
    try {
        const res = await fetch(`${BASE_URL}/api/ai/analyze-portfolio`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ portfolio }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed');
        return data.text;
    } catch (error) {
        console.error("Error analyzing portfolio:", error);
        return "An error occurred while analyzing the portfolio. Please try again.";
    }
};

export const getGoalAdvice = async (goal: FinancialGoal): Promise<string> => {
    try {
        const res = await fetch(`${BASE_URL}/api/ai/goal-advice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ goal }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed');
        return data.text;
    } catch (error) {
        console.error("Error getting goal advice:", error);
        return "An error occurred while generating advice for your goal. Please try again.";
    }
};

export const getExpenseAdvice = async (monthlyExpenses: Expense[], goals: FinancialGoal[], monthlyIncome: number): Promise<string> => {
    try {
        const res = await fetch(`${BASE_URL}/api/ai/expense-advice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ monthlyExpenses, goals, monthlyIncome }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed');
        return data.text;
    } catch (error) {
        console.error("Error getting expense advice:", error);
        return "An error occurred while generating expense advice. Please try again.";
    }
};


export const fetchMarketNews = async (topic: string) => {
    try {
        const res = await fetch(`${BASE_URL}/api/ai/news?topic=${encodeURIComponent(topic)}`);
        const data = await res.json();
        return { articles: (data.articles || []) as NewsArticle[] };
    } catch (error) {
        console.error("Error fetching market news:", error);
        return { articles: [] };
    }
};

export const getFinancialTipOfTheDay = async (): Promise<string> => {
    try {
        const res = await fetch(`${BASE_URL}/api/ai/goal-advice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ goal: { name: 'General Savings', targetAmount: 100, currentAmount: 0 } }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed');
        return data.text;
    } catch (error) {
        console.error("Error getting financial tip:", error);
        return "Could not fetch a tip right now. Try to save a little extra today!";
    }
};


export const getChatResponseStream = async (history: { role: string; parts: { text: string }[] }[], newMessage: string) => {
    const systemInstructionPart = history.find(h => h.role === 'system');
    const systemInstruction = systemInstructionPart ? systemInstructionPart.parts[0].text : undefined;
    const filteredHistory = history.filter(h => h.role === 'user' || h.role === 'model');
    const controller = new AbortController();
    const send = async () => {
        const res = await fetch(`${BASE_URL}/api/ai/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ history: filteredHistory, newMessage, systemInstruction }),
            signal: controller.signal,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed');
        return data.text as string;
    };
    // Emulate a stream with a simple chunker
    const full = await send();
    async function* generator() {
        const chunkSize = Math.ceil(full.length / 20) || 1;
        for (let i = 0; i < full.length; i += chunkSize) {
            yield { text: full.slice(i, i + chunkSize) } as any;
            await new Promise(r => setTimeout(r, 20));
        }
    }
    return generator();
};

export const getPortfolioCheckinSummary = async (portfolio: PortfolioItem[]): Promise<string> => {
    try {
        const res = await fetch(`${BASE_URL}/api/ai/analyze-portfolio`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ portfolio }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed');
        // Take the first sentence as a quick check-in
        const text = (data.text || '').split(/(?<=[.!?])\s+/)[0] || 'Quick check-in unavailable.';
        return text;
    } catch (error) {
        console.error("Error getting portfolio check-in summary:", error);
        return "Could not fetch a quick summary at this time.";
    }
};
