import React, { useContext, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { AppContext } from '../context/AppContext.jsx';

// Centralized configuration for role-based access control (RBAC)
const MENU_CONFIG = [
  // --- SUPER_ADMIN MODULES ---
  { id: 'sa-kyc', name: 'KYC Approvals', path: '/dashboard/kyc', roles: ['SUPER_ADMIN'], icon: '🛡️' },
  { id: 'sa-prod', name: 'Add Product', path: '/dashboard/add-product', roles: ['SUPER_ADMIN'], icon: '📦' },
  { id: 'sa-inv', name: 'Add Inventory', path: '/dashboard/add-inventory', roles: ['SUPER_ADMIN'], icon: '🧪' },
  { id: 'sa-ord', name: 'Order Control Tower', path: '/dashboard/admin-orders', roles: ['SUPER_ADMIN'], icon: '📡' },
  { id: 'sa-fin', name: 'Accounts Receivable', path: '/dashboard/finance', roles: ['SUPER_ADMIN'], icon: '💼' },
  
  // --- ORG_ADMIN MODULES ---
  { id: 'oa-fin', name: 'Financial HUD', path: '/dashboard/wallet', roles: ['ORG_ADMIN'], icon: '💳' },
  { id: 'oa-cat', name: 'Procurement (Order Now)', path: '/catalog', roles: ['ORG_ADMIN'], icon: '🛒' },
  { id: 'oa-ord', name: 'Order Tracking & OTPs', path: '/dashboard/my-orders', roles: ['ORG_ADMIN'], icon: '🚚' },
  { id: 'oa-pro', name: 'Compliance Profile', path: '/dashboard/profile', roles: ['ORG_ADMIN'], icon: '🏢' },

  // --- DRIVER MODULES ---
  { id: 'dr-man', name: 'Active Manifest', path: '/dashboard/manifest', roles: ['DRIVER'], icon: '🗺️' },
  { id: 'dr-drp', name: 'Drop-Off & OTP', path: '/dashboard/dropoff', roles: ['DRIVER'], icon: '🔑' },
  { id: 'dr-ldg', name: 'Delivery Ledger', path: '/dashboard/ledger', roles: ['DRIVER'], icon: '📋' }
];

const DashboardLayout = () => {
  const { isLoggedIn, userData, cart, setIsLoggedIn, setUserData } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Auth Guard: If not logged in, boot them to login
  useEffect(() => {
    if (!isLoggedIn || !userData) {
      navigate('/login', { replace: true });
    }
  }, [isLoggedIn, userData, navigate]);

  // Prevent rendering if auth check is still processing
  if (!isLoggedIn || !userData) return null; 

  const userRole = userData?.role;
  const allowedMenus = MENU_CONFIG.filter(menu => menu.roles.includes(userRole));
  
  // Calculate cart total dynamically from AppContext for Org Admins
  const cartTotalItems = cart.reduce((total, item) => total + item.orderQuantity, 0);

  const handleLogout = () => {
    // Clear context and session, then navigate safely
    setIsLoggedIn(false);
    setUserData(null);
    // Add logic here to clear cookies/localStorage if applicable
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* SIDEBAR NAVIGATION (Dark Teal & Yellow Accents) */}
      <aside className="w-64 bg-teal-800 flex flex-col shadow-xl z-20 hidden md:flex">
        <div 
          onClick={() => navigate('/dashboard')}
          className="p-6 cursor-pointer border-b border-teal-700 hover:bg-teal-900 transition-colors"
        >
          <h2 className="text-2xl font-bold text-white tracking-tight">Pharma<span className="text-yellow-400">Stream</span></h2>
          <p className="text-teal-200 text-xs mt-1 uppercase tracking-wider font-semibold">
            {userRole.replace('_', ' ')} PORTAL
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 space-y-1">
          {allowedMenus.map((menu) => {
            const isActive = location.pathname.startsWith(menu.path);
            return (
              <button
                key={menu.id}
                onClick={() => navigate(menu.path)}
                className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-teal-700 text-yellow-400 border-r-4 border-yellow-400' 
                    : 'text-teal-100 hover:bg-teal-700 hover:text-white border-r-4 border-transparent'
                }`}
              >
                <span className="mr-3 text-lg">{menu.icon}</span>
                {menu.name}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-teal-700">
          <button 
            onClick={handleLogout}
            className="w-full py-2 bg-teal-900 text-teal-100 hover:text-white hover:bg-red-600 rounded text-sm font-bold transition-colors"
          >
            Secure Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* TOP HEADER */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 z-10 shadow-sm">
          <h1 className="text-lg font-bold text-teal-900 capitalize">
            {location.pathname === '/dashboard' ? 'Dashboard Overview' : location.pathname.split('/').pop().replace('-', ' ')}
          </h1>
          
          
            
            <div className="flex items-center space-x-3 border-l pl-6 border-slate-200">
              <div className="text-right">
                <p className="text-sm font-bold text-teal-900">{userData?.name}</p>
                <p className="text-xs text-slate-500">{userData?.email}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold border-2 border-yellow-400">
                {userData?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
        </header>

        {/* DYNAMIC CONTENT ROUTER OR DEFAULT DASHBOARD */}
        <main className="flex-1 overflow-y-auto p-8">
          {/* If they are exactly at /dashboard, show the Welcome/Function list, otherwise render nested routes */}
          {location.pathname === '/dashboard' ? (
            <DashboardWelcome role={userRole} name={userData?.name} />
          ) : (
            <Outlet /> 
          )}
        </main>
      </div>
    </div>
  );
};

// Sub-component specifically to list the mandatory functions for each role dynamically
const DashboardWelcome = ({ role, name }) => {
  const roleFunctions = {
    SUPER_ADMIN: [
      { title: 'Approve KYC Registrations', desc: 'Review drug licenses and unlock ₹50k credit limits for pending chemists.' },
      { title: 'Add Product', desc: 'Register new medicines to the catalog with pricing, tax, and classification details.' },
      { title: 'Add Inventory', desc: 'Log new stock batches against existing products, tracking expiry and quantity.' },
      { title: 'Order Control Tower', desc: 'Monitor live checkout carts, assign orders to drivers, and track route status.' },
      { title: 'Financial Reconciliation', desc: 'View Accounts Receivable, overdue Net-14 invoices, and daily Razorpay settlements.' }
    ],
    ORG_ADMIN: [
      { title: 'Procurement Catalog', desc: 'Search available inventory, add to cart, and checkout instantly against trade credit.' },
      { title: 'Financial HUD', desc: 'Monitor your ₹50k limit, view current outstanding balance, and avoid credit freezes.' },
      { title: 'Payment Settlement', desc: 'Settle Net-14 invoices digitally via Razorpay/UPI links sent to your dashboard.' },
      { title: 'Receive Deliveries (OTP)', desc: 'Generate the secure 4-digit OTP to hand to your driver to complete the order drop-off.' }
    ],
    DRIVER: [
      { title: 'Active Manifest Routing', desc: 'View today’s assigned drop-offs, chemist contact info, and Google Maps directions.' },
      { title: 'Cryptographic Drop-off', desc: 'Enter the chemist’s 4-digit OTP into the pad to finalize delivery and release the invoice.' },
      { title: 'End-of-Day Ledger', desc: 'Review your successfully completed deliveries and report exceptions (e.g., Shop Closed).' }
    ]
  };

  const tasks = roleFunctions[role] || [];

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-teal-900">Welcome back, {name}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tasks.map((task, index) => (
          <div key={index} className="bg-white p-6 rounded-xl border-l-4 border-yellow-400 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-bold text-teal-800 mb-2">{task.title}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{task.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardLayout;