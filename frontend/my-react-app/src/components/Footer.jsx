import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 font-sans border-t border-slate-800">
      
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8 border-b border-slate-800">
        
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-teal-500 rounded-full flex items-center justify-center font-bold text-white shadow-sm shadow-teal-500/50">
              P
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Pharma<span className="text-teal-400">Stream</span>
            </span>
          </div>
          <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
            The ultimate digital supply chain solution for modern pharmacies. Streamlining B2B procurement and medical inventory logistics securely.
          </p>
        </div>

        {/* Quick Navigation Links */}
        <div className="grid grid-cols-2 gap-4 md:justify-items-center">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 mb-3">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/catalog" className="hover:text-emerald-300 transition-colors duration-200">Product Catalog</a></li>
              <li><a href="/register" className="hover:text-emerald-300 transition-colors duration-200">B2B Registration</a></li>
              <li><a href="/about" className="hover:text-emerald-300 transition-colors duration-200">About Us</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 mb-3">Compliance</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/terms" className="hover:text-emerald-300 transition-colors duration-200">Terms of Service</a></li>
              <li><a href="/privacy" className="hover:text-emerald-300 transition-colors duration-200">Privacy Policy</a></li>
              <li><a href="/contact" className="hover:text-emerald-300 transition-colors duration-200">Support Desk</a></li>
            </ul>
          </div>
        </div>

        {/* B2B Marketplace Newsletter Updates */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold tracking-tight text-white">Subscribe to Market Updates</h4>
          <p className="text-xs text-slate-400">Get regulatory adjustments, stock alerts, and supply notifications.</p>
          <form className="flex max-w-md gap-2" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="procurement@company.com" 
              required
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors duration-200"
            />
            <button 
              type="submit" 
              className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded text-sm font-semibold shadow-sm transition-colors duration-200 shrink-0"
            >
              Join
            </button>
          </form>
        </div>

      </div>

      {/* Bottom Section: Legal & Copyright */}
      <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} PharmaStream B2B Network. All rights reserved.</p>
        <div className="flex space-x-6">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            All Supply Lines Operational
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;