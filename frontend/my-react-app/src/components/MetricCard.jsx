// components/common/MetricCard.jsx
import React from 'react';

export default function MetricCard({ title, value, subtext, icon, isAlert }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden transition-all hover:shadow-md">
      <div className={`absolute top-0 left-0 h-1 w-full ${isAlert ? 'bg-amber-500' : 'bg-teal-500'}`}></div>
      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</span>
          <div className={`text-3xl font-bold mt-2 tracking-tight ${isAlert ? 'text-amber-600' : 'text-slate-900'}`}>
            {value}
          </div>
        </div>
        <div className={`p-2.5 rounded-lg ${isAlert ? 'bg-amber-50 text-amber-600' : 'bg-teal-50 text-teal-600'}`}>
          <i className={`fa-solid ${icon} text-lg`}></i>
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-2 font-medium">{subtext}</p>
    </div>
  );
}