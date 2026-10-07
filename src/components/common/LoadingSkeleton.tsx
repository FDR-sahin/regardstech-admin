import React from 'react';

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 5 }) => {
  return (
    <div className="w-full animate-pulse space-y-3">
      <div className="h-10 bg-slate-800/60 rounded-lg w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 bg-slate-900/40 border border-slate-800/60 rounded-lg">
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className={`h-4 bg-slate-800/70 rounded ${
                j === 0 ? 'w-1/4' : j === 1 ? 'w-1/3' : 'w-1/6'
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-5 bg-slate-900/40 border border-slate-800/80 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-3.5 bg-slate-800 rounded w-1/2" />
            <div className="w-8 h-8 rounded-lg bg-slate-800" />
          </div>
          <div className="h-7 bg-slate-800 rounded w-1/3 mt-2" />
          <div className="h-3 bg-slate-800/60 rounded w-2/3 mt-2" />
        </div>
      ))}
    </div>
  );
};
