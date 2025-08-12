import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { CartProvider } from './context/CartContext';

// Müşteri Sayfaları
import MenuPage from './pages/menu/MenuPage';
import CheckoutPage from './pages/menu/CheckoutPage';
import ThankYouPage from './pages/menu/ThankYouPage';

// Yönetici Sayfaları
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminOrderHistoryPage from './pages/admin/AdminOrderHistoryPage';
import QRCodeGenerator from './components/admin/QRCodeGenerator';
import AdminMenuManagementPage from './pages/admin/AdminMenuManagementPage'; // Import the new component

// Ana Sayfa Yönlendirmesi
const HomePage = () => {
  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-amber-800 mb-6">Kafe QR Sipariş Sistemi</h1>
        <div className="space-y-4">
          <Link
            to="/admin"
            className="block w-full bg-amber-500 hover:bg-amber-600 text-white py-3 px-4 rounded-md transition-colors"
          >
            Yönetim Paneli
          </Link>
          <Link
            to="/admin/qrcodes"
            className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-4 rounded-md transition-colors"
          >
            QR Kodları Görüntüle
          </Link>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <CartProvider>
        <div className="min-h-screen bg-amber-50">
          <Routes>
            {/* Ana Sayfa */}
            <Route path="/" element={<HomePage />} />
            
            {/* Müşteri Sayfaları */}
            <Route path="/menu/:tableId" element={<MenuPage />} />
            <Route path="/checkout/:tableId" element={<CheckoutPage />} />
            <Route path="/thank-you/:tableId" element={<ThankYouPage />} />
            
            {/* Yönetici Sayfaları */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/orders" element={<AdminOrdersPage />} />
            <Route path="/admin/order-history" element={<AdminOrderHistoryPage />} />
            <Route path="/admin/qrcodes" element={<QRCodeGenerator />} />
            <Route path="/admin/menu" element={<AdminMenuManagementPage />} /> {/* Add route for menu management */}
            
            {/* Bilinmeyen URL'ler için ana sayfaya yönlendirme */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </CartProvider>
    </Router>
  );
}

export default App;
