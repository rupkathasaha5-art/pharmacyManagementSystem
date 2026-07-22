import React from "react";
import { Routes, Route, Navigate } from 'react-router-dom';

// Layout / Global Components
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";

// Pages & Layouts
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import RegisterUser from "./pages/RegisterUser";
import PlaceOrder from "./pages/PlaceOrder";
import Orders from "./pages/Orders";
import RegisterOrganization from "./pages/RegisterOrganization";
import Dashboard from "./pages/Dashboard.jsx";

// Protected & Admin Modules
import ProtectedRoute from './components/ProtectedRoute.jsx';
import SuperAdminKYC from "./components/SuperAdminKYC.jsx";
import AddProductForm from "./components/AddProductForm.jsx";

function App() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <Routes>
        {/* --- PUBLIC MARKETING & STOREFRONT ROUTES --- */}
        <Route path="/" element={<Home />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/product/:productId" element={<Product />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<RegisterUser />} />
        <Route path="/register-user" element={<RegisterUser />} />
        <Route path="/register-org" element={<RegisterOrganization />} />
        
        {/* --- DASHBOARD & ROLE-BASED SUB-ROUTES --- */}
        {/* By removing the element={}, this just groups the paths together */}
        <Route path="/dashboard">
          
          {/* Default Dashboard Index */}
          <Route index element={<Dashboard />} />

          {/* 1. SUPER_ADMIN EXCLUSIVE ROUTES */}
          <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
            <Route path="kyc" element={<SuperAdminKYC />} />
            <Route path="add-product" element={<AddProductForm />} />
          </Route>

          {/* 2. ORG_ADMIN (RETAIL CHEMIST) EXCLUSIVE ROUTES */}
          <Route element={<ProtectedRoute allowedRoles={['ORG_ADMIN']} />}>
            <Route path="place-order" element={<PlaceOrder />} />
            <Route path="my-orders" element={<Orders />} />
          </Route>

        </Route>

        {/* Fallback Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Footer />
    </div>
  );
}

export default App;