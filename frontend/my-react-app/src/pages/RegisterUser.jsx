import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext.jsx';

const RegisterUser = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { backendUrl, setIsLoggedIn, setUserData } = useContext(AppContext);

  const currentState = location.pathname.includes('login') ? 'login' : 'register';

  // 1. Extract the passed corporate data parameters safely from institutional routing steps
  const passedOrgId = location.state?.orgId || '';
  const passedOrgName = location.state?.orgName || '';

  const [formData, setFormData] = useState({
    name: '',
    org: passedOrgId, 
    phone:'',
    email: '',
    password: '',
   
    role: passedOrgId ? 'ORG_ADMIN' : '' 
  });

  
  useEffect(() => {
    if (passedOrgId) {
      setFormData(prev => ({
        ...prev,
        org: passedOrgId,
        role: 'ORG_ADMIN'
      }));
    }
  }, [passedOrgId]);

  const [uiState, setUiState] = useState({
    isLoading: false,
    errorMessage: '',
    successMessage: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setUiState({ isLoading: true, errorMessage: '', successMessage: '' });

    try {
      axios.defaults.withCredentials = true;

      if (currentState === 'register') {
        console.log("Sending structured registration payload:", formData);
        const { data } = await axios.post(`${backendUrl}/api/v1/users/register-user`, formData);

        if (data.success) {
          
          setUserData(data.user || data.data?.user);
          setIsLoggedIn(true);
          
          setUiState({
            isLoading: false,
            errorMessage: '',
            successMessage: `Operational Profile for ${formData.name} successfully provisioned.`
          });
          
          // Redirect admin users with warning message if organization profile is still pending validation checks
          if (formData.role === 'admin') {
            alert("Administrative account successfully saved! Your dashboard will activate as soon as a SuperAdmin verifies your corporate license credentials.");
            navigate('/');
          } else {
            navigate('/dashboard'); 
          }
        } else {
          setUiState({ isLoading: false, successMessage: '', errorMessage: data.message });
        }
      } else {
        // Login path pipeline execution channel
        const loginPayload = { email: formData.email, password: formData.password };
        const { data } = await axios.post(`${backendUrl}/api/v1/users/login`, loginPayload);

        if (data.success) {
          
          console.log("BACKEND PAYLOAD RESPONSE:", data.data.user);
          setUserData(data.data?.user);
          setIsLoggedIn(true);
          
          setUiState({
            isLoading: false,
            errorMessage: '',
            successMessage: `Login successful. Redirecting to workspace...` 
          });
          navigate('/dashboard');
        } else {
          setUiState({ isLoading: false, successMessage: '', errorMessage: data.message });
        }
      }
    } catch (error) {
      setUiState({
        isLoading: false,
        successMessage: '',
        errorMessage: error.response?.data?.message || error.message || 'Network degradation intercepted the request.'
      });
    }
  };

  // 2.block manual navigation to user registration without a corporate connection ID
  if (currentState === 'register' && formData.role==='ORG_ID' && !passedOrgId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="w-full max-w-md bg-white rounded-xl shadow-md border border-slate-100 p-8 space-y-4">
          <div className="text-red-500 font-bold text-xl">⚠️ Access Restricted</div>
          <p className="text-slate-600 text-sm">
            Primary Administrative enterprise profiles cannot be initialized standalone. Please compile your institutional profile first.
          </p>
          <Link to="/register-org" className="block w-full py-2.5 bg-[#00c2a8] hover:bg-teal-600 text-white font-bold rounded transition-colors text-sm uppercase tracking-wider">
            Register Corporate Organization
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans text-slate-800">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
        
        {/* Top Branding Section Layout */}
        <div className="bg-[#00c2a8] p-8 text-center text-white">
          <h2 className="text-2xl font-bold tracking-wide mb-2">PharmaStream B2B Portal</h2>
          {currentState === 'login' ? (
            <p className="text-emerald-100 text-sm mt-1 uppercase tracking-widest text-xs font-bold">Secure Access Node</p>
          ) : (
            <p className="text-emerald-100 text-sm mt-1 uppercase tracking-widest text-xs font-bold">Register Primary Administrative Desk</p>
          )}
        </div>
        
        <form onSubmit={handleFormSubmit} className="p-8 space-y-6">
          
          {/* Dynamic Error Messaging */}
          {uiState.errorMessage && (
            <div className="p-3 bg-red-50 border-l-4 border-red-600 rounded text-sm text-red-800 font-medium">
              <strong>Action Blocked:</strong> {uiState.errorMessage}
            </div>
          )}

          {/* Dynamic Success Messaging */}
          {uiState.successMessage && (
            <div className="p-3 bg-emerald-50 border-l-4 border-emerald-600 rounded text-sm text-emerald-800 font-medium">
              <strong>Authorized:</strong> {uiState.successMessage}
            </div>
          )}

          <div className="space-y-4">
            {/* Full Name field (Visible only on sign up path forms) */}
            {currentState !== 'login' && (
              <div className="animate-fadeIn">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Full Name</label>
                <input
                  required
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-[#00c2a8] text-sm bg-white font-medium"
                />
              </div>
            )}

            {/* Pre-filled and Disabled Corporate Entity Allocation field */}
            {currentState !== 'login' && passedOrgId && (
              <div className="animate-fadeIn">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Associated Organization</label>
                <input
                  disabled
                  type="text"
                  value={passedOrgName} 
                  className="w-full px-3 py-2 border border-slate-200 rounded text-sm bg-slate-100 text-slate-500 cursor-not-allowed font-semibold"
                />
              </div>
            )}
            
           
            {currentState !== 'login' && (
              <div >
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Contact Number</label>
                <input
                  required
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-[#00c2a8] text-sm bg-white font-medium"
                />
              </div>
            )}

            {/* Email field */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Company Email</label>
              <input
                required
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-[#00c2a8] text-sm bg-white font-medium"
              />
            </div>

            {/* Password field */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Password</label>
              <input
                required
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-[#00c2a8] text-sm bg-white font-medium"
                minLength={8}
              />
            </div>
            
            {/* Guarded Static Role Identity Dropdown Verification selection element */}
            {currentState !== 'login' && (
              <div className="animate-fadeIn">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">System Access Role</label>
                <select
  name="role"
  value={formData.role}
  onChange={handleInputChange} 
  disabled={!!passedOrgId} // Only lock the dropdown if they have a passedOrgId
  className={`w-full px-3 py-2 border rounded text-sm font-bold appearance-none uppercase tracking-wider text-xs ${
    passedOrgId 
      ? 'border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed' 
      : 'border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#00c2a8]'
  }`}
>
  <option value="" disabled>-- Select a Role --</option>
  <option value="ORG_ADMIN">ORG_ADMIN</option>
  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
  <option value="DRIVER">DRIVER</option>
</select>
              </div>
            )}
          </div>
          
          {/* Main Context Action Submit Button Trigger Element */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={uiState.isLoading}
              className={`w-full py-2.5 rounded text-sm font-bold text-white transition-all uppercase tracking-wider shadow-sm ${
                uiState.isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#00c2a8] hover:bg-teal-600 active:scale-[0.99]'
              }`}
            >
              {uiState.isLoading ? 'Processing...' : (currentState === 'login' ? 'Login' : 'Register')}
            </button>
          </div>

          {/* Inline Toggling Navigation links */}
          <div className="text-center pt-4 border-t border-slate-100 mt-2">
            <p className="text-sm text-slate-500">
              {currentState === "login" ? (
                <>
                  New corporate partner?{" "}
                  <Link to="/register-org" className="text-[#00c2a8] font-bold hover:underline cursor-pointer">
                    Register Entity
                  </Link>
                </>
              ) : (
                <>
                  Already registered?{" "}
                  <Link to="/login" className="text-[#00c2a8] font-bold hover:underline cursor-pointer">
                    Login Here
                  </Link>
                </>
              )}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterUser;