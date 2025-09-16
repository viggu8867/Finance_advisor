import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import type { FinancialGoal } from '../types';
import Card from './common/Card';
import Button from './common/Button';
import Spinner from './common/Spinner';
import { getGoalAdvice } from '../services/geminiService';
import { useToast } from '../context/ToastContext';

const GoalCard: React.FC<{ goal: FinancialGoal }> = ({ goal }) => {
    const [advice, setAdvice] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const isCompleted = goal.currentAmount >= goal.targetAmount;
    const progress = isCompleted ? 100 : (goal.currentAmount / goal.targetAmount) * 100;

    const handleGetAdvice = async () => {
        setIsLoading(true);
        setAdvice('');
        try {
            const result = await getGoalAdvice(goal);
            setAdvice(result);
        } catch(error) {
            setAdvice('Failed to get advice. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className={`relative overflow-hidden ${isCompleted ? 'bg-green-50' : ''}`}>
             {isCompleted && (
                <div className="absolute top-2 right-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    Fulfilled!
                </div>
            )}
            <h3 className="text-xl font-bold">{goal.name}</h3>
            {goal.isLoan && <p className="text-sm text-red-600 font-semibold">Loan Repayment</p>}
            
            <div className="my-4">
                <div className="flex justify-between mb-1">
                    <span className={`text-base font-medium ${isCompleted ? 'text-green-700' : 'text-primary'}`}>₹{goal.currentAmount.toLocaleString('en-IN')}</span>
                    <span className="text-sm font-medium text-gray-700">₹{goal.targetAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className={`${isCompleted ? 'bg-green-600' : 'bg-accent'} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            <Button onClick={handleGetAdvice} isLoading={isLoading} disabled={isCompleted}>
                {isCompleted ? 'Goal Achieved' : (isLoading ? 'Getting Advice...' : 'Get AI Advice')}
            </Button>
            
            {isLoading && !advice && <Spinner />}

            {advice && (
                 <div className="mt-4 p-4 bg-neutral rounded-lg">
                     <h4 className="font-semibold mb-2">AI-Powered Plan:</h4>
                     <div className="prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: advice.replace(/\n/g, '<br />') }} />
                 </div>
            )}
        </Card>
    );
};

const AddGoalForm: React.FC<{ onCancel: () => void }> = ({ onCancel }) => {
    const { addGoal } = useAppContext();
    const { showToast } = useToast();
    const [name, setName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [isLoan, setIsLoan] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !targetAmount || parseFloat(targetAmount) <= 0) {
            showToast("Please enter a valid name and target amount.", "error");
            return;
        }
        addGoal({ name, targetAmount: parseFloat(targetAmount), isLoan });
        showToast('New goal added successfully!');
        onCancel(); // Close form after submission
    };

    return (
        <Card>
            <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-xl font-bold">Add New Goal</h3>
                <div>
                    <label htmlFor="goal-name" className="block text-sm font-medium text-base-content">Goal Name</label>
                    <input
                        type="text"
                        id="goal-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-base-content bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent"
                        placeholder="e.g., Emergency Fund"
                        required
                    />
                </div>
                 <div>
                    <label htmlFor="goal-target" className="block text-sm font-medium text-base-content">Target Amount (₹)</label>
                    <input
                        type="number"
                        id="goal-target"
                        value={targetAmount}
                        onChange={(e) => setTargetAmount(e.target.value)}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-base-content bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent"
                        placeholder="e.g., 50000"
                        required
                    />
                </div>
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="is-loan"
                        checked={isLoan}
                        onChange={(e) => setIsLoan(e.target.checked)}
                        className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <label htmlFor="is-loan" className="ml-2 block text-sm text-base-content">Is this a loan repayment?</label>
                </div>
                <div className="flex items-center gap-4">
                    <Button type="submit">Save Goal</Button>
                    <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                </div>
            </form>
        </Card>
    );
}


const Goals: React.FC = () => {
    const { goals } = useAppContext();
    const [isAddingGoal, setIsAddingGoal] = useState(false);

    return (
        <div className="space-y-8">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-base-content">Financial Goals</h2>
                    <p className="text-gray-500 mt-1">Set, track, and get advice on your financial objectives.</p>
                </div>
                <Button onClick={() => setIsAddingGoal(true)} disabled={isAddingGoal}>+ Add Goal</Button>
            </header>

            {isAddingGoal && <AddGoalForm onCancel={() => setIsAddingGoal(false)} />}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {goals.map(goal => (
                    <GoalCard key={goal.id} goal={goal} />
                ))}
            </div>
        </div>
    );
};

export default Goals;