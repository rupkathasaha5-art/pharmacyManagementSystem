import { createContext, useState, useEffect } from "react";

export const AppContext = createContext();

export const AppContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  
  // 1. Initialize state from localStorage so it survives a refresh!
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("isLoggedIn") === "true";
  });
  
  const [userData, setUserData] = useState(() => {
    const savedUser = localStorage.getItem("userData");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  // Initialize the cart as an empty array
  const [cart, setCart] = useState([]);

  // 2. Automatically sync state changes to localStorage
  useEffect(() => {
    localStorage.setItem("isLoggedIn", isLoggedIn);
    if (userData) {
      localStorage.setItem("userData", JSON.stringify(userData));
    } else {
      localStorage.removeItem("userData");
    }
  }, [isLoggedIn, userData]);

  // Core function to handle adding batch objects to the cart
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

  // Optional helper function to remove items from the cart entirely
  const removeFromCart = (batchId) => {
    setCart((prevCart) => prevCart.filter(item => item._id !== batchId));
  };

  // Optional helper function to update quantity directly via input counters
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
