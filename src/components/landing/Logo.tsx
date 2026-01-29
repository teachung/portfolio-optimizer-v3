import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 80 L40 60 L60 70 L80 30" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400" />
    <path d="M40 60 L30 40 L50 20 L60 70" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400" />
    <circle cx="20" cy="80" r="6" fill="#0F172A" stroke="currentColor" strokeWidth="3" className="text-emerald-400" />
    <circle cx="40" cy="60" r="6" fill="#0F172A" stroke="currentColor" strokeWidth="3" className="text-sky-400" />
    <circle cx="60" cy="70" r="6" fill="#0F172A" stroke="currentColor" strokeWidth="3" className="text-emerald-400" />
    <circle cx="80" cy="30" r="6" fill="#0F172A" stroke="currentColor" strokeWidth="3" className="text-emerald-400" />
    <circle cx="30" cy="40" r="6" fill="#0F172A" stroke="currentColor" strokeWidth="3" className="text-sky-400" />
    <circle cx="50" cy="20" r="6" fill="#0F172A" stroke="currentColor" strokeWidth="3" className="text-sky-400" />
  </svg>
);