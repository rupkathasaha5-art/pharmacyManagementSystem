import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

  // 1. Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("isLoggedIn") === "true";
  });

  const [userData, setUserData] = useState(() => {
    try {
      const savedUser = localStorage.getItem("userData");
      if (savedUser && savedUser !== "undefined" && savedUser !== "[object Object]") {
        return JSON.parse(savedUser);
      }
      return null;
    } catch (error) {
      console.error("Corrupted userData in localStorage. Wiping clean.", error);
      localStorage.removeItem("userData");
      return null;
    }
  });
  
  // 2. Cart State
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem("cart");
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (e) {
      return [];
    }
  });
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState('');

  // Keep a debounce timer + the "latest" cart around so quick successive
  // +/- clicks collapse into a single network sync instead of one per click
  const syncTimerRef = useRef(null);
  const latestCartRef = useRef(cart);

  // 3. Fetch Cart from Backend — extracted so it can be called on login AND manually (refreshCart)
  const fetchCart = useCallback(async () => {
    if (!isLoggedIn) {
      setCart([]);
      setIsCartLoaded(false);
      return;
    }
    try {
      setCartLoading(true);
      setCartError('');
      console.log("📥 [FETCH CART] Fetching cart from backend...");
      const res = await axios.get(`${backendUrl}/api/v1/users/cart`, {
        withCredentials: true
      });
      if (res.data && res.data.success) {
        const fetchedItems = res.data.data?.items;
        const validItems = Array.isArray(fetchedItems) ? fetchedItems : [];
        console.log("📥 [FETCH CART SUCCESS]:", validItems);
        setCart(validItems);
        latestCartRef.current = validItems;
      }
    } catch (error) {
      console.error("❌ [FETCH CART FAILED]:", error.response?.data || error.message);
      setCartError('Could not load your cart. Please try again.');
    } finally {
      setIsCartLoaded(true);
      setCartLoading(false);
    }
  }, [isLoggedIn, backendUrl]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // 4. Sync Auth to LocalStorage
  useEffect(() => {
    localStorage.setItem("isLoggedIn", isLoggedIn);
    if (userData) {
      localStorage.setItem("userData", JSON.stringify(userData));
    } else {
      localStorage.removeItem("userData");
    }
  }, [isLoggedIn, userData]);

  // Save cart to localStorage as instant backup
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // Actually hits the backend — called only after the debounce window below
  const syncCartToDB = async (updatedCart) => {
    if (!isLoggedIn) return;
    try {
      const safeCart = Array.isArray(updatedCart) ? updatedCart : [];
      console.log("📤 [FRONTEND SYNCING CART TO DB NOW]:", safeCart);

      const response = await axios.post(
        `${backendUrl}/api/v1/users/cart/sync`,
        { items: safeCart },
        { withCredentials: true }
      );
      console.log("✅ [SYNC SUCCESS RESPONSE]:", response.data);
      setCartError('');
    } catch (error) {
      console.error("❌ [FAILED TO SYNC CART TO DB]:", error.response?.data || error.message);
      setCartError('Failed to save cart changes. Please check your connection.');
    }
  };

  // Debounces rapid successive edits (e.g. holding the + button) into one request,
  // and always sends the MOST RECENT cart state, not a stale closure of it
  const scheduleSync = (updatedCart) => {
    latestCartRef.current = updatedCart;
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
    }
    syncTimerRef.current = setTimeout(() => {
      syncCartToDB(latestCartRef.current);
    }, 400);
  };

  const safeCartArray = Array.isArray(cart) ? cart : [];
  const totalCartItems = safeCartArray.reduce((total, item) => total + (item?.orderQuantity || 0), 0);

  const addToCart = (newItem) => {
    console.log("➕ [CONTEXT ADD TO CART CALLED]:", newItem);
    setCart((prevCart) => {
      const currentCart = Array.isArray(prevCart) ? prevCart : [];
      const existingItemIndex = currentCart.findIndex(item => item._id === newItem._id);

      let updatedCart = [];
      if (existingItemIndex >= 0) {
        updatedCart = [...currentCart];
        const newQuantity = updatedCart[existingItemIndex].orderQuantity + newItem.orderQuantity;
        const maxStock = newItem.totalStock !== undefined ? newItem.totalStock : newQuantity;
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          orderQuantity: Math.min(newQuantity, maxStock)
        };
      } else {
        updatedCart = [...currentCart, newItem];
      }

      scheduleSync(updatedCart);
      return updatedCart;
    });
  };

 const removeFromCart = (itemId) => {
    console.log("🗑️ [REMOVE] called with itemId:", itemId, typeof itemId);
    setCart(prevCart => {
      const currentCart = Array.isArray(prevCart) ? prevCart : [];
      console.log("🗑️ [REMOVE] current cart _ids:", currentCart.map(i => ({ id: i._id, type: typeof i._id })));
      const updatedCart = currentCart.filter(item => item._id !== itemId);
      console.log("🗑️ [REMOVE] updated cart length:", updatedCart.length, "was:", currentCart.length);
      scheduleSync(updatedCart);
      return updatedCart;
    });
};

  const updateCartQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    setCart(prevCart => {
      const currentCart = Array.isArray(prevCart) ? prevCart : [];
      const updatedCart = currentCart.map(item => {
        if (item._id !== itemId) return item;
        const maxStock = item.totalStock !== undefined ? item.totalStock : newQuantity;
        return { ...item, orderQuantity: Math.min(newQuantity, maxStock) };
      });
      scheduleSync(updatedCart);
      return updatedCart;
    });
  };

  return (
    <AppContext.Provider
      value={{
        backendUrl,
        isLoggedIn,
        setIsLoggedIn,
        userData,
        setUserData,
        cart: safeCartArray,
        setCart,
        totalCartItems,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        isCartLoaded,
        cartLoading,
        cartError,
        refreshCart: fetchCart
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;