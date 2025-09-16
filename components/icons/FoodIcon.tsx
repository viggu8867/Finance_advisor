import React from 'react';

const FoodIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 17h.01M5 12h.01M5 7h.01" />
    </svg>
);

export default FoodIcon;