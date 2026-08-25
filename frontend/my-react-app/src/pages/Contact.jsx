import React from 'react';

const Contact = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-[#0f2d4a] sm:text-4xl">Contact PharmaStream</h1>
          <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
            Have questions about our B2B wholesale platform, API integrations, or your trade credit limits? Reach out to the platform administration directly.
          </p>
        </div>

        {/* Contact Information Card */}
        <div className="bg-[#0f2d4a] rounded-2xl shadow-lg border border-slate-200 overflow-hidden p-10 sm:p-12 text-white">
          <h3 className="text-2xl font-bold mb-6 text-[#00c4a7]">Direct Administration</h3>
          <p className="text-slate-300 mb-10 text-sm leading-relaxed max-w-2xl">
            PharmaStream is directly managed by our Super Admin. For urgent platform issues, account verification, or vendor onboarding, please reach out via the provided email address.
          </p>

          <div className="space-y-8">
            {/* Name */}
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-1 bg-[#0f2d4a] p-2 rounded-lg border border-slate-700">
                <svg className="w-6 h-6 text-[#00c4a7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Platform Administrator</p>
                <p className="text-lg font-semibold text-white mt-1">Satyaroop Chattopadhyay</p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-1 bg-[#0f2d4a] p-2 rounded-lg border border-slate-700">
                <svg className="w-6 h-6 text-[#00c4a7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Email Address</p>
                <a href="mailto:satya@gmail.com" className="text-lg font-semibold text-white mt-1 hover:text-[#00c4a7] transition-colors">
                  satya@gmail.com
                </a>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-1 bg-[#0f2d4a] p-2 rounded-lg border border-slate-700">
                <svg className="w-6 h-6 text-[#00c4a7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Headquarters</p>
                <p className="text-lg font-semibold text-white mt-1">Dhanbad, Jharkhand<br/>India</p>
              </div>
            </div>
          </div>

          {/* Decorative Tech Pattern */}
          <div className="mt-12 pt-8 border-t border-slate-700/50">
            <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">SYSTEM // SUPER_ADMIN // STATUS: ACTIVE</p>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default Contact;