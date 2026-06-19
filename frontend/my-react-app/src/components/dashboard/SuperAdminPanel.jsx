// components/dashboard/SuperAdminPanel.jsx
import React, { useState } from 'react';
import Catalog from '../../pages/Catalog.jsx';

const SuperAdminPanel = ({ activeTab }) => {
  // Mock data representing registration pipelines tracking unverified org profiles
  const [pendingOrgs, setPendingOrgs] = useState([
    {
      _id: "org_101",
      status: "pending",
      organization: {
        name: "Apex Global Pharmacies",
        taxId: "TX-998-112A",
        phone: "+91 98765 43210",
        email: "intake@apexpharma.com",
        address: { street: "42 Industrial Avenue", city: "Kolkata", state: "West Bengal", postalCode: "700001" },
        license: { number: "DL-WB-2026-XYZ", expiryDate: "2030-12-15" }
      },
      primaryAdmin: { name: "Satyaroop Chatterjee", email: "satya.admin@apexpharma.com" }
    }
  ]);

  // Mock corporate database data for the directories tab
  const [directoryOrgs, setDirectoryOrgs] = useState([
    {
      _id: "org_202",
      name: "MedLife Distribution",
      employees: [
        { id: "emp_1", name: "Rahul Sharma", role: "Admin", email: "rahul@medlife.com" },
        { id: "emp_2", name: "Priya Das", role: "Procurement Worker", email: "priya@medlife.com" }
      ]
    }
  ]);

  // Mock registry representing products already available in your catalog database
  const [registeredCatalogProducts, setRegisteredCatalogProducts] = useState([
    { _id: "prod_amx_250", name: "Amoxicillin Trihydrate", strength: "250mg", manufacturer: "Cipla" },
    { _id: "prod_ins_lan", name: "Humalog Insulin Lantus", strength: "100 U/mL", manufacturer: "Sun Pharmaceutical Industries" },
    { _id: "prod_lip_040", name: "Lipitor (Atorvastatin)", strength: "40mg", manufacturer: "Dr. Reddy's Laboratories" }
  ]);

  // =========================================================================
  // STATE MANAGEMENT SYSTEMS: MULTI-ROW ARRAYS FOR BULK INGESTION
  // =========================================================================
  
  // State for Form A (Products Array)
  const [productRows, setProductRows] = useState([
    { name: '', strength: '', form: 'Tablet', sku: '', wholesalePrice: '', manufacturer: '', scheduleClass: 'Rx-Only', requiresColdChain: false }
  ]);

  // State for Form B (Batches Array)
  const [batchRows, setBatchRows] = useState([
    { productId: '', batchNumber: '', totalQuantity: '', storageZone: '', manufacturingDate: '', expiryDate: '' }
  ]);

  // =========================================================================
  // ACTIONS: ROW MODIFICATION MUTATORS
  // =========================================================================
  
  // Row Manipulators for Form A (Products)
  const addProductRow = () => {
    setProductRows([...productRows, { name: '', strength: '', form: 'Tablet', sku: '', wholesalePrice: '', manufacturer: '', scheduleClass: 'Rx-Only', requiresColdChain: false }]);
  };

  const removeProductRow = (index) => {
    if (productRows.length === 1) return;
    setProductRows(productRows.filter((_, i) => i !== index));
  };

  const handleProductRowChange = (index, field, value) => {
    const updatedRows = [...productRows];
    updatedRows[index][field] = value;
    setProductRows(updatedRows);
  };

  // Row Manipulators for Form B (Batches)
  const addBatchRow = () => {
    setBatchRows([...batchRows, { productId: '', batchNumber: '', totalQuantity: '', storageZone: '', manufacturingDate: '', expiryDate: '' }]);
  };

  const removeBatchRow = (index) => {
    if (batchRows.length === 1) return;
    setBatchRows(batchRows.filter((_, i) => i !== index));
  };

  const handleBatchRowChange = (index, field, value) => {
    const updatedRows = [...batchRows];
    updatedRows[index][field] = value;
    setBatchRows(updatedRows);
  };

  // =========================================================================
  // EXECUTION PIPELINES: BULK SUBMISSIONS
  // =========================================================================
  const handleBulkProductSubmit = (e) => {
    e.preventDefault();
    alert(`Form A - Bulk Committing ${productRows.length} Products to Master Catalog Database:\n${JSON.stringify(productRows, null, 2)}`);
    
    // Dynamically expand the registered catalog dropdown storage values matching rows
    const updatedCatalog = [...registeredCatalogProducts];
    productRows.forEach((row, i) => {
      updatedCatalog.push({ _id: `bulk_prod_${Date.now()}_${i}`, name: row.name, strength: row.strength, manufacturer: row.manufacturer });
    });
    setRegisteredCatalogProducts(updatedCatalog);

    // Re-initialize state space back to a clear clean row
    setProductRows([{ name: '', strength: '', form: 'Tablet', sku: '', wholesalePrice: '', manufacturer: '', scheduleClass: 'Rx-Only', requiresColdChain: false }]);
  };

  const handleBulkBatchSubmit = (e) => {
    e.preventDefault();
    alert(`Form B - Bulk Logged ${batchRows.length} Inbound Lots to Warehouse Stocks:\n${JSON.stringify(batchRows, null, 2)}`);
    setBatchRows([{ productId: '', batchNumber: '', totalQuantity: '', storageZone: '', manufacturingDate: '', expiryDate: '' }]);
  };

  const handleOrgVerificationAction = (orgId, action) => {
    alert(`Backend Request Fired: Action -> ${action} on Org Identifier -> ${orgId}`);
    setPendingOrgs(prev => prev.filter(o => o._id !== orgId));
  };

  const handleApproveEmployee = (orgId, empId, empName) => {
  alert(`Access Granted: ${empName} has been fully verified and activated.`);
  
  // Instantly remove from the pending directory screen upon successful validation
  setDirectoryOrgs(prev => prev.map(org => {
    if (org._id === orgId) {
      return { ...org, employees: org.employees.filter(e => e.id !== empId) };
    }
    return org;
  }));
};

const handleRemoveEmployee = (orgId, empId, empName) => {
  alert(`Access Revoked: ${empName} has been rejected and ejected from staff rosters.`);
  
  setDirectoryOrgs(prev => prev.map(org => {
    if (org._id === orgId) {
      return { ...org, employees: org.employees.filter(e => e.id !== empId) };
    }
    return org;
  }));
};
  const handleRemoveOrganization = (orgId) => {
    setDirectoryOrgs(prev => prev.filter(org => org._id !== orgId));
  };

  return (
    <div className="space-y-6 text-[#0f2d4a] font-sans">
      
      {/* SECTION A: REGISTRATIONS VERIFICATION FLAGS PANEL */}
      {activeTab === 'registrations' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Pending Organization Registrations</h2>
          {pendingOrgs.length === 0 ? (
            <p className="text-slate-400 italic text-sm p-6 bg-white border border-slate-200 rounded-xl shadow-sm">No new organization validation manifests pending authorization blocks.</p>
          ) : (
            pendingOrgs.map(org => (
              <div key={org._id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="bg-[#f4fbf9]/60 px-6 py-3 border-b border-slate-100 flex justify-between items-center">
                  <span className="text-xs font-bold text-[#009688] font-mono tracking-wider uppercase">Verification Intake Flag</span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-amber-100 text-amber-700 capitalize border border-amber-200/50">{org.status} Approval</span>
                </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                  <div>
                    <h4 className="font-bold text-slate-400 text-[10px] uppercase tracking-wider mb-2">Corporate Profile</h4>
                    <p className="font-black text-base text-[#0f2d4a]">{org.organization.name}</p>
                    <p className="text-slate-500 text-xs mt-1">Tax Identification Code: {org.organization.taxId}</p>
                    <p className="text-slate-500 text-xs">Ph: {org.organization.phone}</p>
                    <p className="text-slate-500 text-xs">{org.organization.email}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-400 text-[10px] uppercase tracking-wider mb-2">Primary Admin Details</h4>
                    <p className="font-bold text-slate-700">{org.primaryAdmin.name}</p>
                    <p className="text-slate-500 text-xs">{org.primaryAdmin.email}</p>
                    <div className="mt-2 bg-[#f4fbf9]/30 border border-teal-500/10 p-2 rounded text-[11px] text-slate-500">
                      <strong>Logistics Footprint:</strong> {org.organization.address.street}, {org.organization.address.city}, {org.organization.address.state} ({org.organization.address.postalCode})
                    </div>
                  </div>
                  <div className="bg-slate-50/50 border rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-slate-400 text-[10px] uppercase tracking-wider mb-1">Regulatory Credentials</h4>
                      <p className="font-mono text-xs text-slate-700">License ID: <strong>{org.organization.license.number}</strong></p>
                      <p className="text-[11px] text-amber-600 font-semibold flex items-center gap-1 mt-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span> Valid Horizon Expiry: {org.organization.license.expiryDate}
                      </p>
                    </div>
                    <div className="flex gap-2 mt-4 pt-3 border-t w-full">
                      <button onClick={() => handleOrgVerificationAction(org._id, 'approve')} className="flex-grow bg-[#00c4a7] hover:bg-[#00b096] text-white font-bold text-xs py-2 rounded-lg transition-all uppercase tracking-wider shadow-sm">Approve Profile</button>
                      <button onClick={() => handleOrgVerificationAction(org._id, 'reject')} className="flex-grow border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs py-2 rounded-lg transition-all uppercase tracking-wider">Reject & Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* SECTION B - PART 1: MASTER BASE PRODUCT VARIANT REGISTRY (BULK ROUTE) */}
      {activeTab === 'products' && (
        <form onSubmit={handleBulkProductSubmit} className="space-y-6 max-w-5xl">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 mb-6 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#00c4a7]"></span>
                  <h2 className="text-xl font-bold tracking-tight">Bulk Base Product Initialization</h2>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Define master chemical configurations. Create as many entries as needed before publishing.</p>
              </div>
              <button 
                type="button" 
                onClick={addProductRow}
                className="bg-teal-50 text-[#009688] border border-teal-200 hover:bg-teal-100 font-bold text-xs px-4 py-2 rounded-lg tracking-wider uppercase transition-all shadow-sm"
              >
                + Add Another Product Row
              </button>
            </div>

            {/* Matrix Form Repeater */}
            <div className="space-y-6 divide-y divide-dashed divide-slate-200">
              {productRows.map((row, index) => (
                <div key={index} className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-semibold text-slate-600 ${index > 0 ? 'pt-6' : ''}`}>
                  <div className="sm:col-span-1 lg:col-span-3 flex justify-between items-center bg-slate-50 p-2 rounded-lg border">
                    <span className="text-[11px] uppercase tracking-wider font-mono text-slate-400 font-bold">Item Instance #{index + 1}</span>
                    {productRows.length > 1 && (
                      <button type="button" onClick={() => removeProductRow(index)} className="text-red-500 hover:text-red-700 text-[10px] uppercase font-black">Remove Entry Row</button>
                    )}
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase tracking-wider mb-1">Medicine Nomenclature Title</label>
                    <input type="text" value={row.name} onChange={e => handleProductRowChange(index, 'name', e.target.value)} className="w-full border p-2.5 rounded-lg focus:outline-none focus:border-teal-500 bg-white font-medium text-sm text-[#0f2d4a]" placeholder="e.g., Amoxicillin Trihydrate" required />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase tracking-wider mb-1">Active Mass Strength</label>
                    <input type="text" value={row.strength} onChange={e => handleProductRowChange(index, 'strength', e.target.value)} className="w-full border p-2.5 rounded-lg focus:outline-none focus:border-teal-500 bg-white font-medium text-sm text-[#0f2d4a]" placeholder="e.g., 500mg" required />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase tracking-wider mb-1">Galenic Formulation Matrix Type</label>
                    <select value={row.form} onChange={e => handleProductRowChange(index, 'form', e.target.value)} className="w-full border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-teal-500 bg-white font-medium text-sm text-[#0f2d4a]">
                      <option>Tablet</option><option>Capsule</option><option>Vial</option><option>Syrup</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase tracking-wider mb-1">Stock Keeping Unit (SKU Code)</label>
                    <input type="text" value={row.sku} onChange={e => handleProductRowChange(index, 'sku', e.target.value)} className="w-full border p-2.5 rounded-lg focus:outline-none focus:border-teal-500 bg-white font-mono text-xs font-bold text-[#0f2d4a]" placeholder="e.g., SKU-AMX-250-CAP" required />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase tracking-wider mb-1">Wholesale Pricing Basis ($ / Case Lot)</label>
                    <input type="number" min="0" step="0.01" value={row.wholesalePrice} onChange={e => handleProductRowChange(index, 'wholesalePrice', e.target.value)} className="w-full border p-2.5 rounded-lg focus:outline-none focus:border-teal-500 bg-white font-medium text-sm text-[#0f2d4a]" placeholder="0.00" required />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase tracking-wider mb-1">Manufacturing Organization Label</label>
                    <input type="text" value={row.manufacturer} onChange={e => handleProductRowChange(index, 'manufacturer', e.target.value)} className="w-full border p-2.5 rounded-lg focus:outline-none focus:border-teal-500 bg-white font-medium text-sm text-[#0f2d4a]" placeholder="e.g., Cipla Corporate" required />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 text-[10px] uppercase tracking-wider mb-1">Regulatory Risk Schedule Classification Tiering</label>
                    <select value={row.scheduleClass} onChange={e => handleProductRowChange(index, 'scheduleClass', e.target.value)} className="w-full border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-teal-500 bg-white font-medium text-sm text-[#0f2d4a]">
                      <option>Rx-Only</option><option>Schedule-II</option><option>Schedule-IV</option><option>Over-The-Counter</option>
                    </select>
                  </div>
                  <div className="sm:col-span-1 flex items-center gap-2 py-2 pt-6">
                    <input type="checkbox" id={`coldChain-${index}`} checked={row.requiresColdChain} onChange={e => handleProductRowChange(index, 'requiresColdChain', e.target.checked)} className="h-4 w-4 accent-[#00c4a7] cursor-pointer" />
                    <label htmlFor={`coldChain-${index}`} className="text-[11px] text-slate-500 select-none font-bold cursor-pointer leading-tight">Demands Cold Chain (2°C–8°C)</label>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-slate-100 mt-6 flex justify-end">
              <button type="submit" className="bg-[#00c4a7] text-white hover:bg-[#00b096] font-bold py-3 px-8 rounded-xl transition-all uppercase tracking-wider text-xs shadow-md">
                Commit & Publish Master Products ({productRows.length})
              </button>
            </div>
          </div>
        </form>
      )}

      {/* SECTION B - PART 2: BULK PHYSICAL WAREHOUSE BATCH INGESTION */}
      {activeTab === 'batch' && (
        <form onSubmit={handleBulkBatchSubmit} className="space-y-6 max-w-5xl">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 mb-6 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                  <h2 className="text-xl font-bold tracking-tight">Bulk Warehouse Inbound Batch Ingestion</h2>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Log physical cargo lots into the warehouse system. Links directly to custom product catalog configurations.</p>
              </div>
              <button 
                type="button" 
                onClick={addBatchRow}
                className="bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 font-bold text-xs px-4 py-2 rounded-lg tracking-wider uppercase transition-all shadow-sm"
              >
                + Add Another Freight Lot Row
              </button>
            </div>

            {/* Dynamic Batch Repeater Fields */}
            <div className="space-y-6 divide-y divide-dashed divide-slate-200">
              {batchRows.map((row, index) => (
                <div key={index} className={`grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-600 ${index > 0 ? 'pt-6' : ''}`}>
                  <div className="sm:col-span-2 flex justify-between items-center bg-slate-50 p-2 rounded-lg border">
                    <span className="text-[11px] uppercase tracking-wider font-mono text-slate-400 font-bold">Lot Consignment Cargo #{index + 1}</span>
                    {batchRows.length > 1 && (
                      <button type="button" onClick={() => removeBatchRow(index)} className="text-red-500 hover:text-red-700 text-[10px] uppercase font-black">Delete Lot Row</button>
                    )}
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 text-[10px] uppercase tracking-wider mb-1">Link to Registered Master Product Core</label>
                    <select 
                      value={row.productId} 
                      onChange={e => handleBatchRowChange(index, 'productId', e.target.value)} 
                      className="w-full border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-teal-500 bg-[#f4fbf9]/60 font-bold text-sm text-[#0f2d4a]"
                      required
                    >
                      <option value="">-- Select Target Base Molecule Formula Index --</option>
                      {registeredCatalogProducts.map(p => (
                        <option key={p._id} value={p._id}>{p.name} ({p.strength}) — Mfr: {p.manufacturer}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase tracking-wider mb-1">Traceability Batch / Lot Number</label>
                    <input type="text" value={row.batchNumber} onChange={e => handleBatchRowChange(index, 'batchNumber', e.target.value.toUpperCase())} className="w-full border p-2.5 rounded-lg focus:outline-none focus:border-teal-500 bg-white font-mono text-xs font-bold text-[#0f2d4a]" placeholder="e.g., BAT-AMX-2026A" required />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase tracking-wider mb-1">Total Case Box Quantity Ingested</label>
                    <input type="number" min="1" value={row.totalQuantity} onChange={e => handleBatchRowChange(index, 'totalQuantity', e.target.value)} className="w-full border p-2.5 rounded-lg focus:outline-none focus:border-teal-500 bg-white font-medium text-sm text-[#0f2d4a]" placeholder="e.g., 2500" required />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase tracking-wider mb-1">Manufacturing Line Date Stamp</label>
                    <input type="date" value={row.manufacturingDate} onChange={e => handleBatchRowChange(index, 'manufacturingDate', e.target.value)} className="w-full border p-2.5 rounded-lg focus:outline-none focus:border-teal-500 bg-white font-medium text-slate-500" required />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase tracking-wider mb-1">FEFO Expiration Deadline Date</label>
                    <input type="date" value={row.expiryDate} onChange={e => handleBatchRowChange(index, 'expiryDate', e.target.value)} className="w-full border p-2.5 rounded-lg focus:outline-none focus:border-teal-500 bg-white font-medium text-slate-500" required />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 text-[10px] uppercase tracking-wider mb-1">Warehouse Coordinates (Storage Zone Placement)</label>
                    <input type="text" value={row.storageZone} onChange={e => handleBatchRowChange(index, 'storageZone', e.target.value)} className="w-full border p-2.5 rounded-lg focus:outline-none focus:border-teal-500 bg-white font-medium text-sm text-[#0f2d4a]" placeholder="e.g., Aisle-4-Shelf-B" />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-slate-100 mt-6 flex justify-end">
              <button type="submit" className="bg-[#0f2d4a] text-white hover:bg-[#1a446c] font-bold py-3 px-8 rounded-xl transition-all uppercase tracking-wider text-xs shadow-md">
                Ingest All Freight Lots ({batchRows.length})
              </button>
            </div>
          </div>
        </form>
      )}

      {/* SECTION C: SUPPLY ORDERS MASTER BOARD */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Global Procurement Supply Orders</h2>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="p-4">Order ID</th><th className="p-4">Enterprise Account</th><th className="p-4">Value</th><th className="p-4">Fulfillment Phase Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-4 font-mono text-xs text-[#0f2d4a] font-bold">#ORD-99812</td><td className="p-4">Apollo Hospital Nodes</td><td className="p-4 font-bold">$12,450.00</td>
                  <td className="p-4"><span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 rounded text-xs border border-amber-200/50 font-semibold">Pending Authorization</span></td>
                </tr>
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-4 font-mono text-xs text-[#0f2d4a] font-bold">#ORD-99745</td><td className="p-4">Care Pharmacy Group</td><td className="p-4 font-bold">$4,120.50</td>
                  <td className="p-4"><span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs border border-blue-200/50 font-semibold">Shipped (Transit Lot)</span></td>
                </tr>
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-4 font-mono text-xs text-[#0f2d4a] font-bold">#ORD-99610</td><td className="p-4">MedPlus Distribution</td><td className="p-4 font-bold">$8,900.00</td>
                  <td className="p-4"><span className="px-2.5 py-0.5 bg-teal-50 text-[#009688] rounded text-xs border border-teal-200/50 font-semibold">Fulfilled (Archived Lot)</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}


{activeTab === 'catalog' && <Catalog/>}
 {/* SECTION D: CORPORATE ACCOUNT DIRECTORY & DELETIONS */}
{activeTab === 'directory' && (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold tracking-tight">Corporate Accounts Directory</h2>
    {directoryOrgs.map(org => {
      // Check if this specific organization has any staff rows remaining to view
      const hasEmployees = org.employees && org.employees.length > 0;

      return (
        <div key={org._id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          
          {/* Main Company Row Header */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-3 border-b border-slate-100 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[#0f2d4a]">{org.name}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-[#009688] border border-teal-200/40 uppercase">Monitored Node</span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Unique Corporate Identifier Object ID: {org._id}</p>
            </div>
            <button onClick={() => handleRemoveOrganization(org._id)} className="border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors self-start sm:self-auto shadow-sm">
              Terminate Enterprise Account
            </button>
          </div>

          {/* Staff Allocation Container */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Active Authorized Staff Allocation</p>
            
            {!hasEmployees ? (
              <div className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-lg border border-dashed border-slate-200">
                No pending employee access clearances remain for this corporate registry entity.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {org.employees.map(emp => (
                  <div key={emp.id} className="border border-slate-200 bg-slate-50/40 p-4 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-xs transition-all duration-200">
                    
                    {/* Left Side: Employee Details */}
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{emp.name}</p>
                      <p className="text-slate-400 font-medium mt-0.5">
                        {emp.email} &bull; <strong className="text-[#009688] uppercase text-[10px] tracking-wide">{emp.role}</strong>
                      </p>
                    </div>
                    
                    {/* Right Side: Double Button Action Core */}
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button 
                        onClick={() => handleApproveEmployee(org._id, emp.id, emp.name)}
                        className="bg-[#00c4a7] hover:bg-[#00b096] text-white font-bold uppercase tracking-wider text-[10px] px-3 py-1.5 rounded-md transition-all shadow-sm active:scale-95"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleRemoveEmployee(org._id, emp.id, emp.name)} 
                        className="border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-bold uppercase tracking-wider text-[10px] px-3 py-1.5 rounded-md transition-all active:scale-95"
                      >
                        Reject
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      );
    })}
  </div>
)}

    </div>
  );
};

export default SuperAdminPanel;