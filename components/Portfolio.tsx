import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import type { PortfolioItem, TransactionResult } from '../types';
import Card from './common/Card';
import Button from './common/Button';
import Spinner from './common/Spinner';
import { analyzePortfolio, getPortfolioCheckinSummary } from '../services/geminiService';
import EditIcon from './icons/EditIcon';
import DeleteIcon from './icons/DeleteIcon';
import { stockList } from '../utils/stockData';
import { useToast } from '../context/ToastContext';


const StockFormModal: React.FC<{
    stock: PortfolioItem | null;
    onClose: () => void;
    onSave: (stock: Omit<PortfolioItem, 'id' | 'currentPrice'>) => TransactionResult;
}> = ({ stock, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: stock?.name || '',
        ticker: stock?.ticker || '',
        shares: stock?.shares?.toString() || '',
        avgPrice: stock?.avgPrice?.toString() || '',
    });
    const [error, setError] = useState('');

    const totalCost = useMemo(() => {
        const shares = parseFloat(formData.shares);
        const price = parseFloat(formData.avgPrice);
        if (!isNaN(shares) && !isNaN(price) && shares > 0) {
            return (shares * price);
        }
        return 0;
    }, [formData.shares, formData.avgPrice]);


    const handleStockSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedTicker = e.target.value;
        const selectedStock = stockList.find(s => s.ticker === selectedTicker);
        
        if (selectedStock) {
            setFormData(prev => ({
                ...prev,
                name: selectedStock.name,
                ticker: selectedStock.ticker,
                avgPrice: selectedStock.price.toString(),
            }));
        } else {
            // Reset if the placeholder is selected
            setFormData(prev => ({
                ...prev,
                name: '',
                ticker: '',
                avgPrice: '',
            }));
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); // Reset error on new submission

        const sharesNumber = parseFloat(formData.shares);
        if (isNaN(sharesNumber) || sharesNumber <= 0) {
            setError('Number of shares must be a positive number.');
            return;
        }

        if (!formData.ticker) {
            setError("Please select a valid stock from the list.");
            return;
        }

        const result = onSave({
            name: formData.name,
            ticker: formData.ticker.toUpperCase(),
            shares: sharesNumber,
            avgPrice: parseFloat(formData.avgPrice),
        });

        if (result.success) {
             onClose();
        } else if (result.message) {
            setError(result.message);
        }
    };

    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <Card className="w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">{stock ? 'Edit Stock' : 'Add Stock'}</h3>
                    <button onClick={onClose} className="text-2xl font-bold">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg text-center text-sm">{error}</p>}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-base-content">Stock Name</label>
                        <select
                            id="name"
                            value={formData.ticker}
                            onChange={handleStockSelect}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-base-content bg-white focus:outline-none focus:ring-2 focus:ring-accent disabled:bg-gray-100"
                            required
                            disabled={!!stock} // Disable editing name/ticker for existing stocks
                        >
                            <option value="">-- Select a Stock --</option>
                            {stockList.map(s => (
                                <option key={s.ticker} value={s.ticker}>
                                    {s.name} ({s.ticker})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="ticker" className="block text-sm font-medium text-base-content">Ticker Symbol</label>
                        <input type="text" name="ticker" id="ticker" value={formData.ticker} readOnly className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-base-content bg-gray-100 focus:outline-none" />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="shares" className="block text-sm font-medium text-base-content">Shares</label>
                            <input type="number" name="shares" id="shares" value={formData.shares} onChange={handleChange} step="any" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-base-content bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent" placeholder="e.g., 50" required />
                        </div>
                        <div>
                           <label htmlFor="avgPrice" className="block text-sm font-medium text-base-content">Purchase Price (₹)</label>
                            <input type="text" name="avgPrice" id="avgPrice" value={formData.avgPrice} readOnly className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-base-content bg-gray-100 placeholder-gray-500 focus:outline-none" />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="totalCost" className="block text-sm font-medium text-base-content">Total Cost (₹)</label>
                        <input 
                            type="text" 
                            name="totalCost" 
                            id="totalCost" 
                            value={totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            readOnly 
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-base-content bg-gray-100 focus:outline-none" 
                        />
                    </div>
                    <div className="flex items-center gap-4 pt-2">
                        <Button type="submit" className="w-full">{stock ? 'Update Stock' : 'Add Stock'}</Button>
                        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};


const Portfolio: React.FC = () => {
    const { portfolio: initialPortfolio, addStock, updateStock, deleteStock } = useAppContext();
    const [portfolio, setPortfolio] = useState(initialPortfolio);
    const [analysis, setAnalysis] = useState('');
    const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStock, setEditingStock] = useState<PortfolioItem | null>(null);
    const [checkinSummary, setCheckinSummary] = useState('');
    const [isCheckingIn, setIsCheckingIn] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        const interval = setInterval(() => {
            setPortfolio(prevPortfolio =>
                prevPortfolio.map(stock => {
                    const change = (Math.random() - 0.5) * 0.01; // +/- 0.5%
                    const newPrice = stock.currentPrice * (1 + change);
                    return { ...stock, currentPrice: newPrice };
                })
            );
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleAnalyze = async () => {
        setIsLoadingAnalysis(true);
        setAnalysis('');
        try {
            const result = await analyzePortfolio(portfolio);
            setAnalysis(result);
        } catch (error) {
            setAnalysis('An error occurred during analysis.');
        } finally {
            setIsLoadingAnalysis(false);
        }
    };
    
    const handleCheckin = async () => {
        setIsCheckingIn(true);
        setCheckinSummary('');
        try {
            const result = await getPortfolioCheckinSummary(portfolio);
            setCheckinSummary(result);
        } catch (error) {
            setCheckinSummary('Could not get summary.');
        } finally {
            setIsCheckingIn(false);
        }
    };

    const handleOpenAddModal = () => {
        setEditingStock(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (stock: PortfolioItem) => {
        setEditingStock(stock);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingStock(null);
    };

    const handleSaveStock = (stockData: Omit<PortfolioItem, 'id' | 'currentPrice'>): TransactionResult => {
        let result: TransactionResult;
        if (editingStock) {
            result = updateStock(editingStock.id, stockData);
            if(result.success) {
                showToast('Stock updated successfully!');
            }
        } else {
            result = addStock(stockData);
             if(result.success) {
                showToast('Stock added to portfolio!');
            }
        }

        if (!result.success && result.message) {
            showToast(result.message, 'error');
        }

        if (result.success) {
            handleCloseModal();
        }
        return result;
    };
    
    useEffect(() => {
        setPortfolio(initialPortfolio);
    }, [initialPortfolio]);

    const handleDeleteStock = (id: string) => {
        const stockToSell = portfolio.find(s => s.id === id);
        if (!stockToSell) return;

        const saleValue = stockToSell.shares * stockToSell.currentPrice;
        const confirmationMessage = `Are you sure you want to sell ${stockToSell.shares} shares of ${stockToSell.ticker} for ₹${saleValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}? This action will be recorded as income.`;

        if (window.confirm(confirmationMessage)) {
            deleteStock(id);
            showToast(`Sold ${stockToSell.ticker} for ₹${saleValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`, 'info');
        }
    };

    const totalPortfolioValue = useMemo(() => portfolio.reduce((sum, stock) => sum + stock.shares * stock.currentPrice, 0), [portfolio]);
    const totalCostBasis = useMemo(() => portfolio.reduce((sum, stock) => sum + stock.shares * stock.avgPrice, 0), [portfolio]);
    const totalGainLoss = totalPortfolioValue - totalCostBasis;

    const renderGainLoss = (value: number) => (
        <span className={value >= 0 ? 'text-green-600' : 'text-red-600'}>
            {value >= 0 ? '+' : ''}₹{value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
    );

    return (
        <div className="space-y-8">
            {isModalOpen && <StockFormModal stock={editingStock} onClose={handleCloseModal} onSave={handleSaveStock} />}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-base-content">My Portfolio</h2>
                    <p className="text-gray-500 mt-1">Manage, review, and analyze your current holdings.</p>
                </div>
                 <div className="flex items-center gap-2">
                    <Button onClick={handleOpenAddModal}>+ Add Stock</Button>
                    <Button onClick={handleCheckin} isLoading={isCheckingIn} variant="secondary">Quick Check-in</Button>
                </div>
            </header>

            {checkinSummary && (
                <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-lg flex justify-between items-center" role="alert">
                    <div>
                      <p className="font-bold">AI Quick Insight</p>
                      <p>{checkinSummary}</p>
                    </div>
                    <button onClick={() => setCheckinSummary('')} className="text-2xl font-bold">&times;</button>
                </div>
            )}
            
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <h3 className="text-lg font-semibold text-gray-500">Total Value</h3>
                    <p className="text-4xl font-bold text-primary mt-2">₹{totalPortfolioValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </Card>
                <Card>
                    <h3 className="text-lg font-semibold text-gray-500">Total Gain/Loss</h3>
                    <p className={`text-4xl font-bold mt-2 ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>{renderGainLoss(totalGainLoss)}</p>
                </Card>
                 <Card className="flex flex-col justify-center items-center">
                    <Button onClick={handleAnalyze} isLoading={isLoadingAnalysis} className="w-full h-full text-lg">
                        {isLoadingAnalysis ? 'Analyzing...' : 'Run Full AI Analysis'}
                    </Button>
                </Card>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Shares</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Avg. Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Gain/Loss</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {portfolio.map(item => {
                                const totalValue = item.shares * item.currentPrice;
                                const costBasis = item.shares * item.avgPrice;
                                const gainLoss = totalValue - costBasis;
                                return (
                                <tr key={item.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                        <div className="text-sm text-gray-500">{item.ticker}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                        ₹{totalValue.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                                        <div className="text-xs font-normal text-gray-500">
                                            ₹{item.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}/share
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">{item.shares}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">₹{item.avgPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">{renderGainLoss(gainLoss)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center gap-4">
                                            <button onClick={() => handleOpenEditModal(item)} title="Edit" className="text-gray-500 hover:text-primary"><EditIcon className="w-5 h-5" /></button>
                                            <button onClick={() => handleDeleteStock(item.id)} title="Delete" className="text-gray-500 hover:text-red-500"><DeleteIcon className="w-5 h-5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </Card>

            {isLoadingAnalysis && <Spinner />}

            {analysis && (
                <Card>
                    <h3 className="text-xl font-bold mb-4">AI Analysis</h3>
                    <div className="prose max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br />') }} />
                </Card>
            )}
        </div>
    );
};

export default Portfolio;