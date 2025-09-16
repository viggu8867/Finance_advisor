import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import type { Toast, ToastContextType } from '../types';

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const newToast = { id: Date.now(), message, type };
    setToasts(prevToasts => [...prevToasts, newToast]);

    setTimeout(() => {
      setToasts(prevToasts => prevToasts.filter(toast => toast.id !== newToast.id));
    }, 3000); // Auto-dismiss after 3 seconds
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
