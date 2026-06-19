// components/common/DataTable.jsx
import React from 'react';

export default function DataTable({ title, subtitle, headers, data, renderRow }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-teal-500 px-6 py-4 text-white">
        <h3 className="text-lg font-bold tracking-tight">{title}</h3>
        <p className="text-teal-50 text-xs mt-0.5 font-normal">{subtitle}</p>
      </div>
      <div className="p-6 overflow-x-auto">
        {data.length === 0 ? (
          <p className="text-sm text-slate-400 italic text-center py-4">No structural records present in this sector query.</p>
        ) : (
          <table className="w-full text-left text-sm border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-xs uppercase tracking-wider">
                {headers.map((h, i) => <th key={i} className="p-3">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
              {data.map((item, idx) => renderRow(item, idx))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}