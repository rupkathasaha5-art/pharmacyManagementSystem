import React, { useState } from 'react';

const AdminPanel = ({ activeTab }) => {
  // 1. STATE: Pending onboarding worker applications unique to this corporate node
  const [pendingWorkers, setPendingWorkers] = useState([
    {
      _id: "worker_901",
      name: "Amit Banerjee",
      email: "amit.b@apexpharma.com",
      role: "procurement worker",
      joinedAt: "2026-06-15",
      isApproved: false
    }
  ]);

  // 2. STATE: Full personnel roster database slice for this organization
  const [companyStaff, setCompanyStaff] = useState([
    { id: "emp_101", name: "Ananya Roy", email: "ananya.r@apexpharma.com", role: "procurement worker", handledOrders: 14 },
    { id: "emp_102", name: "Vikram Malhotra", email: "v.malhotra@apexpharma.com", role: "procurement worker", handledOrders: 8 }
  ]);

  // 3. STATE: Exclusive outbound logistics pipeline tracing transactions placed by this company
  const [companyOrders, setCompanyOrders] = useState([
    { _id: "ORD-77102", date: "2026-06-10", value: 840.00, itemsCount: 4, status: "pending" },
    { _id: "ORD-76951", date: "2026-06-04", value: 2450.00, itemsCount: 12, status: "shipped" },
    { _id: "ORD-75210", date: "2026-05-28", value: 1120.00, itemsCount: 6, status: "fulfilled" }
  ]);

  // Worker Application Verification Action Handler Gateway Pipeline
  const handleWorkerVerification = (workerId, action) => {
    // In production, this matches a PATCH / DELETE request to your user management API endpoint
    alert(`Fired Security Dispatch: Action [${action}] onto Worker Node [${workerId}]`);
    
    if (action === 'approve') {
      // Find the worker to migrate them into the active staff directory roster array row
      const approvedWorker = pendingWorkers.find(w => w._id === workerId);
      if (approvedWorker) {
        setCompanyStaff(prev => [...prev, {
          id: approvedWorker._id,
          name: approvedWorker.name,
          email: approvedWorker.email,
          role: approvedWorker.role,
          handledOrders: 0
        }]);
      }
    }
    
    // Drop the application card entry state across both approval pathways (Approve maps to true in DB, Reject drops record)
    setPendingWorkers(prev => prev.filter(w => w._id !== workerId));
  };

  // Personnel Account Removal Handler Execution Block
  const handleEjectEmployee = (staffId) => {
    if (window.confirm("Confirm structural revocation: Are you sure you want to permanently eject this worker entry from the enterprise directory database slot?")) {
      setCompanyStaff(prev => prev.filter(emp => emp.id !== staffId));
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* CHANNEL STATUS FLAG A: ONBOARDING NOTIFICATION CENTER */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Quick Statistics Strip Container */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Staff Verification Queue</h3>
              <p className="text-2xl font-black text-[#0f2d4a] mt-1">{pendingWorkers.length} pending apps</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Authorized Labor</h3>
              <p className="text-2xl font-black text-[#0f2d4a] mt-1">{companyStaff.length} professionals</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dispatched Consignments</h3>
              <p className="text-2xl font-black text-[#009688] mt-1">
                {companyOrders.filter(o => o.status === 'shipped' || o.status === 'pending').length} active transits
              </p>
            </div>
          </div>

          {/* Registration Notifications Notification Deck */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">Onboarding Intake Desk</h2>
              {pendingWorkers.length > 0 && (
                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
              )}
            </div>

            {pendingWorkers.length === 0 ? (
              <div className="bg-white border border-dashed rounded-xl p-8 text-center text-sm text-slate-400 italic">
                All staff credentials authorized. Monitoring channels nominal.
              </div>
            ) : (
              pendingWorkers.map(worker => (
                <div key={worker._id} className="bg-white border-2 border-teal-500/10 rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between p-6 gap-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-bold text-lg text-[#0f2d4a]">{worker.name}</h4>
                      <span className="text-[9px] font-bold uppercase font-mono tracking-widest bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">
                        {worker.role}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-500">{worker.email}</p>
                    <p className="text-xs text-slate-400 font-medium">Application Timestamp Signature: {worker.joinedAt}</p>
                  </div>

                  {/* Verification Execution Call-to-Actions Wrapper */}
                  <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                    <button
                      onClick={() => handleWorkerVerification(worker._id, 'approve')}
                      className="flex-grow md:flex-none bg-[#00c4a7] hover:bg-[#00b096] text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-sm tracking-wide uppercase transition-colors"
                    >
                      Approve Worker
                    </button>
                    <button
                      onClick={() => handleWorkerVerification(worker._id, 'reject')}
                      className="flex-grow md:flex-none bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold text-xs px-5 py-2.5 rounded-lg tracking-wide uppercase transition-colors"
                    >
                      Deny & Wipe
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* CHANNEL STATUS FLAG B: PROCUREMENT WORKER DIRECTORY */}
      {activeTab === 'team' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Enterprise Operations Personnel</h2>
          <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b">
                <tr>
                  <th className="p-4">Staff Identifier</th>
                  <th className="p-4">Nomenclature Name</th>
                  <th className="p-4">E-Mail Endpoint</th>
                  <th className="p-4 text-center">Fulfillment Cycles</th>
                  <th className="p-4 text-right">Security Protocols</th>
                </tr>
              </thead>
              <tbody className="divide-y font-medium text-slate-700">
                {companyStaff.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-mono text-xs text-slate-400">{emp.id}</td>
                    <td className="p-4 font-bold text-[#0f2d4a]">{emp.name}</td>
                    <td className="p-4 text-slate-500">{emp.email}</td>
                    <td className="p-4 text-center font-mono font-bold text-teal-600">{emp.handledOrders} completed</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleEjectEmployee(emp.id)}
                        className="text-xs text-red-400 hover:text-red-600 font-bold uppercase tracking-wider border border-transparent hover:border-red-100 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-all"
                      >
                        Eject Personnel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CHANNEL STATUS FLAG C: COMPANY LOGISTICS SUPPLY REQUISITIONS SUMMARY */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Organization Requisition Logs</h2>
          <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b">
                <tr>
                  <th className="p-4">Order Node Code</th>
                  <th className="p-4">Timestamp Date</th>
                  <th className="p-4">Allocation Consignment Size</th>
                  <th className="p-4">Invoice Net Total</th>
                  <th className="p-4 text-right">Logistics Phase Status</th>
                </tr>
              </thead>
              <tbody className="divide-y font-medium text-slate-700">
                {companyOrders.map(order => {
                  // Determine tailwind pill theme variables based on backend validation keys
                  const statusThemes = {
                    pending: "bg-amber-50 text-amber-700 border-amber-200",
                    shipped: "bg-blue-50 text-blue-700 border-blue-200",
                    fulfilled: "bg-emerald-50 text-emerald-700 border-emerald-200"
                  };

                  return (
                    <tr key={order._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-mono text-xs font-bold text-slate-800">{order._id}</td>
                      <td className="p-4 text-slate-500">{order.date}</td>
                      <td className="p-4 font-medium text-slate-600">{order.itemsCount} batch fields</td>
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

export default AdminPanel;