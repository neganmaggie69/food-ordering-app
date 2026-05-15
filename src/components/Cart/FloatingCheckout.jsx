import { useState } from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import CartModal from './CartModal';
import './FloatingCheckout.scss';

const FloatingCheckout = ({ onLoginRequired, onOrderSuccess }) => {
  const { cartItems, getTotalItems, getTotalPrice, getDeliveryFee } = useCart();
  const { user } = useAuth();
  const [showCartModal, setShowCartModal] = useState(false);

  // Don't show if cart is empty
  if (cartItems.length === 0) return null;

  const handleClick = () => {
    setShowCartModal(true);
  };

  const handleCloseCart = () => {
    setShowCartModal(false);
  };

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice(); // Only item total, no delivery fee

  return (
    <>
      <div className="floating-checkout">
        <button onClick={handleClick} className="checkout-button">
          <div className="button-content">
            <div className="left-section">
              <div className="cart-icon-wrapper">
                <ShoppingBag className="cart-icon" />
                <span className="item-count">{totalItems}</span>
              </div>
              <div className="cart-info">
                <span className="total-price">₹{totalPrice}</span>
              </div>
            </div>
            
            <div className="separator"></div>
            
            <div className="right-section">
              <span className="checkout-text">Proceed to Checkout</span>
              <ArrowRight className="arrow-icon" />
            </div>
          </div>
        </button>
      </div>

      <CartModal
        isOpen={showCartModal}
        onClose={handleCloseCart}
        onLoginRequired={onLoginRequired}
        onOrderSuccess={onOrderSuccess}
      />
    </>
  );
};

export default FloatingCheckout;