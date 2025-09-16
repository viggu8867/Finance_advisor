import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import Card from './common/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { getFinancialTipOfTheDay } from '../services/geminiService';

const AITipCard: React.FC<{className?: string}> = ({className}) => {
    const [tip, setTip] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTip = async () => {
            setIsLoading(true);
            const result = await getFinancialTipOfTheDay();
            setTip(result);
            setIsLoading(false);
        };
        fetchTip();
    }, []);

    return (
        <Card className={className}>
            <h3 className="text-lg font-semibold text-gray-500 mb-2">💡 AI Tip of the Day</h3>
            {isLoading ? (
                <div className="flex items-center justify-center h-16">
                    <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <p className="text-base-content italic">"{tip}"</p>
            )}
        </Card>
    );
};


const Dashboard: React.FC = () => {
    const { portfolio, goals, expenses, monthlyIncome } = useAppContext();

    const portfolioTotal = portfolio.reduce((acc, item) => acc + item.shares * item.currentPrice, 0);
    const goalsTotal = goals.reduce((acc, goal) => acc + goal.targetAmount, 0);
    const goalsSaved = goals.reduce((acc, goal) => acc + goal.currentAmount, 0);
    const overallProgress = goalsTotal > 0 ? (goalsSaved / goalsTotal) * 100 : 0;

    const currentMonthStr = new Date().toISOString().slice(0, 7);
    const { totalExpenditure, totalReturns } = useMemo(() => {
        const expensesThisMonth = expenses.filter(e => e.date.startsWith(currentMonthStr));
        return expensesThisMonth.reduce((acc, e) => {
            if (e.category === 'investment_return') {
                acc.totalReturns += e.amount;
            } else {
                acc.totalExpenditure += e.amount;
            }
            return acc;
        }, { totalExpenditure: 0, totalReturns: 0 });
    }, [expenses, currentMonthStr]);

    const remainingBudget = monthlyIncome + totalReturns - totalExpenditure;
    const availableBudget = monthlyIncome + totalReturns;


    const chartData = portfolio.map(item => ({
        name: item.ticker,
        value: item.shares * item.currentPrice
    }));
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
        <div className="space-y-8">
            <header>
                <h2 className="text-3xl font-bold text-base-content">Dashboard</h2>
                <p className="text-gray-500 mt-1">Welcome back! Here's your financial snapshot.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <h3 className="text-lg font-semibold text-gray-500">Portfolio Value</h3>
                    <p className="text-4xl font-bold text-primary mt-2">₹{portfolioTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </Card>
                <Card>
                    <h3 className="text-lg font-semibold text-gray-500">Monthly Spent</h3>
                    <p className="text-4xl font-bold text-red-500 mt-2">₹{totalExpenditure.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                    <p className="text-sm text-gray-500">of ₹{availableBudget.toLocaleString('en-IN')} available</p>
                </Card>
                 <Card>
                    <h3 className="text-lg font-semibold text-gray-500">Remaining Budget</h3>
                    <p className={`text-4xl font-bold mt-2 ${remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>₹{remainingBudget.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                     <p className="text-sm text-gray-500">for {new Date().toLocaleString('default', { month: 'long' })}</p>
                </Card>
                <Card>
                    <h3 className="text-lg font-semibold text-gray-500">Goals Progress</h3>
                    <p className="text-4xl font-bold text-primary mt-2">{overallProgress.toFixed(1)}%</p>
                    <p className="text-sm text-gray-500">₹{goalsSaved.toLocaleString('en-IN')} of ₹{goalsTotal.toLocaleString('en-IN')}</p>
                </Card>
            </div>
            
            <AITipCard />

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <Card className="lg:col-span-3">
                    <h3 className="text-xl font-bold mb-4">Portfolio Allocation</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>
                 <Card className="lg:col-span-2">
                    <h3 className="text-xl font-bold mb-4">Top Holdings</h3>
                    <ul className="space-y-3">
                        {portfolio.slice(0, 5).sort((a,b) => (b.shares * b.currentPrice) - (a.shares * a.currentPrice)).map(item => (
                            <li key={item.id} className="flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">{item.ticker}</p>
                                    <p className="text-sm text-gray-500">{item.name}</p>
                                </div>
                                <span className="font-bold text-gray-700">₹{(item.shares * item.currentPrice).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;