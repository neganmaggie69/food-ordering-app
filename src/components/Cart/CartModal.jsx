import { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import CheckoutModal from './CheckoutModal';
import './CartModal.scss';

const CartModal = ({ isOpen, onClose, onLoginRequired, onOrderSuccess }) => {
  const { cartItems, updateQuantity, removeFromCart, getTotalPrice, getTotalItems, menuItems, cleanupUnavailableItems } = useCart();
  const { user } = useAuth();
  const [showCheckout, setShowCheckout] = useState(false);

  // Clean up unavailable items when modal opens
  useEffect(() => {
    if (isOpen && menuItems.length > 0) {
      cleanupUnavailableItems();
    }
  }, [isOpen, menuItems, cleanupUnavailableItems]);

  const handleCheckout = () => {
    if (!user) {
      onLoginRequired();
      return;
    }
    setShowCheckout(true);
  };

  const totalPrice = getTotalPrice();
  const totalItems = getTotalItems();

  if (!isOpen) return null;

  return (
    <>
      <div className="cart-modal">
        <div className="modal-content">
          <div className="modal-header">
            <div className="header-content">
              <ShoppingBag />
              <h2>Cart ({totalItems} items)</h2>
            </div>
            <button onClick={onClose} className="close-btn">
              <X />
            </button>
          </div>

          <div className="modal-body">
            {cartItems.length === 0 ? (
              <div className="empty-cart">
                <ShoppingBag />
                <p className="empty-title">Your cart is empty</p>
                <p className="empty-subtitle">Add some delicious items to get started</p>
              </div>
            ) : (
              <div className="cart-items">
                {cartItems.map(item => {
                  const itemKey = item.uniqueKey || item.id;
                  const basePrice = item.price;
                  const addOnsPrice = item.selectedAddOns ? 
                    item.selectedAddOns.reduce((total, addOn) => total + (addOn.price * addOn.quantity), 0) : 0;
                  const totalItemPrice = (basePrice + addOnsPrice) * item.quantity;

                  return (
                    <div key={itemKey} className="cart-item">
                      <div className="item-info">
                        <h3 className="item-name">{item.name}</h3>
                        <p className="item-price">₹{basePrice} each</p>
                        
                        {/* Display add-ons if any */}
                        {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                          <div className="item-addons">
                            <p className="addons-label">Add-ons:</p>
                            {item.selectedAddOns.map(addOn => (
                              <div key={addOn.id} className="addon-detail">
                                <span className="addon-name">{addOn.name}</span>
                                <span className="addon-quantity">x{addOn.quantity}</span>
                                <span className="addon-price">+₹{addOn.price * addOn.quantity}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="quantity-controls">
                        <button
                          onClick={() => updateQuantity(itemKey, item.quantity - 1, menuItems)}
                          className="quantity-btn"
                        >
                          <Minus />
                        </button>
                        <span className="quantity">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(itemKey, item.quantity + 1, menuItems)}
                          className="quantity-btn primary"
                          disabled={(() => {
                            const menuItem = menuItems.find(mi => mi.id === item.id);
                            const availableStock = menuItem ? (menuItem.stock || 0) : 0;
                            return item.quantity >= availableStock;
                          })()}
                        >
                          <Plus />
                        </button>
                      </div>
                      
                      <div className="item-total">
                        <p className="total-price">₹{totalItemPrice}</p>
                        <button
                          onClick={() => removeFromCart(itemKey)}
                          className="remove-btn"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {cartItems.length > 0 && totalPrice > 0 && (
            <div className="modal-footer">
              <div className="total-section">
                <span className="total-label">Total:</span>
                <span className="total-amount">₹{totalPrice}</span>
              </div>
              
              <button onClick={handleCheckout} className="checkout-btn">
                {user ? 'Proceed to Checkout' : 'Login to Order'}
              </button>
            </div>
          )}
        </div>
      </div>

      {showCheckout && (
        <CheckoutModal
          isOpen={showCheckout}
          onClose={() => setShowCheckout(false)}
          onOrderSuccess={() => {
            setShowCheckout(false);
            onClose();
            if (onOrderSuccess) onOrderSuccess();
          }}
        />
      )}
    </>
  );
};

export default CartModal;