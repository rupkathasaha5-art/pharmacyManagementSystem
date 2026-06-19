import { createContext, useState, useContext } from 'react';
import axios from 'axios';
import { AppContext } from './AppContext.jsx'; 

export const CatalogContext = createContext();

export const CatalogContextProvider = (props) => {
  const { backendUrl } = useContext(AppContext); 
  const API_BASE_URL = `${backendUrl || 'http://localhost:8000'}/api/v1/catalog`;
  
  const [products, setProducts] = useState([]);

  const addBulkProductsToCatalog = async (productRows) => {
    const successfullySaved = [];
    let executionError = null;

    axios.defaults.withCredentials = true;

    for (let i = 0; i < productRows.length; i++) {
      const row = productRows[i];

      const structuredPayload = {
        name: row.name,
        strength: row.strength,
        form: row.form,
        sku: row.sku?.toUpperCase().trim(),
        wholesalePrice: Number(row.wholesalePrice),
        manufacturer: row.manufacturer,
        requiresColdChain: Boolean(row.requiresColdChain),
        scheduleClass: row.scheduleClass || 'Rx-Only',
        description: row.description || `${row.name} ${row.strength} matrix unit listing initialization.`
      };

      try {
        const { data } = await axios.post(`${API_BASE_URL}/add-product`, structuredPayload);

        if (data.success || data.statusCode === 201) {
          successfullySaved.push(data.data);
        }
      } catch (rowError) {
        console.error(`Row structural processing dropped at index pointer #${i + 1}:`, rowError);
        executionError = rowError.response?.data?.message || `Validation check rejected Item instance #${i + 1}`;
        break; 
      }
    }

    if (successfullySaved.length > 0) {
      setProducts(prevProducts => [...prevProducts, ...successfullySaved]);
    }

    return {
      success: successfullySaved.length === productRows.length,
      savedCount: successfullySaved.length,
      error: executionError
    };
  };

  const removeLotFromCatalog = async (productId, batchNumber) => {
    try {
      axios.defaults.withCredentials = true;
      const response = await axios.patch(`${API_BASE_URL}/remove-batch`, {
        productId,
        batchNumber
      });
      
      setProducts(prev => prev.filter(p => !(p.productId === productId && p.batchNumber === batchNumber)));
      return response.data; 
    } catch (error) {
      console.error("Error dispatching inventory state deletion call:", error);
      throw error.response?.data || new Error("Could not delete the batch");
    }
  };

  const getAllCatalogItems = async () => {
    try {
      axios.defaults.withCredentials = true;
      const response = await axios.get(`${API_BASE_URL}/show-catalog`);
      setProducts(response.data.data || response.data); 
    } catch (error) {
      console.error("Error fetching catalog items from server node:", error);
    }
  };

  const value = {
    addBulkProductsToCatalog,
    removeLotFromCatalog,
    getAllCatalogItems, 
    products, 
    setProducts
  };

  return (
    <CatalogContext.Provider value={value}>
      {props.children}
    </CatalogContext.Provider>
  );
};