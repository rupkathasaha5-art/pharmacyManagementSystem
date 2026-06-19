import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 
import { AppContext } from '../context/AppContext.jsx';

const RegisterOrganization = () => {
  const { backendUrl } = useContext(AppContext);
  const navigate = useNavigate(); 

  // Unified state tracking the simplified business payload structure
  const [formData, setFormData] = useState({
    organizationName: '',
    taxId: '',
    corporatePhone: '',
    corporateEmail: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    licenseNumber: '',
    licenseExpiryDate: ''
  });

  const [uiState, setUiState] = useState({
    isLoading: false,
    errorMessage: '',
    successMessage: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setUiState({ isLoading: true, errorMessage: '', successMessage: '' });

    // Restructuring local flat parameters into the targeted organization API schema
    const apiPayload = {
      organization: {
        name: formData.organizationName,
        taxId: formData.taxId,
        phone: formData.corporatePhone,
        email: formData.corporateEmail,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode
        },
        license: {
          number: formData.licenseNumber,
          expiryDate: formData.licenseExpiryDate
        }
      }
    };

    try {
      // 1. Fire registration request directly to the backend URL port
      const response = await axios.post(`${backendUrl}/api/v1/org/register-org`, apiPayload);
      
      // 2. Safely parse structured ApiResponse parameters
      if (response.data && response.data.success) {
        // Extract the unique orgId returned by your backend controller execution
        const { orgId } = response.data.data;

        // Capture the explicit company name value right now before resetting inputs
        const explicitOrgName = formData.organizationName;

        setUiState({
          isLoading: false,
          errorMessage: '',
          successMessage: 'Corporate data verified! Redirecting to setup primary admin profile...'
        });
        
        // Clear input parameters cleanly
        setFormData({
          organizationName: '', taxId: '', corporatePhone: '', corporateEmail: '',
          street: '', city: '', state: '', postalCode: '',
          licenseNumber: '', licenseExpiryDate: ''
        });

        // 3. Programmatically transition them to create their user profile account, 
        
        setTimeout(() => {
          navigate('/register-user', { 
            state: { 
              orgId: orgId, 
              orgName: explicitOrgName 
            } 
          });
        }, 3000);
      }
    } catch (error) {
      // 4. Extract explicit validation feedback messaging passed down via your ApiError layout
      const extractedMessage = error.response?.data?.message || error.message || 'A network exception dropped your registration sequence.';
      
      setUiState({
        isLoading: false,
        successMessage: '',
        errorMessage: extractedMessage
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        
        {/* Header Branding Panel */}
        <div className="bg-teal-500 p-6 text-white">
          <h2 className="text-2xl font-bold tracking-tight">PharmaStream B2B Portal</h2>
          <p className="text-emerald-100 text-sm mt-1">Initialize your corporate platform profiles. System access parameters will unlock subsequent to credential verification.</p>
        </div>

        <form onSubmit={handleFormSubmit} className="p-8 space-y-8">
          
          {/* Status Context Banners */}
          {uiState.errorMessage && (
            <div className="p-4 bg-red-50 border-l-4 border-red-600 rounded text-sm text-red-800">
              <strong>Registration Blocked:</strong> {uiState.errorMessage}
            </div>
          )}
          {uiState.successMessage && (
            <div className="p-4 border-l-4 bg-emerald-50 border-emerald-600 rounded text-sm text-emerald-800">
              <strong>Action Verified:</strong> {uiState.successMessage}
            </div>
          )}

          {/* SECTION 1: Corporate Profile */}
          <div>
            <h3 className="text-sm font-bold text-teal-500 uppercase tracking-wider border-b border-slate-200 pb-2 mb-4">
              1. Corporate Profile Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Legal Entity Name</label>
                <input required type="text" name="organizationName" value={formData.organizationName} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-emerald-600 text-sm" placeholder="e.g. Apex Pharmacy Corp" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Corporate Tax ID / Registration Code</label>
                <input required type="text" name="taxId" value={formData.taxId} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-emerald-600 text-sm" placeholder="e.g. DELA12345E" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Corporate Phone</label>
                <input required type="tel" name="corporatePhone" value={formData.corporatePhone} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-emerald-600 text-sm" placeholder="+91 (011) 4123-4567" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Corporate Procurement Email</label>
                <input required type="email" name="corporateEmail" value={formData.corporateEmail} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-emerald-600 text-sm" placeholder="procurement@company.com" />
              </div>
            </div>
          </div>

          {/* SECTION 2: Legal Credentials */}
          <div>
            <h3 className="text-sm font-bold text-teal-500 uppercase tracking-wider border-b border-slate-200 pb-2 mb-4">
              2. Regulatory Compliance Credentials
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Drug License Identification Number</label>
                <input required type="text" name="licenseNumber" value={formData.licenseNumber} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-emerald-600 text-sm" placeholder="e.g. DL-2026-X" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">License Expiration Milestone Date</label>
                <input required type="date" name="licenseExpiryDate" value={formData.licenseExpiryDate} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-emerald-600 text-sm" />
              </div>
            </div>
          </div>

          {/* SECTION 3: Physical Address Coordinates */}
          <div>
            <h3 className="text-sm font-bold text-teal-500 uppercase tracking-wider border-b border-slate-200 pb-2 mb-4">
              3. Logistical & Physical Shipping Coordinates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address</label>
                <input required type="text" name="street" value={formData.street} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-emerald-600 text-sm" placeholder="100 Medical Plaza, Suite 4" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                <input required type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-emerald-600 text-sm" placeholder="New Delhi" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">State / Region</label>
                <input required type="text" name="state" value={formData.state} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-emerald-600 text-sm" placeholder="DL" />
              </div>
              <div className="md:col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Postal Code</label>
                <input required type="text" name="postalCode" value={formData.postalCode} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-emerald-600 text-sm" placeholder="110001" />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button
              type="submit"
              disabled={uiState.isLoading}
              className={`px-6 py-2.5 rounded text-sm font-bold text-white transition-colors duration-200 ${
                uiState.isLoading
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-teal-500 hover:bg-emerald-800 shadow-sm'
              }`}
            >
              {uiState.isLoading ? 'Processing Ingestion...' : 'Submit Profile'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default RegisterOrganization;