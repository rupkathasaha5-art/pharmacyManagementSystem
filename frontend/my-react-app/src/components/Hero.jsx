import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { AppContext } from '../context/AppContext.jsx'

const Hero = () => {
  const { isLoggedIn } = useContext(AppContext)

  return (
    <div className="relative w-full overflow-hidden bg-[#f7faf9]">
      {/* Faint graph-paper texture — evokes a lab notebook / batch ledger, not decorative gradient noise */}
      <div
        className="absolute inset-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#0f2d4a08 1px, transparent 1px), linear-gradient(90deg, #0f2d4a08 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6 md:px-10 py-20 md:py-28 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Left: headline */}
        <div>
          <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full border border-[#009688]/25 bg-[#009688]/5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#009688]" />
            <span className="text-[11px] font-mono font-medium tracking-wider text-[#00786a] uppercase">
              Verified Supply Chain Network
            </span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-[#0f2d4a] tracking-tight leading-[1.05]">
            Wholesale pharmacy
            <br />
            procurement, <span className="text-[#009688]">accounted for.</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed max-w-lg">
            Every batch tracked to its expiry, every invoice split to the last rupee of CGST/SGST, every delivery confirmed at the door. Built for pharmacies that can't afford to guess.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            {isLoggedIn ? (
              <Link
                to="/dashboard"
                className="px-7 py-3.5 bg-[#009688] hover:bg-[#00786a] text-white font-semibold text-sm rounded-lg shadow-sm shadow-[#009688]/20 transition-colors"
              >
                Go to Dashboard →
              </Link>
            ) : (
              <Link
                to="/register-org"
                className="px-7 py-3.5 bg-[#009688] hover:bg-[#00786a] text-white font-semibold text-sm rounded-lg shadow-sm shadow-[#009688]/20 transition-colors"
              >
                Get Started
              </Link>
            )}
            <Link
              to="/catalog"
              className="px-7 py-3.5 text-sm font-semibold text-[#0f2d4a] hover:text-[#009688] transition-colors"
            >
              Browse the catalog →
            </Link>
          </div>

          <div className="mt-12 flex items-center gap-8 text-sm">
            <div>
              <p className="font-display text-2xl font-semibold text-[#0f2d4a]">4,200+</p>
              <p className="text-xs text-slate-500 mt-0.5">Verified outlets</p>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <p className="font-display text-2xl font-semibold text-[#0f2d4a]">&lt;24h</p>
              <p className="text-xs text-slate-500 mt-0.5">Average dispatch</p>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <p className="font-display text-2xl font-semibold text-[#0f2d4a]">99.8%</p>
              <p className="text-xs text-slate-500 mt-0.5">Supply line uptime</p>
            </div>
          </div>
        </div>

        {/* Right: signature element — a real batch manifest / invoice specimen, not a generic illustration */}
        <div className="relative flex items-center justify-center py-8">
          {/* Back card, offset for depth */}
          <div className="absolute w-[300px] sm:w-[340px] h-[380px] bg-white border border-slate-200 rounded-2xl rotate-[-6deg] translate-x-6 translate-y-4 shadow-sm" />

          {/* Front card — the specimen */}
          <div className="relative w-[300px] sm:w-[340px] bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/5 rotate-[3deg] p-6">
            <div className="flex items-center justify-between mb-5">
              <span className="text-[10px] font-mono font-semibold tracking-widest text-slate-400 uppercase">
                Batch Manifest
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Verified
              </span>
            </div>

            <p className="font-display text-base font-semibold text-[#0f2d4a] mb-4">
              Amoxicillin 500mg <span className="text-slate-400 font-normal text-sm">· 10×10</span>
            </p>

            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs mb-4">
              <div>
                <p className="text-slate-400 text-[10px] uppercase tracking-wider mb-0.5">Batch No.</p>
                <p className="font-mono font-semibold text-[#0f2d4a]">BN-2847X</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] uppercase tracking-wider mb-0.5">Expiry</p>
                <p className="font-mono font-semibold text-[#0f2d4a]">08 / 2027</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] uppercase tracking-wider mb-0.5">HSN</p>
                <p className="font-mono font-semibold text-[#0f2d4a]">3004</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] uppercase tracking-wider mb-0.5">Invoice</p>
                <p className="font-mono font-semibold text-[#0f2d4a]">INV-88213</p>
              </div>
            </div>

            <div className="border-t border-dashed border-slate-200 pt-3 flex justify-between text-xs mb-4">
              <span className="text-slate-500">CGST 6% + SGST 6%</span>
              <span className="font-mono font-semibold text-[#0f2d4a]">₹142.80</span>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Delivery Code</span>
              <span className="font-mono font-bold text-sm text-amber-800 tracking-widest">482913</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hero