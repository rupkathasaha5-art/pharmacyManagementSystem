import React, { useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { AppContext } from '../context/AppContext.jsx';

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');

const STATUS_META = {
  approved: { label: 'Approved', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  pending: { label: 'Pending Review', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  rejected: { label: 'Rejected', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

const daysUntil = (date) => {
  if (!date) return null;
  return Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
};

const ComplianceProfile = () => {
  const { backendUrl } = useContext(AppContext);

  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [showResubmitForm, setShowResubmitForm] = useState(false);
  const [licenseFile, setLicenseFile] = useState(null);
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiryDate, setLicenseExpiryDate] = useState('');
  const [fileError, setFileError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await axios.get(`${backendUrl}/api/v1/org-admin/my-profile`, { withCredentials: true });
      if (res.data?.success) setProfile(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your compliance profile.');
    } finally {
      setIsLoading(false);
    }
  }, [backendUrl]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFileError('');
    if (!file) { setLicenseFile(null); return; }
    if (file.type !== 'application/pdf') {
      setFileError('Only PDF files are accepted.');
      setLicenseFile(null);
      e.target.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFileError('File is too large. Please upload a PDF under 10MB.');
      setLicenseFile(null);
      e.target.value = '';
      return;
    }
    setLicenseFile(file);
  };

  const handleResubmit = async (e) => {
    e.preventDefault();
    if (!licenseFile) {
      setFileError('Please attach the corrected license PDF.');
      return;
    }

    setIsSubmitting(true);
    setSubmitSuccess('');
    try {
      const formData = new FormData();
      formData.append('licenseDocument', licenseFile);
      if (licenseNumber.trim()) formData.append('licenseNumber', licenseNumber.trim());
      if (licenseExpiryDate) formData.append('licenseExpiryDate', licenseExpiryDate);

      const res = await axios.patch(`${backendUrl}/api/v1/org-admin/resubmit-kyc`, formData, { withCredentials: true });

      if (res.data?.success) {
        setSubmitSuccess('Resubmitted successfully — your application is back under review.');
        setShowResubmitForm(false);
        setLicenseFile(null);
        setLicenseNumber('');
        setLicenseExpiryDate('');
        fetchProfile();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Resubmission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="max-w-3xl mx-auto p-12 text-center text-slate-400 text-sm">Loading your compliance profile...</div>;
  }
  if (error) {
    return <div className="max-w-3xl mx-auto p-6 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>;
  }
  if (!profile) return null;

  const org = profile.organization || {};
  const address = org.address || {};
  const license = org.license || {};
  const statusMeta = STATUS_META[profile.status] || STATUS_META.pending;
  const expiryDays = daysUntil(license.expiryDate);
  const isExpiringSoon = expiryDays !== null && expiryDays <= 30 && expiryDays >= 0;
  const isExpired = expiryDays !== null && expiryDays < 0;

  return (
    <div className="max-w-3xl mx-auto font-sans text-[#0f2d4a] space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Compliance Profile</h1>
          <p className="text-xs text-slate-400 mt-1">Your registered legal and regulatory details.</p>
        </div>
        <span className={`inline-flex items-center text-xs font-bold px-3 py-1.5 rounded-full border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}>
          {statusMeta.label}
        </span>
      </div>

      {submitSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
          {submitSuccess}
        </div>
      )}

      {profile.status === 'rejected' && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5">
          <h3 className="text-sm font-bold text-red-700 mb-1">⚠ Application Rejected</h3>
          <p className="text-xs text-red-600 mb-3">{profile.statusRemarks || 'No specific reason was provided.'}</p>
          {!showResubmitForm && (
            <button
              onClick={() => setShowResubmitForm(true)}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg"
            >
              Resubmit for Review
            </button>
          )}
        </div>
      )}

      {profile.status === 'pending' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700">
          Your application is under review. You'll be notified once it's approved.
        </div>
      )}

      {showResubmitForm && (
        <form onSubmit={handleResubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-bold text-[#0f2d4a] mb-2">Resubmit Application</h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">New License PDF</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
            />
            {licenseFile && !fileError && <p className="text-xs text-emerald-600 mt-1">Selected: {licenseFile.name}</p>}
            {fileError && <p className="text-xs text-red-600 mt-1">{fileError}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Corrected License Number (optional)</label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder={license.number}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-teal-600 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Corrected Expiry Date (optional)</label>
              <input
                type="date"
                value={licenseExpiryDate}
                onChange={(e) => setLicenseExpiryDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-teal-600 text-sm"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowResubmitForm(false)}
              className="flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg text-white bg-[#009688] hover:bg-[#00786a] disabled:bg-slate-300"
            >
              {isSubmitting ? 'Submitting...' : 'Submit for Review'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Legal Entity Details</h3>
        <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Legal Name</p>
            <p className="font-semibold">{org.name || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">GSTIN / Tax ID</p>
            <p className="font-mono font-semibold">{org.taxId || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Phone</p>
            <p className="font-semibold">{org.phone || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Email</p>
            <p className="font-semibold">{org.email || '—'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-slate-400 mb-0.5">Registered Address</p>
            <p className="font-semibold">
              {[address.street, address.city, address.state, address.postalCode].filter(Boolean).join(', ') || '—'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Drug License</h3>
        <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm mb-4">
          <div>
            <p className="text-xs text-slate-400 mb-0.5">License Number</p>
            <p className="font-mono font-semibold">{license.number || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Expiry Date</p>
            <p className={`font-semibold ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-amber-600' : ''}`}>
              {formatDate(license.expiryDate)}
              {isExpired && ' (Expired)'}
              {isExpiringSoon && ` (${expiryDays}d left)`}
            </p>
          </div>
        </div>

        {(isExpired || isExpiringSoon) && (
          <div className={`p-3 rounded-lg text-xs mb-4 ${isExpired ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
            {isExpired
              ? 'Your drug license has expired. Orders on trade credit may be blocked until this is renewed.'
              : `Your drug license expires in ${expiryDays} day(s) — renew soon to avoid disruption to your ordering.`}
          </div>
        )}

        {license.documentUrl && (
          <a
            href={license.documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold uppercase tracking-wider text-[#009688] hover:text-[#00786a]"
          >
            📄 View Uploaded License
          </a>
        )}
      </div>
    </div>
  );
};

export default ComplianceProfile;