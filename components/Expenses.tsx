
import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { getExpenseAdvice } from '../services/geminiService';
import type { Expense, TransactionResult } from '../types';
import Card from './common/Card';
import Button from './common/Button';
import Spinner from './common/Spinner';
import FoodIcon from './icons/FoodIcon';
import TransportIcon from './icons/TransportIcon';
import HousingIcon from './icons/HousingIcon';
import BillsIcon from './icons/BillsIcon';
import EntertainmentIcon from './icons/EntertainmentIcon';
import OtherIcon from './icons/OtherIcon';
import EditIcon from './icons/EditIcon';
import DeleteIcon from './icons/DeleteIcon';
import GoalsIcon from './icons/GoalsIcon';
import InvestmentIcon from './icons/InvestmentIcon';
import InvestmentReturnIcon from './icons/InvestmentReturnIcon';
import { useToast } from '../context/ToastContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const categoryIcons: { [key: string]: React.FC<{className?: string}> } = {
    food: FoodIcon,
    transport: TransportIcon,
    housing: HousingIcon,
    bills: BillsIcon,
    entertainment: EntertainmentIcon,
    goals: GoalsIcon,
    investment: InvestmentIcon,
    investment_return: InvestmentReturnIcon,
    other: OtherIcon,
};

const PayGoalModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { goals, addGoalPayment } = useAppContext();
    const { showToast } = useToast();
    const [goalId, setGoalId] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    
    // Filter out completed goals
    const activeGoals = goals.filter(g => g.currentAmount < g.targetAmount);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!goalId || !amount || parseFloat(amount) <= 0) {
            showToast("Please select a goal and enter a valid amount.", "error");
            return;
        }
        
        const result = addGoalPayment(goalId, parseFloat(amount), date);

        if (result.success) {
            showToast('Goal payment saved successfully!');
            onClose();
        } else if (result.message) {
            showToast(result.message, "error");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <Card className="w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Pay Towards a Goal</h3>
                    <button onClick={onClose} className="text-2xl font-bold">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label htmlFor="goal" className="block text-sm font-medium text-base-content">Select Goal</label>
                        <select id="goal" value={goalId} onChange={e => setGoalId(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-base-content bg-white focus:outline-none focus:ring-2 focus:ring-accent" required>
                            <option value="" disabled>-- Select a goal --</option>
                            {activeGoals.map(goal => (
                                <option key={goal.id} value={goal.id}>{goal.name}</option>
                            ))}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="payment-amount" className="block text-sm font-medium text-base-content">Amount (₹)</label>
                        <input type="number" id="payment-amount" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-base-content bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent" placeholder="e.g., 5000" required />
                    </div>
                     <div>
                        <label htmlFor="payment-date" className="block text-sm font-medium text-base-content">Date</label>
                        <input type="date" id="payment-date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-base-content bg-white focus:outline-none focus:ring-2 focus:ring-accent" required />
                    </div>
                    <div className="flex items-center gap-4">
                        <Button type="submit" className="w-full md:w-auto">Save Payment</Button>
                        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

const IncomeCard: React.FC = () => {
    const { monthlyIncome, updateIncome } = useAppContext();
    const { showToast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [newIncome, setNewIncome] = useState(String(monthlyIncome));

    useEffect(() => {
        setNewIncome(String(monthlyIncome));
    }, [monthlyIncome])

    const handleSave = () => {
        const incomeValue = parseFloat(newIncome);
        if (!isNaN(incomeValue) && incomeValue >= 0) {
            updateIncome(incomeValue);
            showToast('Monthly income updated!');
            setIsEditing(false);
        } else {
            showToast('Please enter a valid income.', 'error');
        }
    };

    return (
        <Card>
            <h3 className="text-lg font-semibold text-base-content mb-2">Monthly Income</h3>
            {isEditing ? (
                <div className="flex items-center gap-2">
                <span className="text-xl font-bold">₹</span>
                <input
                    type="number"
                    value={newIncome}
                    onChange={(e) => setNewIncome(e.target.value)}
                    className="w-full text-2xl font-bold p-1 rounded-md border border-gray-300 bg-white"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                />
                <Button onClick={handleSave} className="py-1 px-2 text-sm">Save</Button>
                <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-red-500 p-1 rounded-full">&times;</button>
                </div>
            ) : (
                <div className="flex items-center justify-between">
                    <p className="text-4xl font-bold text-primary">₹{monthlyIncome.toLocaleString('en-IN')}</p>
                    <button onClick={() => setIsEditing(true)} title="Edit Income" className="text-gray-400 hover:text-primary"><EditIcon className="w-5 h-5" /></button>
                </div>
            )}
        </Card>
    );
};


const Expenses: React.FC = () => {
    const { expenses, monthlyIncome, addExpense, updateExpense, deleteExpense, goals } = useAppContext();
    const { showToast } = useToast();
    const [viewMonth, setViewMonth] = useState(new Date().toISOString().slice(0, 7));
    
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [isPayGoalVisible, setIsPayGoalVisible] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('other');
    const [customCategory, setCustomCategory] = useState('');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

    const [advice, setAdvice] = useState('');
    const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
    
    const manualCategories = ["food", "transport", "housing", "bills", "entertainment", "other"];

    useEffect(() => {
        if (editingExpense) {
            setDescription(editingExpense.description);
            setAmount(String(editingExpense.amount));
            setDate(editingExpense.date);
            const isPredefined = manualCategories.includes(editingExpense.category);
            if (isPredefined) {
                setCategory(editingExpense.category);
                setCustomCategory('');
            } else {
                setCategory('other');
                setCustomCategory(editingExpense.category);
            }
            setIsFormVisible(true);
        } else {
            resetForm();
        }
    }, [editingExpense]);

    const resetForm = () => {
        setDescription('');
        setAmount('');
        setCategory('other');
        setCustomCategory('');
        setDate(new Date().toISOString().slice(0, 10));
        setEditingExpense(null);
    };
    
    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCategory = e.target.value;
        setCategory(newCategory);
        if (newCategory !== 'other') {
            setCustomCategory('');
        }
    };


    const filteredExpenses = useMemo(() => {
        return expenses.filter(e => e.date.startsWith(viewMonth)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [expenses, viewMonth]);
    
    const { totalExpenditure, totalReturns, categorySpending } = useMemo(() => {
        const spending = new Map<string, number>();
        const result = filteredExpenses.reduce((acc, e) => {
            if (e.category === 'investment_return') {
                acc.totalReturns += e.amount;
            } else {
                acc.totalExpenditure += e.amount;
                spending.set(e.category, (spending.get(e.category) || 0) + e.amount);
            }
            return acc;
        }, { totalExpenditure: 0, totalReturns: 0 });

        return { ...result, categorySpending: Array.from(spending.entries()).map(([name, value]) => ({ name, value }))};
    }, [filteredExpenses]);

    const remainingBalance = monthlyIncome + totalReturns - totalExpenditure;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (category === 'other' && !customCategory.trim()) {
            showToast("Please enter a name for your custom category.", "error");
            return;
        }
        if (!description || !amount || !category || !date) return;
        
        const finalCategory = category === 'other' ? customCategory.trim().toLowerCase() : category;
        const expenseData = { description, amount: parseFloat(amount), category: finalCategory, date };
        let result: TransactionResult;

        if (editingExpense) {
            result = updateExpense(editingExpense.id, expenseData);
            if (result.success) {
                showToast('Expense updated successfully!');
            }
        } else {
            result = addExpense(expenseData);
            if (result.success) {
                showToast('Expense added successfully!');
            }
        }
        
        if (result.success) {
            resetForm();
            setIsFormVisible(false);
        } else if (result.message) {
            showToast(result.message, "error");
        }
    };

    const handleEdit = (expense: Expense) => {
        if (['goals', 'investment', 'investment_return'].includes(expense.category)) {
            showToast("Automated transactions cannot be edited.", "info");
            return;
        }
        setEditingExpense(expense);
    };
    
    const handleDelete = (id: string, category: string) => {
         if (['investment', 'investment_return'].includes(category)) {
            showToast("Investment transactions must be managed from your Portfolio.", "info");
            return;
        }
        if(window.confirm('Are you sure you want to delete this expense?')) {
            deleteExpense(id);
            showToast('Expense deleted.', 'info');
        }
    }
    
    const handleCancelEdit = () => {
        resetForm();
        setIsFormVisible(false);
    }

    const handleGetAdvice = async () => {
        setIsLoadingAdvice(true);
        setAdvice('');
        try {
            const result = await getExpenseAdvice(filteredExpenses, goals, monthlyIncome);
            setAdvice(result);
        } catch (error) {
            setAdvice('An error occurred while generating advice.');
        } finally {
            setIsLoadingAdvice(false);
        }
    };

    const availableMonths = useMemo(() => {
      const expenseMonths = new Set(expenses.map(e => e.date.slice(0, 7)));
      const monthRange = new Set<string>();
      const currentDate = new Date();
      for (let i = -12; i < 12; i++) {
        const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
        monthRange.add(monthDate.toISOString().slice(0, 7));
      }
      const allMonths = new Set([...expenseMonths, ...monthRange]);
      return Array.from(allMonths).sort().reverse();
    }, [expenses]);

    const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#A4DE6C', '#D0ED57'];


    return (
        <div className="space-y-8">
            {isPayGoalVisible && <PayGoalModal onClose={() => setIsPayGoalVisible(false)} />}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-base-content">Expense Tracker</h2>
                    <p className="text-base-content mt-1">Monitor and get insights on your monthly spending.</p>
                </div>
                <div className="flex items-center gap-2">
                   <select 
                       value={viewMonth} 
                       onChange={e => setViewMonth(e.target.value)} 
                       className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary bg-white text-base-content"
                   >
                       {availableMonths.map(month => (
                           <option key={month} value={month}>{new Date(month + '-02').toLocaleString('default', { month: 'long', year: 'numeric' })}</option>
                       ))}
                   </select>
                   <Button onClick={() => setIsPayGoalVisible(true)}>+ Pay Goal</Button>
                    <Button onClick={() => { setEditingExpense(null); setIsFormVisible(!isFormVisible); }} variant="secondary">{isFormVisible ? 'Cancel' : '+ Add Expense'}</Button>
                </div>
            </header>

            {isFormVisible && (
                <Card>
                    <h3 className="text-xl font-bold mb-4">{editingExpense ? 'Edit Expense' : 'Add New Expense'}</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label htmlFor="description" className="block text-sm font-medium text-base-content">Description</label>
                                <input type="text" id="description" value={description} onChange={e => setDescription(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-base-content bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent" placeholder="e.g., Groceries" required />
                            </div>
                            <div>
                                <label htmlFor="amount" className="block text-sm font-medium text-base-content">Amount (₹)</label>
                                <input type="number" id="amount" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-base-content bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent" placeholder="e.g., 1500" required />
                            </div>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="category" className="block text-sm font-medium text-base-content">Category</label>
                                <select id="category" value={category} onChange={handleCategoryChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-base-content bg-white focus:outline-none focus:ring-2 focus:ring-accent" required>
                                    {manualCategories.map(cat => (
                                        <option key={cat} value={cat} className="capitalize">{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="date" className="block text-sm font-medium text-base-content">Date</label>
                                <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-base-content bg-white focus:outline-none focus:ring-2 focus:ring-accent" required />
                            </div>
                        </div>

                        {category === 'other' && (
                            <div>
                                <label htmlFor="customCategory" className="block text-sm font-medium text-base-content">Custom Category Name</label>
                                <input
                                    type="text"
                                    id="customCategory"
                                    value={customCategory}
                                    onChange={(e) => setCustomCategory(e.target.value)}
                                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-base-content bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent"
                                    placeholder="e.g., Subscriptions"
                                    required
                                />
                            </div>
                        )}

                        <div className="flex items-center gap-4 pt-2">
                            <Button type="submit" className="w-full md:w-auto">{editingExpense ? 'Update Expense' : 'Save Expense'}</Button>
                            {editingExpense && <Button type="button" variant="secondary" onClick={handleCancelEdit}>Cancel</Button>}
                        </div>
                    </form>
                </Card>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <IncomeCard />
                <Card>
                    <h3 className="text-lg font-semibold text-base-content">Investment Returns</h3>
                    <p className="text-4xl font-bold text-green-600 mt-2">₹{totalReturns.toLocaleString('en-IN')}</p>
                </Card>
                <Card>
                    <h3 className="text-lg font-semibold text-base-content">Total Spent</h3>
                    <p className="text-4xl font-bold text-red-500 mt-2">₹{totalExpenditure.toLocaleString('en-IN')}</p>
                </Card>
                 <Card>
                    <h3 className="text-lg font-semibold text-base-content">Total Balance</h3>
                    <p className={`text-4xl font-bold mt-2 ${remainingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>₹{remainingBalance.toLocaleString('en-IN')}</p>
                </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                 <Card className="lg:col-span-3">
                    <h3 className="text-xl font-bold mb-4">Transactions for {new Date(viewMonth + '-02').toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                     <div className="overflow-auto max-h-96">
                        {filteredExpenses.length > 0 ? (
                            <ul className="space-y-2">
                                {filteredExpenses.map(item => {
                                    const Icon = categoryIcons[item.category] || OtherIcon;
                                    const isAutomated = ['goals', 'investment', 'investment_return'].includes(item.category);
                                    const amountColor = item.category === 'investment_return' ? 'text-green-600' : 'text-base-content';

                                    return (
                                        <li key={item.id} className="flex justify-between items-center p-3 rounded-lg hover:bg-neutral">
                                            <div className="flex items-center gap-4">
                                                <Icon className="w-6 h-6 text-gray-500" />
                                                <div>
                                                    <p className="font-semibold text-base-content">{item.description}</p>
                                                    <p className="text-sm text-gray-700 capitalize">{item.category.replace(/_/g, ' ')} on {new Date(item.date).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`font-bold ${amountColor}`}>
                                                    {item.category === 'investment_return' ? '+' : ''}₹{item.amount.toLocaleString('en-IN')}
                                                </span>
                                                <button onClick={() => handleEdit(item)} title="Edit" className="text-gray-500 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed" disabled={isAutomated}><EditIcon className="w-5 h-5" /></button>
                                                <button onClick={() => handleDelete(item.id, item.category)} title="Delete" className="text-gray-500 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed" disabled={['investment', 'investment_return'].includes(item.category)}><DeleteIcon className="w-5 h-5" /></button>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <p className="text-base-content text-center py-8">No transactions logged for this month.</p>
                        )}
                     </div>
                </Card>
                 <Card className="lg:col-span-2">
                    <h3 className="text-xl font-bold mb-4">Spending by Category</h3>
                     {categorySpending.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={categorySpending} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(entry) => entry.name}>
                                    {categorySpending.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number, name: string) => [`₹${value.toLocaleString('en-IN')}`, name.charAt(0).toUpperCase() + name.slice(1)]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                     ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-base-content text-center">No spending data to display.</p>
                        </div>
                     )}
                </Card>
            </div>
             <Card>
                 <h3 className="text-xl font-bold mb-4">AI Financial Plan</h3>
                 <p className="text-base-content mb-4">Get AI-powered feedback on your spending and a plan to improve your savings.</p>
                 <Button onClick={handleGetAdvice} isLoading={isLoadingAdvice}>
                     {isLoadingAdvice ? 'Analyzing...' : 'Generate My Plan'}
                 </Button>
                 {isLoadingAdvice && <Spinner />}
                 {advice && (
                     <div className="mt-4 p-4 bg-neutral rounded-lg prose prose-sm max-w-none text-base-content" dangerouslySetInnerHTML={{ __html: advice.replace(/\n/g, '<br />') }} />
                 )}
            </Card>
        </div>
    );
};

export default Expenses;
