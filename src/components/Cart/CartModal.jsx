import { useState } from 'react';
import { X, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import CheckoutModal from './CheckoutModal';
import './CartModal.scss';

const CartModal = ({ isOpen, onClose, onLoginRequired, onOrderSuccess }) => {
  const { cartItems, updateQuantity, removeFromCart, getTotalPrice, getTotalItems } = useCart();
  const { user } = useAuth();
  const [showCheckout, setShowCheckout] = useState(false);

  const handleCheckout = () => {
    if (!user) {
      onLoginRequired();
      return;
    }
    setShowCheckout(true);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="cart-modal">
        <div className="modal-content">
          <div className="modal-header">
            <div className="header-content">
              <ShoppingBag />
              <h2>Cart ({getTotalItems()} items)</h2>
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
                {cartItems.map(item => (
                  <div key={item.id} className="cart-item">
                    <div className="item-info">
                      <h3 className="item-name">{item.name}</h3>
                      <p className="item-price">₹{item.price} each</p>
                    </div>
                    
                    <div className="quantity-controls">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="quantity-btn"
                      >
                        <Minus />
                      </button>
                      <span className="quantity">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="quantity-btn primary"
                      >
                        <Plus />
                      </button>
                    </div>
                    
                    <div className="item-total">
                      <p className="total-price">₹{item.price * item.quantity}</p>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="remove-btn"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cartItems.length > 0 && (
            <div className="modal-footer">
              <div className="total-section">
                <span className="total-label">Total:</span>
                <span className="total-amount">₹{getTotalPrice()}</span>
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