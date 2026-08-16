import React, { useContext, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { AppContext } from '../context/AppContext';

const AddInventoryForm = () => {
  const { backendUrl } = useContext(AppContext);
  const [uiState, setUiState] = useState({
    errorMessage: '',
    successMessage: ''
  });
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState('');

  //to get today's date in YYYY-MM-DD format
  const getTodayString = () => new Date().toISOString().split('T')[0];

  //1. INVOICE HEADER STATE (Shared across all products in this entry)
  const [headerData, setHeaderData] = useState({
    supplierName: '',
    purchaseDate: getTodayString(),
    taxInclusive: false
  });

  //2. PRODUCT ROWS STATE (Array of items)
  const emptyRow = {
    product: '',
    productLabel: '', 
    batchNumber: '',
    manufacturingDate: '',
    expiryDate: '',
    quantityInStock: '',
    purchaseRate: '',
    mrp: '',
    salesRate: ''
  };

  const [rows, setRows] = useState([{ ...emptyRow }]);

  //Tracks which row's product dropdown is currently open (index or null)
  const [openDropdownIndex, setOpenDropdownIndex] = useState(null);
  const blurTimeoutRef = useRef(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setProductsLoading(true);
      setProductsError('');
      try {
        axios.defaults.withCredentials = true;
        //fetching  every product from the products collection via existing catalog endpoint
       
        const res = await axios.get(`${backendUrl}/api/v1/catalog/show-catalog?limit=100`);
        const data = res.data;

        
        console.log('show-catalog response:', data);

        
        let list = [];
        if (Array.isArray(data?.data?.products)) {
          list = data.data.products;
        } else if (Array.isArray(data?.products)) {
          list = data.products;
        } else if (Array.isArray(data?.data)) {
          list = data.data;
        } else if (Array.isArray(data)) {
          list = data;
        }

        if (list.length === 0) {
          setProductsError(
            'No products were returned by the catalog API.'
          );
        }

        setProducts(list);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProductsError(
          error.response?.data?.message ||
            error.message ||
            'Failed to load products from the catalog API.'
        );
      } finally {
        setProductsLoading(false);
      }
    };
    fetchProducts();
  }, [backendUrl]);

  
  const getProductLabel = (p) =>
    p.product || p.name || p.productName || p.title || 'Unnamed product';

  // for Invoice Header
  const handleHeaderChange = (e) => {
    const { name, value, type, checked } = e.target;
    setHeaderData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handlers for individual Table Rows
  const handleRowChange = (index, field, value) => {
    setRows((prevRows) => {
      const updatedRows = [...prevRows];
      updatedRows[index] = { ...updatedRows[index], [field]: value };
      return updatedRows;
    });
  };

  // Called as the user types in the product combobox input
  const handleProductSearchChange = (index, value) => {
    setRows((prevRows) => {
      const updatedRows = [...prevRows];
      updatedRows[index] = {
        ...updatedRows[index],
        productLabel: value,
        product: '' 
      };
      return updatedRows;
    });
    setOpenDropdownIndex(index);
  };

  // Called when the user clicks/selects a product from the filtered list
  const handleProductSelect = (index, product) => {
    setRows((prevRows) => {
      const updatedRows = [...prevRows];
      updatedRows[index] = {
        ...updatedRows[index],
        product: product._id,
        productLabel: `${getProductLabel(product)}${product.strength ? ` (${product.strength})` : ''}`
      };
      return updatedRows;
    });
    setOpenDropdownIndex(null);
  };

  // Returns products whose name matches what's typed so far (case-insensitive, substring match)
  const getFilteredProducts = (query) => {
    const q = (query || '').trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => getProductLabel(p).toLowerCase().includes(q));
  };

  // Add a new blank product row to the table
  const addRow = () => {
    setRows((prev) => [...prev, { ...emptyRow }]);
  };

  // Remove a row from the table
  const removeRow = (indexToRemove) => {
    if (rows.length === 1) {
      alert("You must have at least one product line.");
      return;
    }
    setRows((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  // Real-time calculation for UI preview per row
  const calculateMargin = (buyRate, sellRate) => {
    const buy = parseFloat(buyRate);
    const sell = parseFloat(sellRate);
    if (buy > 0 && sell >= 0) {
      return (((sell - buy) / buy) * 100).toFixed(1) + '%';
    }
    return '0%';
  };

  const resetForm = () => {
    setHeaderData({
      supplierName: '',
      purchaseDate: getTodayString(),
      taxInclusive: false
    });
    setRows([{ ...emptyRow }]);
  };

  // 3. API CALL: Uses Promise.all to submit multiple rows to your existing API
  const callApi = async () => {
    setUiState({ errorMessage: '', successMessage: '' });

    // Guard: every row must have a real product id, not just typed text
    const missingProduct = rows.some((row) => !row.product);
    if (missingProduct) {
      setUiState({
        successMessage: '',
        errorMessage: 'Please select a valid product from the dropdown for every row.'
      });
      return;
    }

    try {
      axios.defaults.withCredentials = true;

      // Build an array of payloads by combining header data + row data
      const requests = rows.map((row) => {
        const payload = {
          product: row.product,
          batchNumber: row.batchNumber.trim(),
          supplierName: headerData.supplierName.trim() || undefined,
          manufacturingDate: row.manufacturingDate || undefined,
          purchaseDate: headerData.purchaseDate || undefined,
          expiryDate: row.expiryDate,
          quantityInStock: Number(row.quantityInStock) || 0,
          purchaseRate: Number(row.purchaseRate) || 0,
          salesRate: Number(row.salesRate) || 0,
          mrp: Number(row.mrp) || 0,
          taxInclusive: headerData.taxInclusive
        };
        return axios.post(`${backendUrl}/api/v1/users/add-inventory`, payload);
      });

      // Fire all API requests simultaneously
      await Promise.all(requests);

      setUiState({
        errorMessage: '',
        successMessage: `Successfully added ${rows.length} product batch(es) to inventory!`
      });
      resetForm();
    } catch (error) {
      setUiState({
        successMessage: '',
        errorMessage: error.response?.data?.message || error.message || 'Failed to add batches to inventory. Please check for duplicate batch numbers.'
      });
      console.error('Error saving inventory batches:', error);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    callApi();
  };

  return (
    <div className="w-full h-full bg-slate-50 font-sans text-gray-800 p-4 sm:p-6 overflow-auto">
      <form
        onSubmit={handleFormSubmit}
        className="max-w-7xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col"
      >
        {/* Error / Success banners */}
        {uiState.errorMessage && (
          <div className="p-3 bg-red-50 border-l-4 border-red-600 text-sm text-red-800 font-medium">
            {uiState.errorMessage}
          </div>
        )}
        {uiState.successMessage && (
          <div className="p-3 bg-teal-50 border-l-4 border-[#00bda5] text-sm text-[#0d3b36] font-medium">
            {uiState.successMessage}
          </div>
        )}

        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b border-gray-200 bg-gradient-to-r from-[#0d3b36] to-[#00bda5] rounded-t-lg">
          <h1 className="text-lg font-bold text-white">
            Bulk Inventory / Invoice Entry
          </h1>
          <div className="flex items-center gap-2 mt-3 sm:mt-0">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-1.5 text-sm font-medium rounded bg-white/10 text-white border border-white/40 hover:bg-white/20 transition"
            >
              Clear All
            </button>
            <button
              type="submit"
              className="px-6 py-1.5 text-[#142940] text-sm font-semibold rounded bg-[#F5C518] hover:bg-[#e6b800] shadow-sm transition"
            >
              Save All Batches ({rows.length})
            </button>
          </div>
        </div>

        {/* SECTION 1: INVOICE HEADER (Entered Once) */}
        <div className="p-4 bg-slate-100 border-b border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="flex items-center space-x-2">
            <label className="text-xs font-bold uppercase text-gray-600 w-1/3">Supplier Name</label>
            <input
              type="text"
              name="supplierName"
              value={headerData.supplierName}
              onChange={handleHeaderChange}
              className="w-2/3 form-input text-sm"
              placeholder="e.g. Apex Pharma Distributors"
            />
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-xs font-bold uppercase text-gray-600 w-1/3">Purchase Date</label>
            <input
              type="date"
              name="purchaseDate"
              value={headerData.purchaseDate}
              onChange={handleHeaderChange}
              className="w-2/3 form-input text-sm"
            />
          </div>

          <div className="flex items-center justify-end space-x-2">
            <label htmlFor="taxInc" className="text-xs font-bold uppercase text-gray-600 cursor-pointer">
              Rates Include GST?
            </label>
            <input
              type="checkbox"
              id="taxInc"
              name="taxInclusive"
              checked={headerData.taxInclusive}
              onChange={handleHeaderChange}
              className="w-4 h-4 text-[#00bda5] border-gray-300 rounded focus:ring-[#00bda5] cursor-pointer"
            />
          </div>
        </div>

        {/* SECTION 2: PRODUCT ROWS TABLE */}
        <div className="p-4 overflow-x-auto">
          {productsLoading && (
            <div className="mb-3 text-xs text-gray-500">Loading products…</div>
          )}
          {!productsLoading && productsError && (
            <div className="mb-3 p-2 bg-amber-50 border-l-4 border-amber-500 text-xs text-amber-800">
              {productsError}
            </div>
          )}
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b-2 border-gray-200 text-[11px] uppercase tracking-wider text-gray-500 bg-gray-50">
                <th className="p-2 w-1/4">Product *</th>
                <th className="p-2">Batch No *</th>
                <th className="p-2">Expiry Date *</th>
                <th className="p-2 w-20">Qty *</th>
                <th className="p-2">Buy Rate (₹) *</th>
                <th className="p-2">MRP (₹) *</th>
                <th className="p-2">Sell Rate (₹) *</th>
                <th className="p-2 text-center">Margin</th>
                <th className="p-2 text-center w-12">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {rows.map((row, index) => {
                const filtered = getFilteredProducts(row.productLabel);
                const isOpen = openDropdownIndex === index;

                return (
                  <tr key={index} className="hover:bg-slate-50/80 transition">
                    {/* Product Combobox (searchable text box + filtered dropdown) */}
                    <td className="p-2 relative">
                      <input
                        type="text"
                        required
                        autoComplete="off"
                        placeholder="Type to search product..."
                        value={row.productLabel}
                        onChange={(e) => handleProductSearchChange(index, e.target.value)}
                        onFocus={() => {
                          if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
                          setOpenDropdownIndex(index);
                        }}
                        onBlur={() => {
                          // Small delay so a click on an option registers before we close the list
                          blurTimeoutRef.current = setTimeout(() => setOpenDropdownIndex(null), 150);
                        }}
                        className={`w-full form-input text-xs ${row.product ? '' : 'border-amber-300'}`}
                      />

                      {isOpen && (
                        <ul className="absolute z-10 mt-1 w-56 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg text-xs">
                          {filtered.length > 0 ? (
                            filtered.map((p) => (
                              <li
                                key={p._id}
                               
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleProductSelect(index, p);
                                }}
                                className="px-3 py-2 cursor-pointer hover:bg-[#f0fbf9] hover:text-[#0d3b36]"
                              >
                                {getProductLabel(p)} {p.strength ? `(${p.strength})` : ''}
                              </li>
                            ))
                          ) : (
                            <li className="px-3 py-2 text-gray-400">No matching products</li>
                          )}
                        </ul>
                      )}
                    </td>

                    {/* Batch Number */}
                    <td className="p-2">
                      <input
                        type="text"
                        required
                        placeholder="BATCH-01"
                        value={row.batchNumber}
                        onChange={(e) => handleRowChange(index, 'batchNumber', e.target.value)}
                        className="w-full form-input text-xs"
                      />
                    </td>

                    {/* Expiry Date */}
                    <td className="p-2">
                      <input
                        type="date"
                        required
                        value={row.expiryDate}
                        onChange={(e) => handleRowChange(index, 'expiryDate', e.target.value)}
                        className="w-full form-input text-xs"
                      />
                    </td>

                    {/* Quantity */}
                    <td className="p-2">
                      <input
                        type="number"
                        min="1"
                        required
                        placeholder="0"
                        value={row.quantityInStock}
                        onChange={(e) => handleRowChange(index, 'quantityInStock', e.target.value)}
                        className="w-full form-input text-xs text-center"
                      />
                    </td>

                    {/* Purchase Rate */}
                    <td className="p-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={row.purchaseRate}
                        onChange={(e) => handleRowChange(index, 'purchaseRate', e.target.value)}
                        className="w-full form-input text-xs text-right"
                      />
                    </td>

                    {/* MRP */}
                    <td className="p-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={row.mrp}
                        onChange={(e) => handleRowChange(index, 'mrp', e.target.value)}
                        className="w-full form-input text-xs text-right"
                      />
                    </td>

                    {/* Sales Rate */}
                    <td className="p-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={row.salesRate}
                        onChange={(e) => handleRowChange(index, 'salesRate', e.target.value)}
                        className="w-full form-input text-xs text-right"
                      />
                    </td>

                    {/* Auto Calculated Margin Display */}
                    <td className="p-2 text-center font-semibold text-xs text-[#00bda5]">
                      {calculateMargin(row.purchaseRate, row.salesRate)}
                    </td>

                    {/* Remove Row Button */}
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        className="text-red-500 hover:text-red-700 font-bold px-2 py-1 rounded hover:bg-red-50 transition"
                        title="Remove row"
                      >
                        &times;
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Add Row Button */}
          <div className="mt-4 flex justify-start">
            <button
              type="button"
              onClick={addRow}
              className="flex items-center space-x-1 px-4 py-2 bg-[#f0fbf9] border border-[#00bda5] text-[#0d3b36] text-xs font-bold rounded hover:bg-[#bfeee7] transition shadow-sm"
            >
              <span>+ Add Another Product</span>
            </button>
          </div>
        </div>
      </form>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .form-input {
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          padding: 0.375rem 0.5rem;
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

export default AddInventoryForm;