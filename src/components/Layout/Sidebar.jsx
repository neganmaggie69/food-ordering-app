import { X, Home, ShoppingBag, Clock, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './Sidebar.scss';

const Sidebar = ({ isOpen, onClose, activeSection, onSectionChange }) => {
  const { user, isAdmin } = useAuth();

  const menuItems = [
    { id: 'menu', label: 'Menu', icon: Home },
    { id: 'orders', label: 'My Orders', icon: ShoppingBag, requireAuth: true },
  ];

  const adminItems = [
    { id: 'admin-orders', label: 'Live Orders', icon: Clock },
    { id: 'admin-menu', label: 'Manage Menu', icon: Settings },
  ];

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <div className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <h2>Menu</h2>
          <button onClick={onClose} className="close-btn">
            <X />
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            if (item.requireAuth && !user) return null;
            
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSectionChange(item.id);
                  onClose();
                }}
                className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
              >
                <Icon />
                {item.label}
              </button>
            );
          })}

          {isAdmin && (
            <>
              <div className="nav-divider">
                <span>Admin Panel</span>
              </div>
              {adminItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSectionChange(item.id);
                      onClose();
                    }}
                    className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
                  >
                    <Icon />
                    {item.label}
                  </button>
                );
              })}
            </>
          )}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;