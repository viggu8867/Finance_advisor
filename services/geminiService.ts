
import { GoogleGenAI, Type } from "@google/genai";
import type { PortfolioItem, FinancialGoal, Expense, NewsArticle } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const analyzePortfolio = async (portfolio: PortfolioItem[]): Promise<string> => {
    const prompt = `
        Analyze the following investment portfolio. Provide a detailed analysis covering:
        1.  **Overall Diversification**: Assess the mix of assets. Are there any concentration risks?
        2.  **Risk Profile**: Based on the holdings, what is the likely risk level (e.g., conservative, moderate, aggressive)?
        3.  **Potential Opportunities**: Suggest areas for potential growth or improvement.
        4.  **Key Strengths and Weaknesses**: Summarize the portfolio's main pros and cons.

        Portfolio Data:
        ${portfolio.map(p => `- ${p.name} (${p.ticker}): ${p.shares} shares`).join('\n')}

        Provide the analysis in a clear, concise, and easy-to-understand markdown format.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error analyzing portfolio:", error);
        return "An error occurred while analyzing the portfolio. Please check the console for details.";
    }
};

export const getGoalAdvice = async (goal: FinancialGoal): Promise<string> => {
    const remainingAmount = goal.targetAmount - goal.currentAmount;
    const prompt = `
        I have a financial goal: "${goal.name}".
        - Target Amount: ₹${goal.targetAmount.toLocaleString('en-IN')}
        - Current Savings: ₹${goal.currentAmount.toLocaleString('en-IN')}
        - **Amount still needed: ₹${remainingAmount.toLocaleString('en-IN')}**
        ${goal.isLoan ? "- This is a loan I need to repay." : ""}

        First, state clearly how much more I need to save to reach my goal.
        Then, provide a simple, concise, and easy-to-understand plan to help me save the remaining amount. Keep the advice short and give 2-3 actionable bullet points. The tone should be encouraging but direct.
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error getting goal advice:", error);
        return "An error occurred while generating advice for your goal. Please try again.";
    }
};

export const getExpenseAdvice = async (monthlyExpenses: Expense[], goals: FinancialGoal[], monthlyIncome: number): Promise<string> => {
    const hasLoan = goals.some(g => g.isLoan);
    const prompt = `
        As a financial advisor AI, analyze my spending for the month and give me personalized advice. My financial data is as follows:

        - **Monthly Income:** ₹${monthlyIncome.toLocaleString('en-IN')}
        - **Monthly Expenses:**
          ${monthlyExpenses.map(e => `- ${e.description} (${e.category}): ₹${e.amount.toLocaleString('en-IN')}`).join('\n')}
        - **Financial Goals:**
          ${goals.map(g => `- ${g.name}: Target ₹${g.targetAmount.toLocaleString('en-IN')}`).join('\n')}
        ${hasLoan ? "- **Important Note:** I have an active loan that I am trying to pay off." : ""}

        **Your Analysis & Action Plan:**
        Your response must be in well-structured markdown.

        1.  **Financial Health Score (out of 100):** Provide a score based on my savings rate, spending habits, and progress towards goals.
        2.  **Key Observations:** In a bulleted list, highlight 2-3 of the most important insights from my spending (e.g., "High spending in 'Entertainment'", "Positive savings rate").
        3.  **Action Plan:** Provide a clear, step-by-step plan.
            *   **Budget Recommendation:** Suggest a tailored 50/30/20 budget (Needs/Wants/Savings).
            *   **Specific Suggestions:** Offer concrete advice, like "Consider reducing dining out expenses by ₹X."
            *   **Loan Attack Strategy (if applicable):** If I have a loan, create a dedicated section. Identify the top non-essential "wants" category and suggest a specific amount to redirect from it to the loan payment.
        
        Your tone should be encouraging and empowering.
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error getting expense advice:", error);
        return "An error occurred while generating expense advice. Please try again.";
    }
};


export const fetchMarketNews = async (topic: string) => {
    const prompt = `Provide a summary of the top 3 latest financial news articles related to "${topic}". For each article, provide a "title", a "summary", and a "source" URL. Respond with a JSON object containing a single key "articles" which is an array of these objects.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        // Attempt to parse the JSON from the response text
        const jsonText = response.text.trim().replace(/^```json\s*|```\s*$/g, '');
        try {
            const parsedResponse = JSON.parse(jsonText) as { articles: NewsArticle[] };
            return {
                articles: parsedResponse.articles || [],
                groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks
            };
        } catch (e) {
            console.error("Failed to parse JSON from AI response:", e, "\nResponse text:", jsonText);
            return { articles: [] };
        }

    } catch (error) {
        console.error("Error fetching market news:", error);
        return {
            articles: []
        };
    }
};

export const getFinancialTipOfTheDay = async (): Promise<string> => {
    const prompt = "Give me a single, short, and actionable financial tip of the day. It should be easy for a beginner to understand and apply. Make it encouraging.";
     try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error getting financial tip:", error);
        return "Could not fetch a tip right now. Try to save a little extra today!";
    }
};


export const getChatResponseStream = async (history: { role: string; parts: { text: string }[] }[], newMessage: string) => {
    try {
        const systemInstructionPart = history.find(h => h.role === 'system');
        const systemInstruction = systemInstructionPart ? systemInstructionPart.parts[0].text : undefined;
        const filteredHistory = history.filter(h => h.role === 'user' || h.role === 'model');

        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            history: filteredHistory,
            ...(systemInstruction && { config: { systemInstruction } }),
        });
        const responseStream = await chat.sendMessageStream({ message: newMessage });
        return responseStream;
    } catch (error) {
        console.error("Error getting chat response:", error);
        throw new Error("Failed to get response from AI assistant.");
    }
};

export const getPortfolioCheckinSummary = async (portfolio: PortfolioItem[]): Promise<string> => {
    const prompt = `
        Given the following portfolio, provide a very brief, one-sentence insight.
        This is for a "quick check-in", so keep it light and encouraging.
        For example: "Great diversification across tech and finance!" or "Your Apple holding is performing well today."

        Portfolio:
        ${portfolio.map(p => `- ${p.name} (${p.ticker})`).join('\n')}
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim();
    // FIX: Added a missing opening curly brace to the catch block to fix a syntax error.
    } catch (error) {
        console.error("Error getting portfolio check-in summary:", error);
        return "Could not fetch a quick summary at this time.";
    }
};
