
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import type { PortfolioItem, FinancialGoal, Expense, AppContextType, TransactionResult } from '../types';
import { useAuth } from './AuthContext';

interface UserData {
    portfolio: PortfolioItem[];
    goals: FinancialGoal[];
    expenses: Expense[];
    monthlyIncome: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultUserData: UserData = {
    portfolio: [
        { id: '1', ticker: 'AAPL', name: 'Apple Inc.', shares: 50, avgPrice: 150, currentPrice: 175.28 },
        { id: '2', ticker: 'MSFT', name: 'Microsoft Corp.', shares: 30, avgPrice: 300, currentPrice: 334.75 },
    ],
    goals: [
        { id: '1', name: 'Buy a new car', targetAmount: 350000, currentAmount: 120000 },
        { id: '2', name: 'Home Loan Repayment', targetAmount: 1000000, currentAmount: 450000, isLoan: true },
    ],
    expenses: [],
    monthlyIncome: 75000,
};

const getUserData = (email: string): UserData => {
    try {
        const data = localStorage.getItem(`userData_${email}`);
        if (data) {
            return JSON.parse(data);
        } else {
            // Setup default data for new user
            saveUserData(email, defaultUserData);
            return defaultUserData;
        }
    } catch (error) {
        console.error("Failed to parse user data from localStorage", error);
        return defaultUserData;
    }
};

const saveUserData = (email: string, data: UserData) => {
    localStorage.setItem(`userData_${email}`, JSON.stringify(data));
};


export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (currentUser?.email) {
            setIsLoading(true);
            const data = getUserData(currentUser.email);
            setUserData(data);
            setIsLoading(false);
        } else {
            setUserData(null);
        }
    }, [currentUser]);

    const updateAndSave = (updates: Partial<UserData>) => {
        if (currentUser?.email && userData) {
            const newData = { ...userData, ...updates };
            setUserData(newData);
            saveUserData(currentUser.email, newData);
        }
    };

    const checkBudget = (newAmount: number, date: string, oldAmount = 0): TransactionResult => {
        if (!userData) return { success: false, message: "User data not found." };
        
        const currentMonth = date.slice(0, 7);
        const expensesThisMonth = userData.expenses.filter(e => e.date.startsWith(currentMonth) && e.category !== 'investment_return');
        const totalSpent = expensesThisMonth.reduce((sum, e) => sum + e.amount, 0);

        if (totalSpent - oldAmount + newAmount > userData.monthlyIncome) {
            return { success: false, message: "You don't have enough budget for this transaction." };
        }
        return { success: true };
    };


    const addStock = (stock: Omit<PortfolioItem, 'id' | 'currentPrice'>): TransactionResult => {
        if (!userData) return { success: false };
        const purchaseCost = stock.shares * stock.avgPrice;
        const transactionDate = new Date().toISOString().slice(0, 10);
        
        const budgetCheck = checkBudget(purchaseCost, transactionDate);
        if (!budgetCheck.success) {
            return budgetCheck;
        }

        const newStock: PortfolioItem = {
            ...stock,
            id: new Date().toISOString(),
            currentPrice: stock.avgPrice,
        };
        const newPortfolio = [...userData.portfolio, newStock];

        const purchaseExpense: Expense = {
            id: `exp_buy_${newStock.id}`,
            description: `Bought ${stock.shares} of ${stock.ticker}`,
            amount: purchaseCost,
            category: 'investment',
            date: transactionDate,
        };
        const newExpenses = [...userData.expenses, purchaseExpense];
        
        updateAndSave({ portfolio: newPortfolio, expenses: newExpenses });
        return { success: true };
    };

    const updateStock = (id: string, updates: Partial<Omit<PortfolioItem, 'id' | 'currentPrice'>>): TransactionResult => {
        if (!userData) return { success: false };
        const originalStock = userData.portfolio.find(s => s.id === id);
        if (!originalStock) return { success: false };

        const originalCost = originalStock.shares * originalStock.avgPrice;
        const newCost = (updates.shares || originalStock.shares) * (updates.avgPrice || originalStock.avgPrice);
        
        const originalExpense = userData.expenses.find(e => e.id === `exp_buy_${id}`);
        const expenseDate = originalExpense ? originalExpense.date : new Date().toISOString().slice(0, 10);

        const budgetCheck = checkBudget(newCost, expenseDate, originalCost);
        if (!budgetCheck.success) {
            return budgetCheck;
        }
        
        const updatedPortfolio = userData.portfolio.map(stock =>
            stock.id === id ? { ...stock, ...updates } : stock
        );
        
        const updatedExpenses = userData.expenses.map(exp => {
            if (exp.id === `exp_buy_${id}`) {
                return { ...exp, amount: newCost, description: `Bought ${updates.shares || originalStock.shares} of ${updates.ticker || originalStock.ticker}` };
            }
            return exp;
        });

        updateAndSave({ portfolio: updatedPortfolio, expenses: updatedExpenses });
        return { success: true };
    };

    const deleteStock = (id: string) => {
        if (!userData) return;
        const stockToDelete = userData.portfolio.find(s => s.id === id);
        if (!stockToDelete) return;

        const filteredPortfolio = userData.portfolio.filter(stock => stock.id !== id);

        const saleIncome: Expense = {
             id: `exp_sell_${stockToDelete.id}`,
             description: `Sold ${stockToDelete.shares} of ${stockToDelete.ticker}`,
             amount: stockToDelete.shares * stockToDelete.currentPrice,
             category: 'investment_return',
             date: new Date().toISOString().slice(0, 10),
        };
        const newExpenses = [...userData.expenses, saleIncome];

        updateAndSave({ portfolio: filteredPortfolio, expenses: newExpenses });
    };

    const addGoal = (goal: Omit<FinancialGoal, 'id' | 'currentAmount'>) => {
        const newGoal: FinancialGoal = {
            ...goal,
            id: new Date().toISOString(),
            currentAmount: 0,
        };
        updateAndSave({ goals: [...(userData?.goals || []), newGoal] });
    };

    const addExpense = (expense: Omit<Expense, 'id'>): TransactionResult => {
        const budgetCheck = checkBudget(expense.amount, expense.date);
        if (!budgetCheck.success) {
            return budgetCheck;
        }
        const newExpense: Expense = {
            ...expense,
            id: new Date().toISOString(),
        };
        updateAndSave({ expenses: [...(userData?.expenses || []), newExpense] });
        return { success: true };
    };

    const updateExpense = (id: string, updates: Partial<Omit<Expense, 'id'>>): TransactionResult => {
        if (!userData) return { success: false };
        const originalExpense = userData.expenses.find(e => e.id === id);
        if (!originalExpense) return { success: false };
        
        const newAmount = updates.amount || originalExpense.amount;
        const expenseDate = updates.date || originalExpense.date;

        const budgetCheck = checkBudget(newAmount, expenseDate, originalExpense.amount);
         if (!budgetCheck.success) {
            return budgetCheck;
        }

        const updatedExpenses = (userData.expenses || []).map(expense =>
            expense.id === id ? { ...expense, ...updates } : expense
        );
        updateAndSave({ expenses: updatedExpenses });
        return { success: true };
    };

    const deleteExpense = (id: string) => {
        const filteredExpenses = (userData?.expenses || []).filter(expense => expense.id !== id);
        updateAndSave({ expenses: filteredExpenses });
    };

    const addGoalPayment = (goalId: string, amount: number, date: string): TransactionResult => {
        if (!userData) return { success: false };
        
        const budgetCheck = checkBudget(amount, date);
        if (!budgetCheck.success) {
            return budgetCheck;
        }

        let targetGoal: FinancialGoal | undefined;
        const updatedGoals = userData.goals.map(goal => {
            if (goal.id === goalId) {
                targetGoal = goal;
                const newCurrentAmount = Math.min(goal.targetAmount, goal.currentAmount + amount);
                return { ...goal, currentAmount: newCurrentAmount };
            }
            return goal;
        });

        if (targetGoal) {
            const newExpense: Expense = {
                id: `goal_pmt_${new Date().toISOString()}`,
                description: `Payment for goal: ${targetGoal.name}`,
                amount: amount,
                category: 'goals',
                date: date,
            };
            updateAndSave({
                goals: updatedGoals,
                expenses: [...userData.expenses, newExpense]
            });
            return { success: true };
        }
        return { success: false, message: "Goal not found." };
    };

    const updateIncome = (income: number) => {
        updateAndSave({ monthlyIncome: income });
    };

    if (isLoading || !userData) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }
    
    return (
        <AppContext.Provider value={{
            portfolio: userData.portfolio,
            goals: userData.goals,
            expenses: userData.expenses,
            monthlyIncome: userData.monthlyIncome,
            addStock,
            updateStock,
            deleteStock,
            addGoal,
            addExpense,
            updateExpense,
            deleteExpense,
            addGoalPayment,
            updateIncome,
            isLoading: false,
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = (): AppContextType => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
