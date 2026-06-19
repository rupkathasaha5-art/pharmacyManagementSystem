import React from 'react';

const TrustedPartners = () => {
  // 8 realistic, high-quality B2B pharmaceutical client profiles
  const organizations = [
    { id: 1, name: "Apex Global Health", type: "Hospital Network" },
    { id: 2, name: "MedX Pharmacy", type: "Retail Chain" },
    { id: 3, name: "St. Jude Clinical Center", type: "Medical Center" },
    { id: 4, name: "Beacon Pharmacy Group", type: "Retail Chain" },
    { id: 5, name: "Vanguard Life Care", type: "Hospital System" },
    { id: 6, name: "CareFirst Medic", type: "Retail Store" },
    { id: 7, name: "Horizon General Hospital", type: "Regional Care" },
    { id: 8, name: "OmniRx Pharma", type: "Retail Chain" }
  ];

  return (
    <section className="bg-slate-50 py-16 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Section Typography Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h3 className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-2">
            Trusted Infrastructure
          </h3>
          <p className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Powering Procurement for Leading Medical Networks
          </p>
          <p className="text-sm text-slate-500 mt-2">
            From regional critical care hospitals to high-volume pharmaceutical retail dispensaries.
          </p>
        </div>

        {/* 8-Grid Organization Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {organizations.map((org) => (
            <div
              key={org.id}
              className="group relative bg-white border border-slate-200 rounded-xl p-5 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md hover:border-teal-500/30 transition-all duration-300"
            >
              {/* Minimalist Medical Geometric Placeholder Logo */}
              <div className="mb-3 h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors duration-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0V9a2 2 0 012-2h2a2 2 0 012 2v12m-6 0h6" />
                </svg>
              </div>

              {/* Organization Profile Text */}
              <h4 className="text-sm font-bold text-slate-800 group-hover:text-teal-600 transition-colors duration-200">
                {org.name}
              </h4>
              <span className="text-[11px] font-medium tracking-wider uppercase text-slate-400 mt-1 bg-slate-50 px-2 py-0.5 rounded group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors duration-200">
                {org.type}
              </span>
            </div>
          ))}
        </div>

        {/* Live Marketplace Statistics Sub-bar */}
        <div className="mt-12 pt-8 border-t border-slate-200/60 flex flex-wrap justify-center items-center gap-x-12 gap-y-4 text-center">
          <div>
            <span className="text-xl font-bold text-slate-900">4,200+</span>
            <span className="text-xs text-slate-500 ml-2">Verified Outlets</span>
          </div>
          <div className="hidden sm:block h-4 w-px bg-slate-300"></div>
          <div>
            <span className="text-xl font-bold text-slate-900">99.8%</span>
            <span className="text-xs text-slate-500 ml-2">Supply Line Uptime</span>
          </div>
          <div className="hidden sm:block h-4 w-px bg-slate-300"></div>
          <div>
            <span className="text-xl font-bold text-slate-900">&lt; 24h</span>
            <span className="text-xs text-slate-500 ml-2">Average Dispatch</span>
          </div>
        </div>

      </div>
    </section>
  );
};

export default TrustedPartners;