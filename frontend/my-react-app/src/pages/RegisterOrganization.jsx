
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

  // Holds the actual PDF File object selected by the user (kept separate from
  // formData since a File object doesn't belong in a flat text-only state)
  const [licenseFile, setLicenseFile] = useState(null);
  const [fileError, setFileError] = useState('');

  // IMPROVEMENT 1: Added 'isRedirecting' to prevent double-submissions during navigation delay
  const [uiState, setUiState] = useState({
    isLoading: false,
    isRedirecting: false,
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

  // Validates and stores the selected license PDF
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFileError('');

    if (!file) {
      setLicenseFile(null);
      return;
    }

    if (file.type !== 'application/pdf') {
      setFileError('Only PDF files are accepted for the license document.');
      setLicenseFile(null);
      e.target.value = '';
      return;
    }

    // Simple 10MB cap so uploads stay reasonable
    const MAX_SIZE_BYTES = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      setFileError('File is too large. Please upload a PDF under 10MB.');
      setLicenseFile(null);
      e.target.value = '';
      return;
    }

    setLicenseFile(file);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // Guard: documentUrl is required on the backend, and the only way to get
    // one is by uploading the actual PDF for the server to store and link.
    if (!licenseFile) {
      setFileError('Please upload your Drug License PDF before submitting.');
      return;
    }

    setUiState({ isLoading: true, isRedirecting: false, errorMessage: '', successMessage: '' });

    // Restructuring local flat parameters into the targeted organization API schema
    const organizationPayload = {
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
          // documentUrl is NOT set here - the backend generates it after
          // storing the uploaded PDF (e.g. S3/Cloudinary) and saves it on the Org record
        }
      }
    };

    // Because we're sending a file, this must be multipart/form-data instead of JSON.
    // The nested organization object travels as a JSON string under "data";
    // the backend should JSON.parse(req.body.data) and read the file from req.file.
    const multipartPayload = new FormData();
    multipartPayload.append('data', JSON.stringify(organizationPayload));
    multipartPayload.append('licenseDocument', licenseFile);

    try {
      // 1. Fire registration request directly to the backend URL port
      const response = await axios.post(`${backendUrl}/api/v1/org/register-org`, multipartPayload);
      
      // 2. Safely parse structured ApiResponse parameters
      if (response.data && response.data.success) {
        // Extract the unique orgId returned by your backend controller execution
        const { orgId } = response.data.data;

        // Capture the explicit company name value right now before resetting inputs
        const explicitOrgName = formData.organizationName;

        // IMPROVEMENT 1: Set isRedirecting to true so the UI stays locked during countdown
        setUiState({
          isLoading: false,
          isRedirecting: true,
          errorMessage: '',
          successMessage: 'Corporate data verified! Redirecting to setup primary admin profile...'
        });
        
        // Clear input parameters cleanly
        setFormData({
          organizationName: '', taxId: '', corporatePhone: '', corporateEmail: '',
          street: '', city: '', state: '', postalCode: '',
          licenseNumber: '', licenseExpiryDate: ''
        });
        setLicenseFile(null);

        // 3. Programmatically transition them to create their user profile account
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
        isRedirecting: false,
        successMessage: '',
        errorMessage: extractedMessage
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        
        {/* Header Branding Panel */}
        <div className="bg-teal-600 p-6 text-white">
          <h2 className="text-2xl font-bold tracking-tight">PharmaStream B2B Portal</h2>
          <p className="text-teal-100 text-sm mt-1">Initialize your corporate platform profiles. System access parameters will unlock subsequent to credential verification.</p>
        </div>

        <form onSubmit={handleFormSubmit} className="p-8 space-y-8">
          
          {/* Status Context Banners */}
          {uiState.errorMessage && (
            <div className="p-4 bg-red-50 border-l-4 border-red-600 rounded text-sm text-red-800 animate-fadeIn">
              <strong>Registration Blocked:</strong> {uiState.errorMessage}
            </div>
          )}
          {uiState.successMessage && (
            <div className="p-4 border-l-4 bg-emerald-50 border-emerald-600 rounded text-sm text-emerald-800 animate-fadeIn">
              <strong>Action Verified:</strong> {uiState.successMessage}
            </div>
          )}

          {/* SECTION 1: Corporate Profile */}
          <div>
            <h3 className="text-sm font-bold text-teal-600 uppercase tracking-wider border-b border-slate-200 pb-2 mb-4">
              1. Corporate Profile Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Legal Entity Name</label>
                <input required type="text" name="organizationName" value={formData.organizationName} onChange={handleInputChange} disabled={uiState.isRedirecting} className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-teal-600 disabled:bg-slate-100 text-sm" placeholder="e.g. Apex Pharmacy Corp" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Corporate Tax ID / Registration Code</label>
                <input required type="text" name="taxId" value={formData.taxId} onChange={handleInputChange} disabled={uiState.isRedirecting} className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-teal-600 disabled:bg-slate-100 text-sm" placeholder="e.g. DELA12345E" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Corporate Phone</label>
                <input required type="tel" name="corporatePhone" value={formData.corporatePhone} onChange={handleInputChange} disabled={uiState.isRedirecting} className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-teal-600 disabled:bg-slate-100 text-sm" placeholder="+91 (011) 4123-4567" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Corporate Procurement Email</label>
                <input required type="email" name="corporateEmail" value={formData.corporateEmail} onChange={handleInputChange} disabled={uiState.isRedirecting} className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-teal-600 disabled:bg-slate-100 text-sm" placeholder="procurement@company.com" />
              </div>
            </div>
          </div>

          {/* SECTION 2: Legal Credentials */}
          <div>
            <h3 className="text-sm font-bold text-teal-600 uppercase tracking-wider border-b border-slate-200 pb-2 mb-4">
              2. Regulatory Compliance Credentials
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Drug License Identification Number</label>
                <input required type="text" name="licenseNumber" value={formData.licenseNumber} onChange={handleInputChange} disabled={uiState.isRedirecting} className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-teal-600 disabled:bg-slate-100 text-sm" placeholder="e.g. DL-2026-X" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">License Expiration Milestone Date</label>
                <input required type="date" name="licenseExpiryDate" value={formData.licenseExpiryDate} onChange={handleInputChange} disabled={uiState.isRedirecting} className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-teal-600 disabled:bg-slate-100 text-sm" />
              </div>

              {/* NEW: License PDF upload */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Upload Your License PDF</label>
                <input
                  required
                  type="file"
                  accept="application/pdf"
                  name="licenseDocument"
                  onChange={handleFileChange}
                  disabled={uiState.isRedirecting}
                  className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 disabled:opacity-60"
                />
                {licenseFile && !fileError && (
                  <p className="text-xs text-emerald-600 mt-1">Selected: {licenseFile.name}</p>
                )}
                {fileError && (
                  <p className="text-xs text-red-600 mt-1">{fileError}</p>
                )}
                <p className="text-[11px] text-slate-400 mt-1">PDF only, max 10MB. This is your Form 20/21 CDSCO Drug License copy.</p>
              </div>
            </div>
          </div>

          {/* SECTION 3: Physical Address Coordinates */}
          <div>
            <h3 className="text-sm font-bold text-teal-600 uppercase tracking-wider border-b border-slate-200 pb-2 mb-4">
              3. Logistical & Physical Shipping Coordinates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address</label>
                <input required type="text" name="street" value={formData.street} onChange={handleInputChange} disabled={uiState.isRedirecting} className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-teal-600 disabled:bg-slate-100 text-sm" placeholder="100 Medical Plaza, Suite 4" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                <input required type="text" name="city" value={formData.city} onChange={handleInputChange} disabled={uiState.isRedirecting} className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-teal-600 disabled:bg-slate-100 text-sm" placeholder="New Delhi" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">State / Region</label>
                <input required type="text" name="state" value={formData.state} onChange={handleInputChange} disabled={uiState.isRedirecting} className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-teal-600 disabled:bg-slate-100 text-sm" placeholder="DL" />
              </div>
              <div className="md:col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Postal Code</label>
                <input required type="text" name="postalCode" value={formData.postalCode} onChange={handleInputChange} disabled={uiState.isRedirecting} className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-teal-600 disabled:bg-slate-100 text-sm" placeholder="110001" />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end pt-4 border-t border-slate-200">
            {/* IMPROVEMENT 2 & 1: Smoother hover transition + dynamic text handling redirect state */}
            <button
              type="submit"
              disabled={uiState.isLoading || uiState.isRedirecting}
              className={`px-6 py-2.5 rounded text-sm font-bold text-white transition-colors duration-200 ${
                uiState.isLoading || uiState.isRedirecting
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-teal-600 hover:bg-teal-700 shadow-sm'
              }`}
            >
              {uiState.isLoading 
                ? 'Processing Ingestion...' 
                : uiState.isRedirecting 
                  ? 'Redirecting...' 
                  : 'Submit Profile'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default RegisterOrganization;
