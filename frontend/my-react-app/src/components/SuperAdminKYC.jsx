import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AppContext } from '../context/AppContext.jsx';

const SuperAdminKYC = () => {
  const { backendUrl, isLoggedIn, userData } = useContext(AppContext);
  
  const [pendingOrgs, setPendingOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [rejectionModalId, setRejectionModalId] = useState(null);
  const [remarksInput, setRemarksInput] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchPendingOrgs = async () => {
    if (!isLoggedIn || userData?.role !== 'SUPER_ADMIN') {
      setError('Unauthorized access context.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${backendUrl}/api/v1/users/kyc/pending`, { withCredentials: true });
      if (response.data && response.data.success) {
        setPendingOrgs(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch pending applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingOrgs();
  }, [backendUrl, isLoggedIn, userData]);

  const handleDownloadPdf = async (orgId, orgName) => {
    setDownloadingId(orgId);
    try {
      // Auth here rides on the httpOnly accessToken cookie set at login
      // (withCredentials), not a manually-attached Authorization header -
      // there is no token in localStorage in this app's login flow.
      const response = await axios.get(
        `${backendUrl}/api/v1/users/kyc/download-license/${orgId}`,
        {
          withCredentials: true,
          responseType: 'blob'
        }
      );

      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));

      const tempLink = document.createElement('a');
      tempLink.href = blobUrl;
      tempLink.download = `${orgName.replace(/[^a-zA-Z0-9]/g, '_')}_Drug_License.pdf`;

      document.body.appendChild(tempLink);
      tempLink.click();

      document.body.removeChild(tempLink);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      // response.data will be a Blob here too (since responseType is 'blob'),
      // so a JSON error from the backend needs to be read back out of it
      let message = 'Could not download the license file.';
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          message = parsed.message || message;
        } catch {
          // fall through to default message
        }
      } else {
        message = err.response?.data?.message || err.message || message;
      }
      alert(message);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleReviewAction = async (orgId, action) => {
    try {
      const payload = {
        action,
        statusRemarks: action === 'rejected' ? remarksInput : undefined
      };

      const response = await axios.patch(
        `${backendUrl}/api/v1/users/kyc/review/${orgId}`,
        payload,
        { withCredentials: true }
      );

      if (response.data && response.data.success) {
        setRejectionModalId(null);
        setRemarksInput('');
        fetchPendingOrgs();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed.');
    }
  };

  if (loading) return <div className="p-8 text-teal-800 font-medium">Loading compliance queue via AppContext...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-teal-900">KYC Compliance Queue</h2>
          <p className="text-sm text-slate-600">Verify drug licenses and approve retail wholesale storefront access.</p>
        </div>
        <span className="px-3 py-1 bg-yellow-100 text-teal-900 text-xs font-bold rounded-full">
          {pendingOrgs.length} Pending Review
        </span>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-800 rounded text-sm border-l-4 border-red-600">{error}</div>}

      {pendingOrgs.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
          <p className="text-slate-500 font-medium">All clear! No organizations are currently waiting for approval.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {pendingOrgs.map((org) => {
            const details = org.organization;
            return (
              <div key={org._id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                
                <div className="space-y-1 flex-1">
                  <h3 className="text-lg font-bold text-teal-900">{details.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">Tax ID / GSTIN: <span className="font-bold text-slate-700">{details.taxId}</span></p>
                  
                  <div className="text-sm text-slate-600 pt-2 space-y-0.5">
                    <p>📍 {details.address.street}, {details.address.city}, {details.address.state} - {details.address.postalCode}</p>
                    <p>📞 {details.phone} | ✉️ {details.email}</p>
                  </div>

                  <div className="pt-3 flex items-center space-x-4">
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded font-medium">
                      License #: <strong className="text-teal-800">{details.license.number}</strong>
                    </span>
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded font-medium">
                      Expires: {new Date(details.license.expiryDate).toLocaleDateString()}
                    </span>
                    <button 
                       onClick={() => handleDownloadPdf(org._id, details.name)}
                       disabled={downloadingId === org._id}
                       className="text-xs bg-teal-50 text-teal-700 hover:bg-teal-100 px-3 py-1.5 rounded-lg font-bold border border-teal-200 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                    {downloadingId === org._id ? 'Downloading...' : 'Download License PDF 📥'}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-2 w-full md:w-auto">
                  {rejectionModalId === org._id ? (
                    <div className="space-y-2 bg-slate-50 p-3 rounded-lg border w-full md:w-80">
                      <input 
                        type="text" 
                        placeholder="Reason for rejection (e.g. Blurry PDF)" 
                        value={remarksInput}
                        onChange={(e) => setRemarksInput(e.target.value)}
                        className="w-full text-xs px-2 py-1.5 border rounded outline-none focus:border-red-500"
                      />
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleReviewAction(org._id, 'rejected')}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1.5 rounded"
                        >
                          Confirm Reject
                        </button>
                        <button 
                          onClick={() => setRejectionModalId(null)}
                          className="px-3 bg-slate-200 text-slate-700 text-xs py-1.5 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex space-x-3 w-full md:w-auto">
                      <button 
                        onClick={() => handleReviewAction(org._id, 'approved')}
                        className="flex-1 md:flex-none px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded shadow-sm transition-colors"
                      >
                        Approve KYC ✓
                      </button>
                      <button 
                        onClick={() => setRejectionModalId(org._id)}
                        className="flex-1 md:flex-none px-5 py-2 bg-slate-100 hover:bg-red-50 text-red-700 text-sm font-bold rounded transition-colors border border-slate-200"
                      >
                        Reject ✕
                      </button>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SuperAdminKYC;