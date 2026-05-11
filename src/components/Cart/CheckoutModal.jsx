import { useState } from 'react';
import { X, MapPin, CreditCard, Truck } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import toast from 'react-hot-toast';
import './CheckoutModal.scss';

const CheckoutModal = ({ isOpen, onClose }) => {
  const { cartItems, getTotalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState({
    address: '',
    paymentMethod: 'cod', // 'cod' or 'upi'
    notes: ''
  });

  const handleInputChange = (field, value) => {
    setOrderData(prev => ({ ...prev, [field]: value }));
  };

  const handlePlaceOrder = async () => {
    if (!orderData.address.trim()) {
      toast.error('Please enter delivery address');
      return;
    }

    setLoading(true);
    try {
      const order = {
        userId: user.uid,
        userPhone: user.phoneNumber,
        items: cartItems,
        totalAmount: getTotalPrice(),
        address: orderData.address,
        paymentMethod: orderData.paymentMethod,
        notes: orderData.notes,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'orders'), order);
      
      clearCart();
      toast.success('Order placed successfully!');
      onClose();
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Error placing order. Please try again.');
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="checkout-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Checkout</h2>
          <button onClick={onClose} className="close-btn">
            <X />
          </button>
        </div>

        <div className="modal-body">
          <div className="section">
            <h3 className="section-title">Order Summary</h3>
            <div className="order-summary">
              {cartItems.map(item => (
                <div key={item.id} className="summary-item">
                  <span>{item.name} x {item.quantity}</span>
                  <span>₹{item.price * item.quantity}</span>
                </div>
              ))}
              <div className="summary-item total">
                <span>Total</span>
                <span>₹{getTotalPrice()}</span>
              </div>
            </div>
          </div>

          <div className="section">
            <div className="form-group">
              <label>
                <MapPin />
                Delivery Address
              </label>
              <textarea
                value={orderData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter your complete delivery address"
                rows={3}
              />
            </div>
          </div>

          <div className="section">
            <div className="form-group">
              <label>
                <CreditCard />
                Payment Method
              </label>
              <div className="radio-group">
                <label 
                  className={`radio-option ${orderData.paymentMethod === 'cod' ? 'selected' : ''}`}
                  onClick={() => handleInputChange('paymentMethod', 'cod')}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={orderData.paymentMethod === 'cod'}
                    onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                  />
                  <div className="option-content">
                    <Truck />
                    <span>Cash on Delivery</span>
                  </div>
                </label>
                <label 
                  className={`radio-option ${orderData.paymentMethod === 'upi' ? 'selected' : ''}`}
                  onClick={() => handleInputChange('paymentMethod', 'upi')}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="upi"
                    checked={orderData.paymentMethod === 'upi'}
                    onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                  />
                  <div className="option-content">
                    <CreditCard />
                    <span>UPI Payment</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="section">
            <div className="form-group">
              <label>Special Instructions (Optional)</label>
              <textarea
                value={orderData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any special instructions for your order"
                rows={2}
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            onClick={handlePlaceOrder}
            disabled={loading}
            className="place-order-btn"
          >
            {loading ? 'Placing Order...' : `Place Order - ₹${getTotalPrice()}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;