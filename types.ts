
export type View = 'dashboard' | 'portfolio' | 'goals' | 'news' | 'chat' | 'expenses';

export interface PortfolioItem {
  id: string;
  ticker: string;
  name: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
}

export interface FinancialGoal {
  id:string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  isLoan?: boolean; // To identify loan-type goals for AI
}

export interface NewsArticle {
    title: string;
    summary: string;
    source: string;
}

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

export interface User {
  email: string;
  hashedPassword?: string; // Only for storage simulation
}

export interface Expense {
    id: string;
    description: string;
    amount: number;
    category: string;
    date: string; // YYYY-MM-DD
}

export interface TransactionResult {
    success: boolean;
    message?: string;
}

export interface AppContextType {
    portfolio: PortfolioItem[];
    goals: FinancialGoal[];
    expenses: Expense[];
    monthlyIncome: number;
    addStock: (stock: Omit<PortfolioItem, 'id' | 'currentPrice'>) => TransactionResult;
    updateStock: (id: string, updates: Partial<Omit<PortfolioItem, 'id' | 'currentPrice'>>) => TransactionResult;
    deleteStock: (id: string) => void;
    addGoal: (goal: Omit<FinancialGoal, 'id' | 'currentAmount'>) => void;
    addExpense: (expense: Omit<Expense, 'id'>) => TransactionResult;
    updateExpense: (id: string, updates: Partial<Omit<Expense, 'id'>>) => TransactionResult;
    deleteExpense: (id: string) => void;
    addGoalPayment: (goalId: string, amount: number, date: string) => TransactionResult;
    updateIncome: (income: number) => void;
    isLoading: boolean;
}

// New types for Toast context
export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}
