import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import FloatingContact from './components/Layout/FloatingContact';
import Footer from './components/Layout/Footer';
import MenuSection from './components/Menu/MenuSection';
import OrdersSection from './components/Orders/OrdersSection';
import AdminOrders from './components/Admin/AdminOrders';
import AdminMenu from './components/Admin/AdminMenu';
import LoginModal from './components/Auth/LoginModal';
import CartModal from './components/Cart/CartModal';
import './styles/global.scss';

function App() {
  const [activeSection, setActiveSection] = useState('menu');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [cartModalOpen, setCartModalOpen] = useState(false);

  const handleOrderSuccess = () => {
    setActiveSection('orders');
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'menu':
        return <MenuSection />;
      case 'orders':
        return <OrdersSection />;
      case 'admin-orders':
        return <AdminOrders />;
      case 'admin-menu':
        return <AdminMenu />;
      default:
        return <MenuSection />;
    }
  };

  return (
    <AuthProvider>
      <CartProvider>
        <NotificationProvider>
          <div className="app">
            <Header
              onMenuClick={() => setSidebarOpen(true)}
              onCartClick={() => setCartModalOpen(true)}
              onLoginClick={() => setLoginModalOpen(true)}
              onLogoClick={() => setActiveSection('menu')}
            />
            
            <Sidebar
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
              activeSection={activeSection}
              onSectionChange={setActiveSection}
            />
            
            <main className="main-content">
              {renderContent()}
            </main>
            
            {/* Footer */}
            <Footer />
            
            {/* Floating Contact Buttons */}
            <FloatingContact />
            
            <LoginModal
              isOpen={loginModalOpen}
              onClose={() => setLoginModalOpen(false)}
            />
            
            <CartModal
              isOpen={cartModalOpen}
              onClose={() => setCartModalOpen(false)}
              onLoginRequired={() => {
                setCartModalOpen(false);
                setLoginModalOpen(true);
              }}
              onOrderSuccess={handleOrderSuccess}
            />
            
            <Toaster
              position="bottom-center"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </div>
        </NotificationProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;