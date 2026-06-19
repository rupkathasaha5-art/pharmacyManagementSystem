import React, { useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext.jsx';
import Catalog from '../../pages/Catalog.jsx'; // Make sure the path accurately maps to your Catalog component file

const ProcurementPanel = ({ activeTab }) => {
  const { userData } = useContext(AppContext);

  // Exclusive Personal Order Log Array Layer tracking ONLY this specific worker's signature ID
  const [myPersonalOrders, setMyPersonalOrders] = useState([
    { 
      _id: "ORD-88401", 
      date: "2026-06-14", 
      value: 315.00, 
      itemsCount: 2, 
      status: "pending", 
      processedBy: userData?.id || "u_worker_12" 
    },
    { 
      _id: "ORD-81320", 
      date: "2026-05-19", 
      value: 1890.00, 
      itemsCount: 7, 
      status: "fulfilled", 
      processedBy: userData?.id || "u_worker_12" 
    }
  ]);

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* VIEWPORT CHANNEL A: MAIN MARKETPLACE VIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-2">
          {/* Renders your exact global Catalog layout right inside the workspace */}
          <Catalog />
        </div>
      )}

      {/* VIEWPORT CHANNEL B: ISOLATED WORKER PERSONAL REQUISITIONS REGISTER */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">My Dispatched Consignments</h2>
            <p className="text-xs text-slate-400 mt-1">
              Exclusively tracking procurement contracts processed under your personal signature account.
            </p>
          </div>

          <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b">
                <tr>
                  <th className="p-4">Requisition ID</th>
                  <th className="p-4">Timestamp Date</th>
                  <th className="p-4">Manifest Volume</th>
                  <th className="p-4">Total Value</th>
                  <th className="p-4 text-right">Logistics Status</th>
                </tr>
              </thead>
              <tbody className="divide-y font-medium text-slate-700">
                {myPersonalOrders.map(order => {
                  const statusThemes = {
                    pending: "bg-amber-50 text-amber-700 border-amber-200",
                    shipped: "bg-blue-50 text-blue-700 border-blue-200",
                    fulfilled: "bg-emerald-50 text-emerald-700 border-emerald-200"
                  };

                  return (
                    <tr key={order._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-mono text-xs font-bold text-slate-800">{order._id}</td>
                      <td className="p-4 text-slate-500">{order.date}</td>
                      <td className="p-4 text-slate-600">{order.itemsCount} batch items</td>
                      <td className="p-4 font-mono font-bold text-[#0f2d4a]">${order.value.toFixed(2)}</td>
                      <td className="p-4 text-right">
                        <span className={`px-2.5 py-0.5 rounded text-xs border font-bold uppercase font-mono tracking-wide ${statusThemes[order.status]}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProcurementPanel;