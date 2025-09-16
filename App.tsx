
import React from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Portfolio from './components/Portfolio';
import Goals from './components/Goals';
import News from './components/News';
import Chat from './components/Chat';
import Expenses from './components/Expenses';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Auth from './components/auth/Auth';
import type { View } from './types';
import { ToastProvider } from './context/ToastContext';
import Toast from './components/common/Toast';


const AppContent: React.FC = () => {
  const { currentUser } = useAuth();
  const [currentView, setCurrentView] = React.useState<View>('dashboard');

  if (!currentUser) {
    return <Auth />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'portfolio':
        return <Portfolio />;
      case 'goals':
        return <Goals />;
      case 'news':
        return <News />;
      case 'chat':
        return <Chat />;
      case 'expenses':
        return <Expenses />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <AppProvider>
      <div className="flex h-screen bg-neutral text-base-content">
        <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-white">
          {renderView()}
        </main>
      </div>
    </AppProvider>
  );
};


const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
        <Toast />
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
