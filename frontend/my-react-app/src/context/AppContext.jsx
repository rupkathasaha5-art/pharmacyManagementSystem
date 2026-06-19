import { createContext, useState } from "react";

export const AppContext = createContext();

export const AppContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  
  // 1. Initialize the cart as an empty array
  const [cart, setCart] = useState([]);

  // 2. Core function to handle adding batch objects to the cart
  const addToCart = (productBatch) => {
    setCart((prevCart) => {
      // Check if this specific batch item (_id) is already present in the current cart state
      const existingItemIndex = prevCart.findIndex(item => item._id === productBatch._id);

      if (existingItemIndex > -1) {
        // If it exists, map through and increment its order quantity safely
        return prevCart.map((item, index) => 
          index === existingItemIndex 
            ? { ...item, orderQuantity: item.orderQuantity + 1 } 
            : item
        );
      }

      // If it's a completely new batch being added, append it to the array with an initial orderQuantity of 1
      return [...prevCart, { ...productBatch, orderQuantity: 1 }];
    });
  };

  // 3. Optional helper function to remove items from the cart entirely
  const removeFromCart = (batchId) => {
    setCart((prevCart) => prevCart.filter(item => item._id !== batchId));
  };

  // 4. Optional helper function to update quantity directly via input counters
  const updateCartQuantity = (batchId, amount) => {
    setCart((prevCart) =>
      prevCart.map(item =>
        item._id === batchId
          ? { ...item, orderQuantity: Math.max(1, amount) }
          : item
      )
    );
  };


  const value = {
    backendUrl,
    isLoggedIn, setIsLoggedIn,
    userData, setUserData,
    cart, setCart,                
    addToCart,                     
    removeFromCart,                
    updateCartQuantity            
  };

  return (
    <AppContext.Provider value={value}>
      {props.children}
    </AppContext.Provider>
  );
};