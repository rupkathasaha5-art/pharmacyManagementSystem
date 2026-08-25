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
import Checkout from "./pages/Checkout.jsx";
import PaymentPage from './pages/PaymentPage.jsx';

// Protected & Admin Modules
import ProtectedRoute from './components/ProtectedRoute.jsx';
import SuperAdminKYC from "./components/SuperAdminKYC.jsx";
import AddProductForm from "./components/AddProductForm.jsx";
import AddInventoryForm from "./components/AddInventoryForm.jsx";
import OrderTrackingDashboard from "./pages/OrderTrackingDashboard.jsx";
import AccountsReceivable from "./pages/AccountsReceivables.jsx";
import ActiveManifest from "./pages/ActiveManifest.jsx";
import DropOffOtp from "./pages/DropOffOtp.jsx";
import DeliveryLedger from "./pages/DeliveryLedger.jsx";
import ManufacturerReturns from "./pages/ManufacturerReturns.jsx";
import OrderConfirmation from "./pages/OrderConfirmation.jsx";
import MyOrders from "./pages/MyOrders.jsx";
import Wallet from "./pages/Wallet.jsx";
import SettleCredit from "./pages/SettleCredit.jsx";
import ComplianceProfile from "./pages/ComplianceProfile.jsx";

function App() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      
      <main className="flex-1">
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
          
          {/* --- DEDICATED TOP-LEVEL CHECKOUT & PAYMENT ROUTES --- */}
          <Route element={<ProtectedRoute allowedRoles={['ORG_ADMIN']} />}>
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/payment/:orderId" element={<PaymentPage />} />
            <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
            <Route path="/settle-credit" element={<SettleCredit />} />
          </Route>

          {/* --- DASHBOARD & ROLE-BASED SUB-ROUTES --- */}
          <Route path="/dashboard">
            <Route index element={<Dashboard />} />

            <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
              <Route path="kyc" element={<SuperAdminKYC />} />
              <Route path="add-product" element={<AddProductForm />} />
              <Route path="add-inventory" element={<AddInventoryForm />} />
              <Route path="track-orders" element={<OrderTrackingDashboard/>}/>
              <Route path="receivables" element={<AccountsReceivable/>}/>
              <Route path="return-to-manufacturer" element={<ManufacturerReturns />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['ORG_ADMIN']} />}>
              <Route path="place-order" element={<PlaceOrder />} />
              <Route path="my-orders" element={<MyOrders />} />
              <Route path="wallet" element={<Wallet />} />
              <Route path="profile" element={<ComplianceProfile />} />
            </Route>
            
            <Route element={<ProtectedRoute allowedRoles={['DRIVER']} />}>
              <Route path="manifest" element={<ActiveManifest />} />
              <Route path="dropoff" element={<DropOffOtp />} />
              <Route path="ledger" element={<DeliveryLedger />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;