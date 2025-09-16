import React, { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import type { Toast as ToastType } from '../../types';

const ToastItem: React.FC<{ toast: ToastType }> = ({ toast }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Animate in
        const fadeInTimer = setTimeout(() => setVisible(true), 10);
        
        // Animate out before provider removes it from state
        const fadeOutTimer = setTimeout(() => setVisible(false), 2700); 

        return () => {
            clearTimeout(fadeInTimer);
            clearTimeout(fadeOutTimer);
        };
    }, []);

    const typeClasses = {
        success: 'bg-green-100 border-green-500 text-green-700',
        error: 'bg-red-100 border-red-500 text-red-700',
        info: 'bg-blue-100 border-blue-500 text-blue-700',
    };

    return (
        <div
            className={`
                w-full max-w-sm p-4 rounded-lg shadow-lg border-l-4 transition-all duration-300 ease-in-out transform
                ${typeClasses[toast.type]}
                ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}
            `}
            role="alert"
        >
            <p className="font-bold">{toast.message}</p>
        </div>
    );
};

const Toast: React.FC = () => {
    const { toasts } = useToast();
    
    return (
        <div className="fixed top-4 right-4 z-[100] w-full max-w-sm space-y-2">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} />
            ))}
        </div>
    );
};

export default Toast;
