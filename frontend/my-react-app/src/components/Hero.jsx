import React from 'react'
import { assets } from '../assets/assets.js'

const Hero = () => {
  return (
    // Parent wrapper: Stacks items vertically on mobile, switches to horizontal row at the 'md' breakpoint
    <div className='w-full flex flex-col md:flex-row bg-teal-100 min-h-[75vh] items-center overflow-hidden'>
      
      {/* Left Text Block Container */}
      {/* Takes 100% width on mobile, and drops back to 50% width (w-1/2) on tablet/desktop */}
      <div className='w-full md:w-1/2 flex items-center justify-center'>
        {/* Fixed: Replaced 'p-15' with valid, responsive padding scales */}
        <div className='p-8 sm:p-12 lg:p-16 flex flex-col justify-center'>
          <h1 className='text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-800 tracking-tight leading-tight'>
            The Leading B2B Pharmacy <br className="hidden lg:block"/> E-Commerce Platform
          </h1>
          
          {/* Responsive body text: Slightly smaller on mobile to preserve layout flow */}
          <p className='pt-5 text-base sm:text-lg md:text-xl text-slate-600 font-normal leading-relaxed max-w-xl'>
            Streamline procurement, optimize inventory, and scale your business with the ultimate digital supply chain solution for modern pharmacies.
          </p>

          {/* Quick CTA Button row to fill standard layout requirements */}
          <div className="flex gap-4 pt-6">
            <button className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg shadow transition-colors text-sm sm:text-base">
              Get Started
            </button>
          </div>
        </div>
      </div>

      {/* Right Visual Image Container */}
      {/* Takes 100% width on mobile, drops to 50% width on desktop platforms */}
      <div className='w-full md:w-1/2 h-full flex items-center justify-center'>
        {/* Fixed: Responsive height balancing so it doesn't swallow mobile viewport windows */}
        <img 
          src={assets.logo} 
          alt="PharmaStream Presentation" 
          className='h-[35vh] sm:h-[45vh] md:h-[60vh] w-full object-contain [mask-image:radial-gradient(circle,_black_60%,_transparent_100%)]'
        />
      </div>

    </div>
  )
}

export default Hero