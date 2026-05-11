import { useState } from 'react';
import { Menu, ShoppingCart, User, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';
import toast from 'react-hot-toast';
import './Header.scss';

const Header = ({ onMenuClick, onCartClick, onLoginClick }) => {
  const { user, isAdmin } = useAuth();
  const { getTotalItems } = useCart();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
      setShowUserMenu(false);
    } catch (error) {
      toast.error('Error logging out');
    }
  };

  return (
    <header className="header">
      <div className="container">
        <div className="left-section">
          <button onClick={onMenuClick} className="menu-btn">
            <Menu />
          </button>
          <h1 className="logo">SpiceCraft</h1>
        </div>

        <div className="right-section">
          <button onClick={onCartClick} className="cart-btn">
            <ShoppingCart />
            {getTotalItems() > 0 && (
              <span className="cart-badge">{getTotalItems()}</span>
            )}
          </button>

          {user ? (
            <div className="user-menu">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="user-btn"
              >
                <User />
                {isAdmin && <span className="admin-badge">Admin</span>}
              </button>
              
              {showUserMenu && (
                <div className="dropdown">
                  <div className="user-info">
                    {user.phoneNumber || user.email}
                  </div>
                  <button onClick={handleLogout} className="logout-btn">
                    <LogOut />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={onLoginClick} className="login-btn">
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;