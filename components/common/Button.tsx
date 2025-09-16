import React, { ReactNode } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', isLoading = false, className, ...props }) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center';
  const variantClasses = variant === 'primary' 
    ? 'bg-primary text-white hover:bg-secondary focus:ring-accent'
    : 'bg-neutral text-base-content hover:bg-gray-200 focus:ring-gray-400';
  const disabledClasses = 'disabled:opacity-50 disabled:cursor-not-allowed';

  const finalClassName = `${baseClasses} ${variantClasses} ${disabledClasses} ${className || ''}`;

  return (
    <button className={finalClassName} disabled={isLoading} {...props}>
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      <span>{children}</span>
    </button>
  );
};

export default Button;