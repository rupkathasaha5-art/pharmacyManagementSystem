import React, { useState } from 'react' // Imported useState to track the toggle
import { assets } from '../assets/assets.js'
import { Link, NavLink } from 'react-router-dom'
import { FiShoppingCart, FiMenu, FiX,FiSearch } from "react-icons/fi"; // Imported FiX for a close button

const Navbar = () => {
  // State to track whether the mobile menu is open or closed
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Helper function to handle closing the menu when clicking a link
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div className='relative w-full text-white font-medium'>
      
      {/* --- Main Desktop/Mobile Header Bar --- */}
      <div className='flex items-center justify-between py-5 bg-teal-500 px-6 w-full'>
        
        {/* Left Area: Logo and Brand Group */}
        <div className='flex items-center gap-3'>
          <img 
            src={assets.logo} 
            className='w-14 h-14 rounded-full object-cover' 
            alt="logo" 
          />
          <div className='text-lg sm:text-xl md:text-2xl font-semibold tracking-tight'>PharmaStream</div>
        </div>

        {/* Middle Area: Core Platform Navigation (Hidden on Mobile) */}
        <ul className='hidden sm:flex gap-5 text-sm'>
          <NavLink to='/' className='flex flex-col items-center gap-1 group'>
            <p>HOME</p>
            <hr className='bg-teal-700 w-2/4 border-none h-[1.5px] opacity-0 group-hover:opacity-100 transition-opacity' />
          </NavLink>
          <NavLink to='/catalog' className='flex flex-col items-center gap-1 group'>
            <p>CATALOG</p>
            <hr className='bg-teal-700 w-2/4 border-none h-[1.5px] opacity-0 group-hover:opacity-100 transition-opacity' />
          </NavLink>
          <NavLink to='/about' className='flex flex-col items-center gap-1 group'>
            <p>ABOUT</p>
            <hr className='bg-teal-700 w-2/4 border-none h-[1.5px] opacity-0 group-hover:opacity-100 transition-opacity' />
          </NavLink>
          <NavLink to='/contact' className='flex flex-col items-center gap-1 group'>
            <p>CONTACT</p>
            <hr className='bg-teal-700 w-2/4 border-none h-[1.5px] opacity-0 group-hover:opacity-100 transition-opacity' />
          </NavLink>
        </ul>

        {/* Right Area: Actions, Utilities, and Auth status items */}
        <div className='flex items-center gap-6'>
          <div className='cursor-pointer text-white hover:text-slate-200 transition-colors'>
              <FiSearch className="w-6 h-6" />
        </div>

          {/* Desktop Auth Links Area (Hidden on Mobile) */}
          <ul className='hidden sm:flex items-center gap-5 text-sm'>
            <NavLink to='/login' className='flex flex-col items-center gap-1 group'>
              <p>LOGIN</p>
              <hr className='bg-teal-700 w-2/4 border-none h-[1.5px] opacity-0 group-hover:opacity-100 transition-opacity' />
            </NavLink>

            <NavLink to='/logout' className='flex flex-col items-center gap-1 group'>
              <p>LOGOUT</p>
              <hr className='bg-teal-700 w-2/4 border-none h-[1.5px] opacity-0 group-hover:opacity-100 transition-opacity' />
            </NavLink>

            {/* Registration Sub-Dropdown Node Container */}
            <div className='group relative cursor-pointer'>
              <p className='pb-2'>REGISTER</p>
              <div className='group-hover:block hidden absolute dropdown-menu right-0 pt-4 z-50'>
                <div className='flex flex-col gap-2 w-36 py-3 px-5 bg-slate-300 rounded text-slate-800 shadow-md'>
                  <Link to='/register-org' className='hover:text-teal-600 transition-colors'>Org</Link>
                  <Link to='/register-user' className='hover:text-teal-600 transition-colors'>User</Link>
                </div>
              </div>
            </div>
          </ul>

          {/* Shopping Cart Layout Link Block */}
          <Link to='/cart' className='relative'>
            <div className="relative cursor-pointer text-white hover:text-slate-200 transition-colors">
              <FiShoppingCart className="w-7 h-7" />
              <span className="absolute -right-1.5 -top-1.5 bg-yellow-500 text-slate-900 text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                0
              </span>
            </div>
          </Link>

          {/* Mobile Sidebar/Menu Trigger Button (Clicking toggles state) */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            className="block sm:hidden text-white hover:text-slate-200 transition-colors z-50"
          >
            {isMenuOpen ? <FiX className="w-7 h-7" /> : <FiMenu className="w-7 h-7" />}
          </button>

        </div>
      </div>

      {/* --- Full Screen Mobile Dropdown Overlay --- */}
      <div className={`absolute top-full left-0 w-full bg-teal-600 border-t border-teal-400 z-40 transition-all duration-300 transform origin-top ${isMenuOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'} sm:hidden shadow-lg`}>
        <div className='flex flex-col p-6 gap-4 text-base tracking-wide'>
          <NavLink to='/' onClick={closeMenu} className='border-b border-teal-500 pb-2 hover:text-teal-200'>HOME</NavLink>
          <NavLink to='/catalog' onClick={closeMenu} className='border-b border-teal-500 pb-2 hover:text-teal-200'>CATALOG</NavLink>
          <NavLink to='/about' onClick={closeMenu} className='border-b border-teal-500 pb-2 hover:text-teal-200'>ABOUT</NavLink>
          <NavLink to='/contact' onClick={closeMenu} className='border-b border-teal-500 pb-2 hover:text-teal-200'>CONTACT</NavLink>
          <NavLink to='/login' onClick={closeMenu} className='border-b border-teal-500 pb-2 hover:text-teal-200'>LOGIN</NavLink>
          <NavLink to='/logout' onClick={closeMenu} className='border-b border-teal-500 pb-2 hover:text-teal-200'>LOGOUT</NavLink>
          
          <div className='flex flex-col gap-2 pt-2'>
            <span className='text-xs text-teal-200 font-bold tracking-widest uppercase'>Register Account</span>
            <Link to='/register-org' onClick={closeMenu} className='pl-3 border-l-2 border-yellow-400 hover:text-teal-200'>Organization (Org)</Link>
            <Link to='/register-user' onClick={closeMenu} className='pl-3 border-l-2 border-yellow-400 hover:text-teal-200'>Individual User</Link>
          </div>
        </div>
      </div>

    </div>
  )
}

export default Navbar