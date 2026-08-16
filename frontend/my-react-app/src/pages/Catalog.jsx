import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AppContext } from '../context/AppContext.jsx';

const Catalog = () => {
  const { backendUrl, isLoggedIn, userData, addToCart } = useContext(AppContext);
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [scheduleFilter, setScheduleFilter] = useState('');
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  // Local state to track the quantity inputted for each product card
  const [quantities, setQuantities] = useState({});

  // Role Access Checks
  const isSuperAdmin = userData?.role === 'SUPER_ADMIN';
  const isOrgAdmin = userData?.role === 'ORG_ADMIN';
  const isDriver = userData?.role === 'DRIVER';

  const fetchCatalog = async () => {
    if (!isLoggedIn) return;

    try {
      setLoading(true);
      setError('');
      
      const queryParams = new URLSearchParams({
        page,
        limit,
        ...(searchQuery && { search: searchQuery }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(scheduleFilter && { scheduleType: scheduleFilter })
      }).toString();

      const response = await axios.get(`${backendUrl}/api/v1/catalog/show-catalog?${queryParams}`, { 
        withCredentials: true 
      });
      
      if (response.data && response.data.success) {
        setProducts(response.data.data.products);
        setTotalPages(response.data.data.pagination.totalPages);
        
        const initialQuantities = {};
        response.data.data.products.forEach(p => {
             initialQuantities[p.batchNumber] = ''; 
        });
        setQuantities(prev => ({...prev, ...initialQuantities}));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch catalog.');
    } finally {
      setLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchCatalog();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, categoryFilter, scheduleFilter, isLoggedIn]);

  // Pagination effect
  useEffect(() => {
    fetchCatalog();
  }, [page]);

  const handleQuantityChange = (batchNumber, value, maxStock) => {
      if (value === '') {
          setQuantities(prev => ({ ...prev, [batchNumber]: '' }));
          return;
      }

      let numValue = parseInt(value, 10);
      
      if (isNaN(numValue) || numValue < 1) {
          numValue = 1;
      } else if (numValue > maxStock) {
          numValue = maxStock;
      }
      
      setQuantities(prev => ({
          ...prev,
          [batchNumber]: numValue
      }));
  };

  const handleAddToCart = (item) => {
    console.log("🛒 [CATALOG CLICKED] Attempting to add item:", item);
    try {
        const qty = quantities[item.batchNumber];
        const orderQuantity = parseInt(qty, 10);

        if (isNaN(orderQuantity) || orderQuantity < 1) {
            console.warn("⚠️ [ADD TO CART BLOCKED] Invalid quantity entered:", qty);
            alert('Please enter a quantity greater than 0.');
            return;
        }
        
        const batchToCart = {
            ...item,
            _id: item.batchNumber,
            orderQuantity: orderQuantity
        };
        
        console.log("📦 [ITEM ADDED TO CONTEXT]:", batchToCart);
        addToCart(batchToCart);
        alert(`Added ${orderQuantity} units of ${item.product} to your cart.`);
    } catch(err) {
        console.error("❌ [ADD TO CART ERROR]:", err);
        alert('Failed to add to cart.');
    }
  };

  const handleRemoveFromCatalog = async (productId) => {
    if(window.confirm('Are you sure you want to remove this product from the catalog?')) {
        try {
             const response = await axios.delete(`${backendUrl}/api/v1/catalog/admin/products/${productId}`, { 
                 withCredentials: true 
             });
             if(response.data.success) {
                 fetchCatalog();
             }
        } catch(err) {
            alert(err.response?.data?.message || 'Failed to remove product.');
        }
    }
  };

  if (isDriver) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] bg-slate-50">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-red-100 text-center max-w-md">
            <span className="text-4xl block mb-4">🚫</span>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h2>
            <p className="text-slate-600">Your role (Driver) does not have permission to view the product catalog.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      
      {/* Header & Search Bar */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold text-teal-900">B2B Product Catalog</h1>
            <p className="text-sm text-slate-500">Live inventory from the warehouse.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-grow sm:min-w-[250px]">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    🔍
                </span>
                <input
                    type="text"
                    placeholder="Search medicines, brands..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm"
                />
            </div>
            
            <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="py-2 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-teal-500 bg-white"
            >
                <option value="">All Categories</option>
                <option value="Antibiotics">Antibiotics</option>
                <option value="Analgesics">Analgesics</option>
                <option value="Cardiovascular">Cardiovascular</option>
                <option value="Diabetic">Diabetic</option>
                <option value="General">General</option>
            </select>

            <select 
                value={scheduleFilter}
                onChange={(e) => setScheduleFilter(e.target.value)}
                className="py-2 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-teal-500 bg-white"
            >
                <option value="">All Schedules</option>
                <option value="OTC">OTC</option>
                <option value="Schedule H">Schedule H</option>
                <option value="Schedule H1">Schedule H1</option>
            </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-800 rounded-lg border-l-4 border-red-500 text-sm">
          {error}
        </div>
      )}

      {loading && page === 1 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-slate-200 h-48 rounded-xl"></div>
            ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <span className="text-4xl block mb-3">📦</span>
            <h3 className="text-lg font-medium text-slate-700">No products found</h3>
            <p className="text-sm text-slate-500">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((item) => (
                    <div key={item.product} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                        
                        <div className="p-5 border-b border-slate-100 flex-grow">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-bold text-slate-800 leading-tight">
                                    {item.product}
                                </h3>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide
                                    ${item.scheduleType === 'OTC' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {item.scheduleType}
                                </span>
                            </div>
                            
                            <p className="text-xs text-slate-500 mb-4 font-mono truncate" title={item.genericName}>
                                {item.genericName}
                            </p>
                            
                            <div className="grid grid-cols-2 gap-y-2 text-sm">
                                <div>
                                    <span className="text-slate-400 text-xs block">Brand</span>
                                    <span className="font-medium text-slate-700">{item.brand || 'Generic'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 text-xs block">Pack Size</span>
                                    <span className="font-medium text-slate-700">{item.packSize}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 text-xs block">Mfg</span>
                                    <span className="font-medium text-slate-700 truncate block" title={item.manufacturer}>
                                        {item.manufacturer}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-400 text-xs block">Form</span>
                                    <span className="font-medium text-slate-700">{item.form}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-5 flex flex-col gap-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <span className="text-xs text-slate-500 block mb-1">Trade Price (PTR)</span>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-bold text-teal-700">₹{item.salesRate}</span>
                                        <span className="text-xs text-slate-400 line-through">MRP: ₹{item.mrp}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-slate-500 block mb-1">In Stock</span>
                                    <span className={`font-bold ${item.totalStock > 50 ? 'text-green-600' : 'text-orange-500'}`}>
                                        {item.totalStock} units
                                    </span>
                                </div>
                            </div>
                            
                            {isOrgAdmin && (
                                <div className="mt-2 flex items-center justify-between gap-2">
                                    {item.totalStock > 0 ? (
                                        <>
                                            <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden w-28">
                                                <button 
                                                    onClick={() => {
                                                        const current = parseInt(quantities[item.batchNumber], 10);
                                                        if (!isNaN(current) && current > 1) {
                                                            handleQuantityChange(item.batchNumber, current - 1, item.totalStock);
                                                        } else {
                                                            handleQuantityChange(item.batchNumber, '', item.totalStock);
                                                        }
                                                    }}
                                                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-colors border-r border-slate-300"
                                                >
                                                    -
                                                </button>
                                                <input 
                                                    type="number"
                                                    min="1"
                                                    max={item.totalStock}
                                                    placeholder="0"
                                                    value={quantities[item.batchNumber] !== undefined ? quantities[item.batchNumber] : ''}
                                                    onChange={(e) => handleQuantityChange(item.batchNumber, e.target.value, item.totalStock)}
                                                    className="w-full text-center text-sm font-bold text-slate-800 outline-none p-1 appearance-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                <button 
                                                    onClick={() => {
                                                        const current = parseInt(quantities[item.batchNumber], 10);
                                                        const nextVal = isNaN(current) ? 1 : current + 1;
                                                        handleQuantityChange(item.batchNumber, nextVal, item.totalStock);
                                                    }}
                                                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-colors border-l border-slate-300"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            
                                            <button 
                                                onClick={() => handleAddToCart(item)}
                                                className="flex-grow bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
                                            >
                                                <span>🛒 Add</span>
                                            </button>
                                        </>
                                    ) : (
                                        <button 
                                            disabled
                                            className="w-full bg-slate-300 cursor-not-allowed text-slate-500 font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2"
                                        >
                                            Out of Stock
                                        </button>
                                    )}
                                </div>
                            )}

                            {isSuperAdmin && (
                                <button 
                                    onClick={() => handleRemoveFromCatalog(item.product)}
                                    className="w-full mt-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2.5 rounded-lg text-sm transition-colors border border-red-200"
                                >
                                    Remove from Catalog
                                </button>
                            )}
                        </div>

                    </div>
                ))}
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 pt-6">
                    <button 
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-slate-600 font-medium">
                        Page {page} of {totalPages}
                    </span>
                    <button 
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}
        </>
      )}
    </div>
  );
};

export default Catalog;