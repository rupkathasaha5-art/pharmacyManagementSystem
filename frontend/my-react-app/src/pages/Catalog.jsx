import React, { useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AppContext } from '../context/AppContext.jsx';
import { CatalogContext } from '../context/CatalogContext.jsx';
import ProductCard from '../components/ProductCard.jsx';

const Catalog = () => {
  const location = useLocation();
  // Evaluate matching contextual workspace paths dynamically
  const currentState = location.pathname.includes('dashboard') ? 'dashboard' : 'catalog';
  
  // Destructure application context states cleanly
  const { cart, addToCart, removeFromCart } = useContext(AppContext);
  const { products, getAllCatalogItems, removeLotFromCatalog } = useContext(CatalogContext);
  
  const [showManu, setShowManu] = useState(false);
  const [selectedManufacturer, setSelectedManufacturer] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingItemId, setLoadingItemId] = useState(null);

  // Fallback programmatic dummy arrays to safely mount states if backend lists are empty
  const mockProducts = [
    {
      _id: "batch_item_78901",
      productId: "prod_amx_250",
      name: "Amoxicillin Trihydrate",
      manufacturer: "Cipla",
      form: "Capsule",
      sku: "SKU-AMX-250-CAP",
      wholesalePrice: 15.00,
      batchNumber: "BAT-AMX-2026A",
      expiryDate: "2026-07-20",
      totalAvailableATP: 250
    },
    {
      _id: "batch_item_78902",
      productId: "prod_amx_250",
      name: "Amoxicillin Trihydrate",
      manufacturer: "Cipla",
      form: "Capsule",
      sku: "SKU-AMX-250-CAP",
      wholesalePrice: 13.50,
      batchNumber: "BAT-AMX-2026B",
      expiryDate: "2027-11-15",
      totalAvailableATP: 8200
    },
    {
      _id: "batch_item_78903",
      productId: "prod_ins_lan",
      name: "Humalog Insulin Lantus",
      manufacturer: "Sun Pharmaceutical Industries",
      form: "Vial",
      sku: "SKU-INS-LAN-100",
      wholesalePrice: 45.00,
      batchNumber: "BAT-INS-9910X",
      expiryDate: "2027-04-01",
      totalAvailableATP: 4500
    },
    {
      _id: "batch_item_78904",
      productId: "prod_lip_040",
      name: "Lipitor (Atorvastatin)",
      manufacturer: "Dr. Reddy's Laboratories",
      form: "Tablet",
      sku: "SKU-LIP-040-TAB",
      wholesalePrice: 22.10,
      batchNumber: "BAT-LIP-4401A",
      expiryDate: "2028-04-10",
      totalAvailableATP: 11500
    },
    {
      _id: "batch_item_78905",
      productId: "prod_xan_050",
      name: "Xanax (Alprazolam)",
      manufacturer: "Mankind Pharma",
      form: "Tablet",
      sku: "SKU-XAN-050-TAB",
      wholesalePrice: 28.00,
      batchNumber: "BAT-XAN-8802B",
      expiryDate: "2026-08-05",
      totalAvailableATP: 450
    }
  ];

  // Fetch product elements from active catalog DB context layer on setup
  useEffect(() => {
    if (getAllCatalogItems) {
      getAllCatalogItems();
    }
  }, []);

  // Securely pivot layout processing rows if database records exist
  const dynamicProductsList = products && products.length > 0 ? products : mockProducts;

  // Extract unique manufacturers list dynamically for the side filter menu
  const manufacturers = ['All', ...new Set(dynamicProductsList.map(p => p.manufacturer).filter(Boolean))];
  const safeCart = cart || [];

  // ==========================================
  // MULTI-FIELD SEARCH AND FILTER PIPELINE
  // ==========================================
  const filteredProducts = dynamicProductsList.filter(product => {
    const matchesManufacturer = selectedManufacturer === 'All' || product.manufacturer === selectedManufacturer;
    const normalizedQuery = searchQuery.toLowerCase().trim();

    return matchesManufacturer && (
      normalizedQuery === '' || 
      product.name?.toLowerCase().includes(normalizedQuery) ||
      product.manufacturer?.toLowerCase().includes(normalizedQuery) ||
      product.sku?.toLowerCase().includes(normalizedQuery) ||
      product.batchNumber?.toLowerCase().includes(normalizedQuery)
    );
  });

  // Balanced execution toggle: Add or remove item depending on its baseline state
  const handleCartActionClick = (item, isItemInCart) => {
    if (isItemInCart) {
      if (removeFromCart) {
        removeFromCart(item._id);
      } else {
        alert(`Success: Removed ${item.name} from cart mockup.`);
      }
    } else {
      if (addToCart) {
        addToCart(item);
      } else {
        alert(`Success: Added ${item.name} to cart mockup.`);
      }
    }
  };

  // ==========================================
  // CATALOG DELETION ROUTER MANAGEMENT
  // ==========================================
  const handleRemoveFromCatalog = async (productId, batchNumber, itemId) => {
    if (!window.confirm(`Are you absolutely sure you want to drop Batch ${batchNumber} from the catalog registry?`)) {
      return;
    }
    
    setLoadingItemId(itemId);
    try {
      if (removeLotFromCatalog) {
        await removeLotFromCatalog(productId, batchNumber);
        alert(`Success: Lot ${batchNumber} has been deleted from your database registry.`);
      } else {
        alert("Simulating catalog item dropping pipeline execution locally.");
      }
    } catch (error) {
      alert(`Database Mutator Failed: ${error.message || "Could not delete record."}`);
    } finally {
      setLoadingItemId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 text-[#0f2d4a] font-sans">
      
      {/* Catalog Main Header Bar Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#0f2d4a]">
            {currentState === 'dashboard' ? "Inventory Control Center" : "Wholesale Product Catalog"}
          </h1>
          <p className="text-xs text-slate-400 mt-1">Real-time batch tracking and FEFO inventory procurement nodes.</p>
        </div>

        {/* ALPHANUMERIC MULTI-FIELD SEARCH BAR */}
        <div className="w-full lg:w-96 relative">
          <input
            type="text"
            placeholder="Search by medicine name, SKU, lot code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white text-[#0f2d4a] placeholder-slate-400 font-medium py-3 pl-11 pr-10 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-[#009688] shadow-sm transition-all text-sm"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
            <svg className="h-4 w-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-red-500 font-bold transition-colors text-xs uppercase"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Main Structural Twin Columns Array Wrapper Layout */}
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Left Control Sidebar Navigation Layer */}
        <div className="w-full md:w-1/4 min-w-[240px]">
          <div className="bg-white p-5 rounded-xl border border-teal-100 shadow-sm sticky top-6">
            <div 
              className="flex justify-between items-center cursor-pointer md:cursor-default"
              onClick={() => setShowManu(!showManu)}
            >
              <p className="text-sm font-bold tracking-wider text-[#0f2d4a] uppercase">Filter Channels</p>
              <span className={`text-sm transform transition-transform duration-200 md:hidden ${showManu ? 'rotate-180' : ''}`}>▼</span>
            </div>
            <hr className="my-3 border-teal-100 hidden md:block" />
            
            <div className={`mt-3 md:block ${showManu ? 'block' : 'hidden'}`}>
              <label htmlFor="manufacturer" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Manufacturer Filter</label>
              <div className="relative">
                <select
                  id="manufacturer"
                  value={selectedManufacturer}
                  onChange={(e) => setSelectedManufacturer(e.target.value)}
                  className="w-full bg-[#f4fbf9] text-[#0f2d4a] font-semibold py-2.5 px-4 pr-10 rounded-lg border-2 border-teal-500/20 focus:outline-none focus:border-[#009688] transition-colors appearance-none cursor-pointer shadow-sm text-sm"
                >
                  {manufacturers.map((mfg, index) => (
                    <option key={index} value={mfg} className="bg-white text-[#0f2d4a]">{mfg}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#009688]">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Product Grid View Grid */}
        <div className="w-full md:w-3/4 space-y-4">
          <div className="bg-[#f4fbf9]/60 px-4 py-2.5 rounded-lg border border-teal-500/10 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>
              Active Filter Parameters: <strong className="text-[#009688]">{selectedManufacturer}</strong>
              {searchQuery && <span> &bull; Keyphrase Query: <strong className="text-[#009688]">"{searchQuery}"</strong></span>}
            </span>
            <span className="font-semibold bg-white px-2 py-0.5 rounded shadow-sm border text-[#0f2d4a] self-start sm:self-auto shrink-0">
              {filteredProducts.length} entries matched
            </span>
          </div>
          
          {filteredProducts.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center">
              <div className="text-3xl mb-2 text-slate-300">🔍</div>
              <p className="text-slate-400 font-medium italic">No active medical stock records correspond to your filter combinations.</p>
              <button 
                onClick={() => { setSearchQuery(''); setSelectedManufacturer('All'); }}
                className="mt-4 bg-teal-50 text-teal-600 font-bold px-4 py-2 rounded-lg text-xs hover:bg-teal-100 transition-colors border border-teal-200"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {filteredProducts.map((product) => {
                const isItemInCart = safeCart.some(item => item._id === product._id);

                return (
                  <ProductCard key={product._id} product={product}>
                    
                    {/* Pivot Action Configuration Panel based on Route Context State */}
                    {currentState === 'catalog' ? (
                      <button
                        onClick={() => handleCartActionClick(product, isItemInCart)}
                        className={`font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-all flex items-center gap-2 uppercase tracking-wider ${
                          isItemInCart 
                            ? 'bg-red-50 hover:bg-red-100 text-red-500 border border-red-200' 
                            : 'bg-[#00c4a7] hover:bg-[#00b096] text-white'
                        }`}
                      >
                        {isItemInCart ? "Remove from Cart" : "Add To Cart"}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRemoveFromCatalog(product.productId, product.batchNumber, product._id)}
                        disabled={loadingItemId === product._id}
                        className="font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-all flex items-center gap-2 uppercase tracking-wider bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 disabled:opacity-50"
                      >
                        {loadingItemId === product._id ? "Processing..." : "Remove from Catalog"}
                      </button>
                    )}

                  </ProductCard>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Catalog;