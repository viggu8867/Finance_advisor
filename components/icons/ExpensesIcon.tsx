import React from 'react';

const ExpensesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 8h6m-5 4h.01M18 12h.01M18 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default ExpensesIcon;
