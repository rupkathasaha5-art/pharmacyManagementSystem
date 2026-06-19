// components/common/FormBlock.jsx
import React from 'react';

export default function FormBlock({ title, onSubmit, children, buttonText, icon }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-teal-600 border-b border-slate-100 pb-2 flex items-center gap-2">
        <i className={`fa-solid ${icon} text-amber-500`}></i>
        {title}
      </h3>
      <form onSubmit={onSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {children}
        </div>
        <div className="pt-2 border-t border-slate-50 flex justify-end">
          <button
            type="submit"
            className="bg-teal-500 hover:bg-teal-600 active:scale-[0.98] text-white font-bold py-2.5 px-5 rounded shadow-sm text-sm transition-all flex items-center gap-2"
          >
            {buttonText}
          </button>
        </div>
      </form>
    </div>
  );
}