
import React from 'react';
import type { View } from '../types';
import DashboardIcon from './icons/DashboardIcon';
import PortfolioIcon from './icons/PortfolioIcon';
import GoalsIcon from './icons/GoalsIcon';
import NewsIcon from './icons/NewsIcon';
import ChatIcon from './icons/ChatIcon';
import ExpensesIcon from './icons/ExpensesIcon';
import LogoutIcon from './icons/LogoutIcon';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const { logout } = useAuth();
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    { id: 'portfolio', label: 'Portfolio', icon: PortfolioIcon },
    { id: 'goals', label: 'Goals', icon: GoalsIcon },
    { id: 'expenses', label: 'Expenses', icon: ExpensesIcon },
    { id: 'news', label: 'News', icon: NewsIcon },
    { id: 'chat', label: 'AI Assistant', icon: ChatIcon },
  ] as const;

  return (
    <aside className="w-16 md:w-64 bg-base-100 shadow-lg flex flex-col transition-all duration-300">
      <div className="p-4 md:p-6 border-b border-neutral flex items-center justify-center md:justify-start">
        <h1 className="text-2xl font-bold text-primary hidden md:block">FinAdvisor AI</h1>
         <span className="md:hidden text-lg font-bold text-primary">FA</span>
      </div>
      <nav className="flex-1 p-2 md:p-4">
        <ul>
          {navItems.map(item => (
            <li key={item.id}>
              <button
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center justify-center md:justify-start p-3 my-1 rounded-lg text-left transition-colors duration-200 ${
                  currentView === item.id 
                    ? 'bg-accent text-white' 
                    : 'text-gray-600 hover:bg-neutral hover:text-base-content'
                }`}
                title={item.label}
              >
                <item.icon className="w-6 h-6 md:mr-3" />
                <span className="font-medium hidden md:inline">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-2 md:p-4 border-t border-neutral">
         <button
            onClick={logout}
            className="w-full flex items-center justify-center md:justify-start p-3 my-1 rounded-lg text-left text-gray-600 hover:bg-neutral hover:text-base-content transition-colors duration-200"
            title="Logout"
          >
            <LogoutIcon className="w-6 h-6 md:mr-3" />
            <span className="font-medium hidden md:inline">Logout</span>
        </button>
        <p className="text-xs text-gray-500 text-center hidden md:block mt-4">&copy; 2024 FinAdvisor AI.</p>
      </div>
    </aside>
  );
};

export default Sidebar;
