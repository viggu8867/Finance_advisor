import React from 'react';

const TransportIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.354c-1.282 0-2.565-.4-3.61-1.203a6.986 6.986 0 01-3.61-4.802C4.015 9.172 6.031 6 9 6c2.969 0 4.985 3.172 4.22 6.349a6.986 6.986 0 01-3.61 4.802c-1.045.803-2.328 1.203-3.61 1.203zM12 21a9 9 0 100-18 9 9 0 000 18z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
    </svg>
);

export default TransportIcon;