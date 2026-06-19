import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext.jsx';
import SuperAdminPanel from '../components/dashboard/SuperAdminPanel.jsx';
import AdminPanel from '../components/dashboard/AdminPanel.jsx';
import ProcurementPanel from '../components/dashboard/ProcurementPanel.jsx';

const Dashboard = () => {
  const { userData } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('overview');

  // Defensive fallback tracking role definitions
  const userRole = userData?.role?.toLowerCase() || 'superadmin';// Swapped for previewing matching layout systems natively

  // Sidebar link conditional rendering array
  const navigationMap = {
    superadmin: [
      { id: 'overview', name: 'Control Overview' },
      { id: 'registrations', name: 'Organization Verifications' },
      { id: 'products', name: 'Add a new product' },
      {id:'batch',name:'Add a new inventory batch'},
      { id: 'orders', name: 'Global Supply Orders' },
      { id: 'directory', name: 'Corporate Directory' },
      {id:'catalog',name:'Catalog'}
    ],
    admin: [
      { id: 'overview', name: 'Company Hub' },
      { id: 'team', name: 'Manage Procurement Staff' },
      { id: 'orders', name: 'Company Requisitions' }
    ],
    'procurement worker': [
      { id: 'overview', name: 'Procurement Dashboard' },
      { id: 'orders', name: 'Assigned Order Desks' }
    ]
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-[#0f2d4a]">
      {/* 1. SHARED CONTENT SIDEBAR DESK */}
      <aside className="w-64 bg-[#0f2d4a] text-white flex flex-col p-6 shrink-0 shadow-xl">
        <div className="mb-8">
          <h2 className="text-xl font-black tracking-wider text-[#00c4a7]">PHARMASTREAM</h2>
          <p className="text-[10px] text-slate-400 font-mono mt-1 uppercase tracking-widest">{userRole} Node</p>
        </div>

        <nav className="space-y-1.5 flex-grow">
          {navigationMap[userRole]?.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all ${
                activeTab === tab.id 
                  ? 'bg-[#00c4a7] text-white shadow-md' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </aside>

      {/* 2. DYNAMIC WORKSPACE PORTAL CONTAINER */}
      <main className="flex-grow p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {userRole === 'superadmin' && <SuperAdminPanel activeTab={activeTab} />}
        {userRole === 'admin' && <AdminPanel activeTab={activeTab} />}
        {userRole === 'procurement worker' && <ProcurementPanel activeTab={activeTab} />}
      </main>
    </div>
  );
};

export default Dashboard;