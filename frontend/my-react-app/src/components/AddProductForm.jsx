import React, { useContext, useState } from 'react';
import axios from 'axios'; 
import { AppContext } from '../context/AppContext';

const AddProductForm = () => {
  const {backendUrl}=useContext(AppContext);
  const [uiState, setUiState] = useState({
      errorMessage: '',
      successMessage: ''
    });
  const [formData, setFormData] = useState({
    manufacturer: '',
    brand: '',
    product: '',
    strength: '',
    form: '',
    hsn: '',
    salesTax: '',
    purchaseTax: ''
  });

  const hsnTaxMaster = [
    { code: "3004", description: "Standard Medicaments (12%)", rate: 12 },
    { code: "3002", description: "Vaccines & Blood (5%)", rate: 5 },
    { code: "2106", description: "Dietary Supplements (18%)", rate: 18 },
    { code: "3306", description: "Dental Hygiene (18%)", rate: 18 }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prevState) => {
      const newState = { ...prevState, [name]: value };
      if (name === 'hsn') {
        const matchedItem = hsnTaxMaster.find((item) => item.code === value);
        if (matchedItem) {
          newState.salesTax = matchedItem.rate;
          newState.purchaseTax = matchedItem.rate;
        } else {
          newState.salesTax = '';
          newState.purchaseTax = '';
        }
      }
      return newState;
    });
  };

  
  const callApi = async () => {
    setUiState({errorMessage: '', successMessage: '' });
    try {
      axios.defaults.withCredentials = true;
      const {data} = await axios.post(`${backendUrl}/api/v1/catalog/add-product`, formData);
      if (data.success) {
          
          setUiState({
            errorMessage: '',
            successMessage: `${formData.product} has been added to the catalog successfully.`
          });
        } else {
          setUiState({ successMessage: '', errorMessage: data.message });
        }
      console.log('Product saved successfully:', data);
      setFormData({ marketing:'', manufacturer:'', brand:'', product:'', strength:'', form:'', hsn:'', salesTax:'', purchaseTax:'' });
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
    console.log("Form Data Submitted:", formData);
    callApi();
  };

  return (
    <div className="w-full h-full bg-gray-50 font-sans text-gray-800 p-4 sm:p-8 overflow-auto">
      
      {/* 1. Form tag wraps everything, including the buttons! */}
      <form onSubmit={handleFormSubmit} className="max-w-6xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Dynamic Error Messaging Output Block */}
          {uiState.errorMessage && (
            <div className="p-3 bg-red-50 border-l-4 border-red-600 rounded text-sm text-red-800 font-medium">
              <strong>Action Blocked:</strong> {uiState.errorMessage}
            </div>
          )}

          {/* Dynamic Success Messaging Output Block */}
          {uiState.successMessage && (
            <div className="p-3 bg-emerald-50 border-l-4 border-emerald-600 rounded text-sm text-emerald-800 font-medium">
              <strong>Authorized:</strong> {uiState.successMessage}
            </div>
          )}

        
        {/* Form Header & Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b border-gray-200 bg-gray-50/50 rounded-t-lg">
          <h1 className="text-lg font-bold text-[#142940] flex items-center space-x-2">
            <span>Product Master</span>
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 mt-4 sm:mt-0">
            <div className="flex gap-2">
              {/* Type="submit" triggers the onSubmit event on the form */}
              <button 
                type="submit" 
                className="px-4 py-1.5 text-white text-sm font-medium rounded transition bg-green-500 hover:bg-green-600">
                Save
              </button>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN: Main Details */}
            <div className="lg:col-span-7 space-y-4">
              
              
              
              <div className="flex items-center">
                <label className="w-1/3 text-sm font-medium text-gray-700">Manufacturer</label>
                <input 
                     name="manufacturer" 
                     value={formData.manufacturer}
                     onChange={handleChange}
                     className="w-2/3 form-input bg-white"
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
                <label className="w-1/3 text-sm font-medium text-gray-700">Product <span className="text-red-500">*</span></label>
                <input 
                     type="text" 
                     value={formData.product}
                     onChange={handleChange}
                     name="product" 
                     className="w-2/3 form-input" />
              </div>

              <div className="flex items-center">
                <label className="w-1/3 text-sm font-medium text-gray-700">Size/Strength</label>
                <input 
                     type="text" 
                     value={formData.strength}
                     onChange={handleChange}
                     name="strength" 
                     className="w-2/3 form-input" />
              </div>
              
              <div className="flex items-center">
                <label className="w-1/3 text-sm font-medium text-gray-700">Form</label>
                <select name="form" value={formData.form} onChange={handleChange} className="w-2/3 form-input">
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

            </div>

            {/* RIGHT COLUMN: Taxation & Units */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Tax Box */}
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200 space-y-3">
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
                  <label className="w-1/3 text-sm font-medium text-gray-700">Sales Tax(%)</label>
                  <input 
                     type="text" 
                     readOnly
                     value={formData.salesTax } 
                     className="w-2/3 form-input bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200"
                     placeholder="Auto-filled..."
                   />
                </div>
                <div className="flex items-center space-x-2">
                  <label className="w-1/3 text-sm font-medium text-gray-700">Purchase Tax(%)</label>
                  <input 
                     type="text" 
                     readOnly 
                     value={formData.purchaseTax } 
                     className="w-2/3 form-input bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200"
                     placeholder="Auto-filled..."
                   />
                </div>
              </div>

            </div>
          </div>
        </div>
      
      {/* 2. Form Tag is closed here! */}
      </form>

      <style dangerouslySetInnerHTML={{__html: `
        .form-input {
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          padding: 0.375rem 0.75rem;
          font-size: 0.875rem;
          line-height: 1.25rem;
          outline: none;
          transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
        }
        .form-input:focus {
          border-color: #00bda5;
          box-shadow: 0 0 0 1px #00bda5;
        }
      `}} />
    </div>
  );
};

export default AddProductForm;