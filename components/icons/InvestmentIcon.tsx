import React from 'react';

const InvestmentIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w.3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);

export default InvestmentIcon;
