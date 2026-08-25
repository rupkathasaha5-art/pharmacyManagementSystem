import React from 'react';
import { Link } from 'react-router-dom';

const PILLARS = [
  {
    label: 'Verified Network',
    title: 'Every buyer is KYC-checked before they trade',
    desc: 'GSTIN, drug license number, and expiry are verified before an account can place a single order. Licenses that lapse are flagged automatically.',
  },
  {
    label: 'Batch & Expiry Intelligence',
    title: 'Stock is triaged by shelf life, not just by count',
    desc: 'Every batch is classified daily by days-to-expiry — sellable stock, discounted clearance stock, and stock returned to the manufacturer before it ever reaches a shelf.',
  },
  {
    label: 'Trade Credit & Invoicing',
    title: 'Net-14 terms with GST worked out to the rupee',
    desc: 'CGST, SGST, and IGST are split correctly on every line item, credit limits are enforced automatically, and overdue accounts are frozen without anyone needing to chase it manually.',
  },
  {
    label: 'Tracked Delivery',
    title: 'A code confirms the handoff, not a guess',
    desc: 'Every dispatched order carries a delivery code printed on its invoice. The driver enters it at the door — that\u2019s what closes the order, not a phone call after the fact.',
  },
];

const LIFECYCLE = [
  { step: 'Placed', detail: 'Order confirmed against available trade credit or paid upfront.' },
  { step: 'Out for Delivery', detail: 'Assigned to a driver, invoice generated with its delivery code.' },
  { step: 'Delivered', detail: 'Driver enters the code on-site — the order closes itself.' },
];

const About = () => {
  return (
    <div className="bg-[#f7faf9]">
      {/* Intro */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.4] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(#0f2d4a08 1px, transparent 1px), linear-gradient(90deg, #0f2d4a08 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">
          <p className="text-[11px] font-mono font-semibold uppercase tracking-widest text-[#009688] mb-4">
            About PharmaStream
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#0f2d4a] tracking-tight leading-tight">
            Wholesale pharmacy has no room for a spreadsheet and a hope.
          </h1>
          <p className="mt-5 text-base text-slate-600 leading-relaxed">
            A batch a day too late is a write-off. An invoice split wrong is a GST notice.
            A delivery no one confirmed is a dispute. PharmaStream exists to make each of
            those things structurally hard to get wrong — for the pharmacies and hospitals
            buying, and for the distributor fulfilling.
          </p>
        </div>
      </section>

      {/* Pillars */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PILLARS.map((p) => (
            <div key={p.label} className="bg-white rounded-xl border border-slate-200 p-6">
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#009688] mb-2">
                {p.label}
              </p>
              <h3 className="font-display text-lg font-semibold text-[#0f2d4a] mb-2 leading-snug">
                {p.title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Order lifecycle — a real sequence, so the numbering carries information */}
      <section className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-[11px] font-mono font-semibold uppercase tracking-widest text-[#009688] mb-2 text-center">
            How an order actually moves
          </p>
          <h2 className="font-display text-2xl font-semibold text-[#0f2d4a] text-center mb-12">
            Three states. No ambiguity in between.
          </h2>

          <div className="flex flex-col sm:flex-row items-stretch gap-4">
            {LIFECYCLE.map((item, idx) => (
              <React.Fragment key={item.step}>
                <div className="flex-1 bg-[#f7faf9] border border-slate-200 rounded-xl p-5">
                  <span className="font-mono text-xs text-slate-400">0{idx + 1}</span>
                  <h3 className="font-display text-base font-semibold text-[#0f2d4a] mt-1 mb-1.5">
                    {item.step}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.detail}</p>
                </div>
                {idx < LIFECYCLE.length - 1 && (
                  <div className="hidden sm:flex items-center text-slate-300 text-xl px-1">→</div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <p className="font-display text-3xl font-semibold text-[#0f2d4a]">4,200+</p>
            <p className="text-xs text-slate-500 mt-1">Verified outlets on the network</p>
          </div>
          <div>
            <p className="font-display text-3xl font-semibold text-[#0f2d4a]">&lt;24h</p>
            <p className="text-xs text-slate-500 mt-1">Average time to dispatch</p>
          </div>
          <div>
            <p className="font-display text-3xl font-semibold text-[#0f2d4a]">99.8%</p>
            <p className="text-xs text-slate-500 mt-1">Supply line uptime</p>
          </div>
        </div>
      </section>

      {/* Close */}
      <section className="max-w-2xl mx-auto px-6 pb-24 text-center">
        <h2 className="font-display text-xl font-semibold text-[#0f2d4a] mb-3">
          Built for the people accountable for what ships.
        </h2>
        <p className="text-sm text-slate-500 mb-8">
          If you're procuring for a pharmacy or hospital, or distributing to one, this is
          the ledger built for the job.
        </p>
        <Link
          to="/register-org"
          className="inline-block px-7 py-3 bg-[#009688] hover:bg-[#00786a] text-white font-semibold text-sm rounded-lg shadow-sm shadow-[#009688]/20 transition-colors"
        >
          Get Started
        </Link>
      </section>
    </div>
  );
};

export default About;