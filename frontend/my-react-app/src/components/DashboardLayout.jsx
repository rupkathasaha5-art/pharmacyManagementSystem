// components/common/DashboardLayout.jsx
import React from 'react';

export default function DashboardLayout({ title, roleLabel, children, sidebarNavItems }) {
  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800 font-sans">
      {/* Dynamic Left Sidebar Grid */}
      <div className="w-64 bg-teal-950 text-white flex flex-col p-5 space-y-6 shrink-0 shadow-lg">
        <div className="border-b border-teal-800 pb-4">
          <h1 className="text-xl font-bold tracking-tight text-teal-400 flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-amber-400 inline-block animate-pulse"></span>
            PharmaStream
          </h1>
          <span className="text-[10px] bg-teal-900 text-amber-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider block mt-2 w-max border border-teal-700">
            {roleLabel}
          </span>
        </div>
        <nav className="flex-grow space-y-1 text-sm font-medium">
          {sidebarNavItems.map((item, index) => (
            <div
              key={index}
              onClick={item.action}
              className={`flex items-center gap-3 px-3 py-2.5 rounded cursor-pointer transition-all duration-150 ${
                item.active 
                  ? 'bg-teal-500 text-white shadow-md' 
                  : 'hover:bg-teal-900/60 text-teal-100 hover:text-white'
              }`}
            >
              <i className={`fa-solid ${item.icon} ${item.active ? 'text-amber-300' : 'text-teal-400'}`}></i>
              {item.label}
            </div>
          ))}
        </nav>
      </div>

      {/* Main Right Working Canvas */}
      <div className="flex-grow flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h2>
          <div className="flex items-center gap-2 text-xs font-semibold bg-slate-100 px-3 py-1.5 rounded text-slate-600">
            <i className="fa-solid fa-circle-user text-teal-500 text-sm"></i>
            Active Instance Node
          </div>
        </header>
        <main className="flex-grow p-8 space-y-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}