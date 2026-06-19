import React from "react";
import { Routes, Route } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// Layout / Global Components
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
// Pages
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
import ProtectedRoute from './components/ProtectedRoute.jsx';

function App() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/product/:productId" element={<Product />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<RegisterUser />} />
        <Route path="/place-order" element={<PlaceOrder />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/register-org" element={<RegisterOrganization />} />
        <Route path="/register-user" element={<RegisterUser />} />
        {/*<Route element={<ProtectedRoute allowedRoles={['admin', 'superadmin', 'procurement worker']} />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>*/}
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
      <Footer/>
    </div>
  );
}

export default App;