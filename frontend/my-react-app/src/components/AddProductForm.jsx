import React, { useContext, useState } from 'react';
import axios from 'axios';
import { AppContext } from '../context/AppContext';

const AddProductForm = () => {
  const { backendUrl } = useContext(AppContext);
  const [uiState, setUiState] = useState({
    errorMessage: '',
    successMessage: ''
  });
  const [formData, setFormData] = useState({
    manufacturer: '',
    brand: '',
    product: '',
    genericName: '',
    category: '',
    strength: '',
    form: '',
    packSize: '',
    scheduleType: 'OTC',
    storageCondition: '',
    hsn: '',
    cgst: '',
    sgst: '',
    igst: ''
  });

  // total rate gets split evenly into cgst/sgst for intra-state sales by default.
  // igst stays 0 unless the admin overrides it for an inter-state scenario
const hsnTaxMaster = [
    { code: '3004 (5%)', description: 'General Medicaments (5%)', rate: 5 },
    { code: '3004 (12%)', description: 'Specified Medicaments — 12% category', rate: 12 },
    { code: '3002', description: 'Vaccines & Blood Products (5%)', rate: 5 },
    { code: '2106', description: 'Dietary Supplements (18%)', rate: 18 },
    { code: '3306', description: 'Dental Hygiene (18%)', rate: 18 },
    { code: 'EXEMPT', description: 'Life-Saving Drugs (Nil/0%)', rate: 0 }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prevState) => {
      const newState = { ...prevState, [name]: value };
      if (name === 'hsn') {
        const matchedItem = hsnTaxMaster.find((item) => item.code === value);
        if (matchedItem) {
          newState.cgst = matchedItem.rate / 2;
          newState.sgst = matchedItem.rate / 2;
          newState.igst = matchedItem.rate;
        } else {
          newState.cgst = '';
          newState.sgst = '';
          newState.igst = '';
        }
      }
      return newState;
    });
  };

  const resetForm = () => {
    setFormData({
      manufacturer: '',
      brand: '',
      product: '',
      genericName: '',
      category: '',
      strength: '',
      form: '',
      packSize: '',
      scheduleType: 'OTC',
      storageCondition: '',
      hsn: '',
      cgst: '',
      sgst: '',
      igst: ''
    });
  };

  const callApi = async () => {
    setUiState({ errorMessage: '', successMessage: '' });

    // 1. HSN Validation Check
    if (formData.hsn) {
      const isValidHsn = hsnTaxMaster.some(
        (item) => item.code.toLowerCase() === formData.hsn.trim().toLowerCase()
      );

      if (!isValidHsn) {
        setUiState({
          successMessage: '',
          errorMessage: `Warning: "${formData.hsn}" is not a recognized HSN code. Please select a valid code from the master list or type EXEMPT.`
        });
        return; // Stops execution so the form does not submit
      }
    }

    // 2. API Request
    try {
      axios.defaults.withCredentials = true;

      //clean the HSN code by stripping any display tags like " (5%)" or " (12%)"
      //  "3004 (12%)" cleanly becomes "3004" 
      const cleanedHsn = formData.hsn.split(' ')[0];

      //restructure flat form fields into the schema's nested gst object
      const payload = {
        product: formData.product,
        genericName: formData.genericName,
        brand: formData.brand,
        manufacturer: formData.manufacturer,
        category: formData.category,
        form: formData.form,
        strength: formData.strength,
        packSize: formData.packSize,
        scheduleType: formData.scheduleType,
        storageCondition: formData.storageCondition,
        hsn: cleanedHsn, // Uses the cleaned 4-digit code
        gst: {
          cgst: Number(formData.cgst) || 0,
          sgst: Number(formData.sgst) || 0,
          igst: Number(formData.igst) || 0
        }
      };

      const { data } = await axios.post(`${backendUrl}/api/v1/users/add-product`, payload);
      if (data.success) {
        setUiState({
          errorMessage: '',
          successMessage: `${formData.product} has been added to the catalog successfully.`
        });
        resetForm();
      } else {
        setUiState({ successMessage: '', errorMessage: data.message });
      }
    } catch (error) {
      setUiState({
        successMessage: '',
        errorMessage: error.response?.data?.message || error.message || 'Failed to add the product to the catalog.'
      });
      console.error('Error saving product:', error);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    callApi();
  };

  return (
    <div className="w-full h-full bg-slate-50 font-sans text-gray-800 p-4 sm:p-8 overflow-auto">
      <form
        onSubmit={handleFormSubmit}
        className="max-w-6xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200"
      >
        {/* Error / Success banners */}
        {uiState.errorMessage && (
          <div className="p-3 bg-red-50 border-l-4 border-red-600 rounded-t text-sm text-red-800 font-medium">
            {uiState.errorMessage}
          </div>
        )}
        {uiState.successMessage && (
          <div className="p-3 bg-teal-50 border-l-4 border-[#00bda5] rounded-t text-sm text-[#0d3b36] font-medium">
            {uiState.successMessage}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b border-gray-200 bg-gradient-to-r from-[#0d3b36] to-[#00bda5] rounded-t-lg">
          <h1 className="text-lg font-bold text-white flex items-center space-x-2">
            <span>Product Master</span>
          </h1>

          <div className="flex flex-wrap items-center gap-2 mt-4 sm:mt-0">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-1.5 text-sm font-medium rounded transition bg-white/10 text-white border border-white/40 hover:bg-white/20"
            >
              Clear
            </button>
            <button
              type="submit"
              className="px-5 py-1.5 text-[#142940] text-sm font-semibold rounded transition bg-[#F5C518] hover:bg-[#e6b800] shadow-sm"
            >
              Save
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* LEFT COLUMN: Main Details */}
            <div className="lg:col-span-7 space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[#00bda5] mb-1">
                Product Details
              </h2>

              <div className="flex items-center">
                <label className="w-1/3 text-sm font-medium text-gray-700">Manufacturer</label>
                <input
                  name="manufacturer"
                  value={formData.manufacturer}
                  onChange={handleChange}
                  className="w-2/3 form-input"
                />
              </div>

              <div className="flex items-center">
                <label className="w-1/3 text-sm font-medium text-gray-700">Brand</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={handleChange}
                  name="brand"
                  className="w-2/3 form-input"
                />
              </div>

              <div className="flex items-center">
                <label className="w-1/3 text-sm font-medium text-gray-700">
                  Product <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.product}
                  onChange={handleChange}
                  name="product"
                  className="w-2/3 form-input"
                />
              </div>

              <div className="flex items-center">
                <label className="w-1/3 text-sm font-medium text-gray-700">Generic Name</label>
                <input
                  type="text"
                  value={formData.genericName}
                  onChange={handleChange}
                  name="genericName"
                  className="w-2/3 form-input"
                  placeholder="e.g. Paracetamol"
                />
              </div>

              <div className="flex items-center">
                <label className="w-1/3 text-sm font-medium text-gray-700">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={handleChange}
                  name="category"
                  className="w-2/3 form-input"
                  placeholder="e.g. Analgesic"
                />
              </div>

              <div className="flex items-center">
                <label className="w-1/3 text-sm font-medium text-gray-700">Size/Strength</label>
                <input
                  type="text"
                  value={formData.strength}
                  onChange={handleChange}
                  name="strength"
                  className="w-2/3 form-input"
                />
              </div>

              <div className="flex items-center">
                <label className="w-1/3 text-sm font-medium text-gray-700">Pack Size</label>
                <input
                  type="text"
                  value={formData.packSize}
                  onChange={handleChange}
                  name="packSize"
                  className="w-2/3 form-input"
                  placeholder="e.g. 10x10, 1x100ml"
                />
              </div>

              <div className="flex items-center">
                <label className="w-1/3 text-sm font-medium text-gray-700">Form</label>
                <select
                  name="form"
                  value={formData.form}
                  onChange={handleChange}
                  className="w-2/3 form-input"
                >
                  <option value="">Select a form...</option>
                  <optgroup label="Solid Oral Forms">
                    <option value="Tablets">Tablets</option>
                    <option value="Capsules">Capsules</option>
                    <option value="Caplets">Caplets</option>
                    <option value="Lozenges">Lozenges</option>
                    <option value="Powders">Powders / Granules</option>
                  </optgroup>
                  <optgroup label="Liquid Forms">
                    <option value="Syrups">Syrups</option>
                    <option value="Suspensions">Suspensions</option>
                    <option value="Solutions">Solutions</option>
                    <option value="Drops">Drops</option>
                  </optgroup>
                  <optgroup label="Topical Forms">
                    <option value="Ointments">Ointments</option>
                    <option value="Creams">Creams</option>
                    <option value="Lotions">Lotions</option>
                    <option value="Gels">Gels</option>
                    <option value="Transdermal Patches">Transdermal Patches</option>
                  </optgroup>
                  <optgroup label="Inhaled Forms">
                    <option value="Inhalers">Inhalers (MDIs)</option>
                    <option value="Nebulizer Solutions">Nebulizer Solutions</option>
                    <option value="Nasal Sprays">Nasal Sprays</option>
                  </optgroup>
                  <optgroup label="Injectable & Other Forms">
                    <option value="Injectables">Injectables (IV/IM/SC)</option>
                    <option value="Suppositories">Suppositories</option>
                  </optgroup>
                </select>
              </div>

              <div className="flex items-center">
                <label className="w-1/3 text-sm font-medium text-gray-700">Schedule Type</label>
                <select
                  name="scheduleType"
                  value={formData.scheduleType}
                  onChange={handleChange}
                  className="w-2/3 form-input"
                >
                  <option value="OTC">OTC</option>
                  <option value="H">H</option>
                  <option value="H1">H1</option>
                  <option value="X">X</option>
                  <option value="G">G</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex items-center">
                <label className="w-1/3 text-sm font-medium text-gray-700">Storage Condition</label>
                <input
                  type="text"
                  value={formData.storageCondition}
                  onChange={handleChange}
                  name="storageCondition"
                  className="w-2/3 form-input"
                  placeholder="e.g. Cool & Dry Place, 2-8°C"
                />
              </div>
            </div>

            {/* RIGHT COLUMN: Taxation */}
            <div className="lg:col-span-5 space-y-6">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[#00bda5] mb-1">
                Taxation
              </h2>

              <div className="bg-[#f0fbf9] p-4 rounded-md border border-[#bfeee7] space-y-3">
                <div className="flex items-center space-x-2">
                  <label className="w-1/3 text-sm font-medium text-gray-700">HSN(SAC)</label>
                  <input
                    type="text"
                    list="hsn-options"
                    name="hsn"
                    value={formData.hsn}
                    onChange={handleChange}
                    className="w-2/3 form-input bg-white"
                    placeholder="Search HSN..."
                    autoComplete="off"
                  />
                  <datalist id="hsn-options">
                    {hsnTaxMaster.map((hsn) => (
                      <option key={hsn.code} value={hsn.code}>
                        {hsn.description}
                      </option>
                    ))}
                  </datalist>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="w-1/3 text-sm font-medium text-gray-700">CGST(%)</label>
                  <input
                    type="text"
                    readOnly
                    value={formData.cgst}
                    className="w-2/3 form-input bg-[#FEF9E7] text-[#8a6d00] cursor-not-allowed border-[#F5C518]/60"
                    placeholder="Auto-filled..."
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <label className="w-1/3 text-sm font-medium text-gray-700">SGST(%)</label>
                  <input
                    type="text"
                    readOnly
                    value={formData.sgst}
                    className="w-2/3 form-input bg-[#FEF9E7] text-[#8a6d00] cursor-not-allowed border-[#F5C518]/60"
                    placeholder="Auto-filled..."
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <label className="w-1/3 text-sm font-medium text-gray-700">IGST(%)</label>
                  <input
                    type="text"
                    readOnly
                    value={formData.igst}
                    className="w-2/3 form-input bg-[#FEF9E7] text-[#8a6d00] cursor-not-allowed border-[#F5C518]/60"
                    placeholder="Auto-filled..."
                  />
                </div>

                <p className="text-[11px] text-slate-500 pt-1">
                  If the there is no tax on the medicine type EXEMPT
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .form-input {
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          padding: 0.375rem 0.75rem;
          font-size: 0.875rem;
          line-height: 1.25rem;
          outline: none;
          background-color: #ffffff;
          transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
        }
        .form-input:focus {
          border-color: #00bda5;
          box-shadow: 0 0 0 2px rgba(0, 189, 165, 0.25);
        }
      `
        }}
      />
    </div>
  );
};

export default AddProductForm;