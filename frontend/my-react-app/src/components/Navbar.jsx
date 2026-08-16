import React, { useState, useContext } from 'react';
import { assets } from '../assets/assets.js';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiMenu, FiX, FiSearch } from "react-icons/fi";
import axios from 'axios';
import { AppContext } from '../context/AppContext.jsx';

const Navbar = () => {
  
  const { backendUrl, isLoggedIn, setIsLoggedIn, setUserData, userData, totalCartItems } = useContext(AppContext);
  const navigate = useNavigate();

  
  const [isMenuOpen, setIsMenuOpen] = useState(false);

 
  const closeMenu = () => setIsMenuOpen(false);

  // --- LOGOUT FUNCTION ---
  const handleLogout = async () => {
    try {
        // Step 1: Tell the backend to kill the session and clear HTTP cookies
        await axios.post(
            `${backendUrl}/api/v1/users/logout`, 
            {}, 
            { withCredentials: true } 
        );
    } catch (error) {
        console.error("Server-side logout failed. Clearing local state anyway.", error);
    } finally {
        // Step 2: Wipe Local Storage completely clean
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userData');

        // Step 3: Reset React Context State
        setIsLoggedIn(false);
        setUserData(null);

        // Step 4: Close mobile menu (if open) and redirect
        closeMenu();
        navigate('/login'); 
    }
  };

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
            
            {/* Conditional Rendering based on Auth State */}
            {!isLoggedIn ? (
                <>
                    <NavLink to='/login' className='flex flex-col items-center gap-1 group'>
                      <p>LOGIN</p>
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
                </>
            ) : (
                // Logout Button (Replaced NavLink)
                <button onClick={handleLogout} className='flex flex-col items-center gap-1 group cursor-pointer focus:outline-none'>
                  <p>LOGOUT</p>
                  <hr className='bg-teal-700 w-2/4 border-none h-[1.5px] opacity-0 group-hover:opacity-100 transition-opacity' />
                </button>
            )}

          </ul>

          {/* Shopping Cart Layout Link Block */}
          {isLoggedIn && userData?.role === 'ORG_ADMIN' && (
  <Link to='/cart' className='relative'>
    <div className="relative cursor-pointer text-white hover:text-slate-200 transition-colors">
      <FiShoppingCart className="w-7 h-7" />
      <span className="absolute -right-1.5 -top-1.5 bg-yellow-500 text-slate-900 text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
        {totalCartItems}
      </span>
    </div>
  </Link>
)}

          {/* Mobile Sidebar/Menu Trigger Button (Clicking toggles state) */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            className="block sm:hidden text-white hover:text-slate-200 transition-colors z-50 focus:outline-none"
          >
            {isMenuOpen ? <FiX className="w-7 h-7" /> : <FiMenu className="w-7 h-7" />}
          </button>

        </div>
      </div>

      {/*Full Screen Mobile Dropdown Overlay */}
      <div className={`absolute top-full left-0 w-full bg-teal-600 border-t border-teal-400 z-40 transition-all duration-300 transform origin-top ${isMenuOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'} sm:hidden shadow-lg`}>
        <div className='flex flex-col p-6 gap-4 text-base tracking-wide'>
          <NavLink to='/' onClick={closeMenu} className='border-b border-teal-500 pb-2 hover:text-teal-200'>HOME</NavLink>
          <NavLink to='/catalog' onClick={closeMenu} className='border-b border-teal-500 pb-2 hover:text-teal-200'>CATALOG</NavLink>
          <NavLink to='/about' onClick={closeMenu} className='border-b border-teal-500 pb-2 hover:text-teal-200'>ABOUT</NavLink>
          <NavLink to='/contact' onClick={closeMenu} className='border-b border-teal-500 pb-2 hover:text-teal-200'>CONTACT</NavLink>
          
          {/* Conditional Mobile Rendering */}
          {!isLoggedIn ? (
              <>
                <NavLink to='/login' onClick={closeMenu} className='border-b border-teal-500 pb-2 hover:text-teal-200'>LOGIN</NavLink>
                <div className='flex flex-col gap-2 pt-2'>
                  <span className='text-xs text-teal-200 font-bold tracking-widest uppercase'>Register Account</span>
                  <Link to='/register-org' onClick={closeMenu} className='pl-3 border-l-2 border-yellow-400 hover:text-teal-200'>Organization (Org)</Link>
                  <Link to='/register-user' onClick={closeMenu} className='pl-3 border-l-2 border-yellow-400 hover:text-teal-200'>Individual User</Link>
                </div>
              </>
          ) : (
              // Mobile Logout Button
              <button 
                onClick={handleLogout} 
                className='text-left border-b border-teal-500 pb-2 hover:text-teal-200 focus:outline-none'
              >
                LOGOUT
              </button>
          )}

        </div>
      </div>

    </div>
  )
}

export default Navbar;