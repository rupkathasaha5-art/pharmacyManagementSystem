import React, { useContext } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { AppContext } from '../context/AppContext.jsx';
import {
  ShieldCheck,
  PackagePlus,
  FlaskConical,
  Radar,
  Wallet,
  Factory,
  CreditCard,
  ShoppingCart,
  Truck,
  Building2,
  Map,
  KeyRound,
  ClipboardList,
  LogOut,
} from 'lucide-react';

// Centralized configuration for role-based access control (RBAC)
const MENU_CONFIG = [
  // --- SUPER_ADMIN MODULES ---
  { id: 'sa-kyc', name: 'KYC Approvals', path: '/dashboard/kyc', roles: ['SUPER_ADMIN'], Icon: ShieldCheck },
  { id: 'sa-prod', name: 'Add Product', path: '/dashboard/add-product', roles: ['SUPER_ADMIN'], Icon: PackagePlus },
  { id: 'sa-inv', name: 'Add Inventory', path: '/dashboard/add-inventory', roles: ['SUPER_ADMIN'], Icon: FlaskConical },
  { id: 'sa-ord', name: 'Order Control Tower', path: '/dashboard/track-orders', roles: ['SUPER_ADMIN'], Icon: Radar },
  { id: 'sa-fin', name: 'Accounts Receivable', path: '/dashboard/receivables', roles: ['SUPER_ADMIN'], Icon: Wallet },
  { id: 'sa-mr', name: 'Return to Manufacturer', path: '/dashboard/return-to-manufacturer', roles: ['SUPER_ADMIN'], Icon: Factory },

  // --- ORG_ADMIN MODULES ---
  { id: 'oa-fin', name: 'Financial HUD', path: '/dashboard/wallet', roles: ['ORG_ADMIN'], Icon: CreditCard },
  { id: 'oa-cat', name: 'Procurement (Order Now)', path: '/catalog', roles: ['ORG_ADMIN'], Icon: ShoppingCart },
  { id: 'oa-ord', name: 'Order Tracking & OTPs', path: '/dashboard/my-orders', roles: ['ORG_ADMIN'], Icon: Truck },
  { id: 'oa-pro', name: 'Compliance Profile', path: '/dashboard/profile', roles: ['ORG_ADMIN'], Icon: Building2 },
   
  // --- DRIVER MODULES ---
  { id: 'dr-man', name: 'Active Manifest', path: '/dashboard/manifest', roles: ['DRIVER'], Icon: Map },
  { id: 'dr-drp', name: 'Drop-Off & OTP', path: '/dashboard/dropoff', roles: ['DRIVER'], Icon: KeyRound },
  { id: 'dr-ldg', name: 'Delivery Ledger', path: '/dashboard/ledger', roles: ['DRIVER'], Icon: ClipboardList },
];

const DashboardLayout = () => {
  const { isLoggedIn, userData, cart, setIsLoggedIn, setUserData } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (!isLoggedIn || !userData) {
      navigate('/login', { replace: true });
    }
  }, [isLoggedIn, userData, navigate]);

  if (!isLoggedIn || !userData) return null;

  const userRole = userData?.role;
  const allowedMenus = MENU_CONFIG.filter((menu) => menu.roles.includes(userRole));

  const cartTotalItems = cart.reduce((total, item) => total + item.orderQuantity, 0);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserData(null);
    navigate('/login', { replace: true });
  };

  const pageTitle =
    location.pathname === '/dashboard'
      ? 'Dashboard Overview'
      : location.pathname.split('/').pop().replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* SIDEBAR NAVIGATION (Dark Teal & Yellow Accents) */}
      <aside className="w-64 bg-teal-800 flex-col shadow-xl z-20 hidden md:flex">
        <div
          onClick={() => navigate('/dashboard')}
          className="p-6 cursor-pointer border-b border-teal-700 hover:bg-teal-900 transition-colors"
        >
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Pharma<span className="text-yellow-400">Stream</span>
          </h2>
          <p className="text-teal-200 text-xs mt-1 uppercase tracking-wider font-semibold">
            {userRole.replace('_', ' ')} PORTAL
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 space-y-1">
          {allowedMenus.map((menu) => {
            const isActive = location.pathname.startsWith(menu.path);
            const { Icon } = menu;
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
                <Icon size={18} strokeWidth={2} className="mr-3 shrink-0" />
                {menu.name}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-teal-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 bg-teal-900 text-teal-100 hover:text-white hover:bg-red-600 rounded text-sm font-bold transition-colors"
          >
            <LogOut size={16} strokeWidth={2} />
            Secure Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 z-10 shadow-sm">
          <h1 className="text-lg font-bold text-teal-900 capitalize">{pageTitle}</h1>

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

        <main className="flex-1 overflow-y-auto p-8">
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

const roleFunctions = {
  SUPER_ADMIN: [
    { title: 'Approve KYC Registrations', desc: 'Review drug licenses and unlock ₹50k credit limits for pending chemists.', Icon: ShieldCheck },
    { title: 'Add Product', desc: 'Register new medicines to the catalog with pricing, tax, and classification details.', Icon: PackagePlus },
    { title: 'Add Inventory', desc: 'Log new stock batches against existing products, tracking expiry and quantity.', Icon: FlaskConical },
    { title: 'Order Control Tower', desc: 'Monitor live checkout carts, assign orders to drivers, and track route status.', Icon: Radar },
    { title: 'Financial Reconciliation', desc: 'View Accounts Receivable, overdue Net-14 invoices, and daily settlement activity.', Icon: Wallet },
    { title: 'Return to Manufacturer', desc: 'Medicines expiring within 90 days are flagged and returned to the manufacturer.', Icon: Factory },
  ],
  ORG_ADMIN: [
    { title: 'Procurement Catalog', desc: 'Search available inventory, add to cart, and check out instantly against trade credit.', Icon: ShoppingCart },
    { title: 'Financial HUD', desc: 'Monitor your credit limit, current outstanding balance, and avoid credit freezes.', Icon: CreditCard },
    { title: 'Order Tracking & OTPs', desc: 'Track every orders status and view the delivery code once its out for drop-off.', Icon: Truck },
  { title: 'Compliance Profile', desc: 'View your registered legal details, drug license status, and KYC approval standing.', Icon: Building2 },
  ],
  DRIVER: [
    { title: 'Active Manifest Routing', desc: 'View today\u2019s assigned drop-offs, chemist contact info, and map directions.', Icon: Map },
    { title: 'Drop-Off Confirmation', desc: 'Enter the chemist\u2019s delivery code to finalize the drop-off and release the invoice.', Icon: KeyRound },
    { title: 'End-of-Day Ledger', desc: 'Review your completed deliveries and report exceptions such as a closed shop.', Icon: ClipboardList },
  ],
};

const DashboardWelcome = ({ role, name }) => {
  const tasks = roleFunctions[role] || [];

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-teal-900">Welcome back, {name}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tasks.map((task, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-xl border-l-4 border-yellow-400 shadow-sm hover:shadow-md transition-shadow flex gap-4"
          >
            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
              <task.Icon size={19} className="text-teal-700" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-teal-800 mb-2">{task.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{task.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardLayout;