import { useState } from 'react';
import { X, MapPin, CreditCard, Truck } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import toast from 'react-hot-toast';
import './CheckoutModal.scss';

const CheckoutModal = ({ isOpen, onClose, onOrderSuccess }) => {
  const { cartItems, getTotalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState({
    address: '',
    paymentMethod: 'cod', // 'cod' or 'razorpay'
    notes: ''
  });

  const handleInputChange = (field, value) => {
    setOrderData(prev => ({ ...prev, [field]: value }));
  };

  const initializeRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayPayment = async (orderDetails) => {
    const res = await initializeRazorpay();
    if (!res) {
      toast.error('Razorpay SDK failed to load');
      return false;
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_9WaeLLJnOFJCBz', // Replace with your key
      amount: getTotalPrice() * 100, // Amount in paise
      currency: 'INR',
      name: 'SpiceCraft',
      description: 'Food Order Payment',
      image: '/logosc.jpg', // Your logo
      method: {
        upi: true,
        card: true,
        netbanking: true,
        wallet: true
      },
      handler: async function (response) {
        try {
          // Save order with payment details
          const finalOrder = {
            ...orderDetails,
            paymentId: response.razorpay_payment_id,
            paymentStatus: 'paid',
            razorpaySignature: response.razorpay_signature
          };
          
          await addDoc(collection(db, 'orders'), finalOrder);
          clearCart();
          toast.success('Payment successful! Order placed.');
          onClose();
          if (onOrderSuccess) onOrderSuccess();
        } catch (error) {
          console.error('Error saving order:', error);
          toast.error('Payment successful but order save failed. Please contact support.');
        }
      },
      prefill: {
        contact: user.phoneNumber,
      },
      theme: {
        color: '#1e40af',
      },
    };

    const paymentObject = new window.Razorpay(options);
    
    paymentObject.on('payment.failed', function (response) {
      toast.error('Payment failed. Please try again.');
      console.error('Payment failed:', response.error);
    });
    
    paymentObject.open();
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!orderData.address.trim()) {
      toast.error('Please enter delivery address');
      return;
    }

    setLoading(true);
    try {
      const baseOrder = {
        userId: user.uid,
        userPhone: user.phoneNumber,
        items: cartItems,
        totalAmount: getTotalPrice(),
        address: orderData.address,
        paymentMethod: orderData.paymentMethod,
        notes: orderData.notes,
        status: 'pending',
        paymentStatus: orderData.paymentMethod === 'cod' ? 'pending' : 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (orderData.paymentMethod === 'razorpay') {
        // For Razorpay payment
        const success = await handleRazorpayPayment(baseOrder);
        if (!success) {
          setLoading(false);
          return;
        }
      } else {
        // For COD
        await addDoc(collection(db, 'orders'), baseOrder);
        clearCart();
        toast.success('Order placed successfully!');
        onClose();
        if (onOrderSuccess) onOrderSuccess();
      }
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
                  className={`radio-option ${orderData.paymentMethod === 'razorpay' ? 'selected' : ''}`}
                  onClick={() => handleInputChange('paymentMethod', 'razorpay')}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="razorpay"
                    checked={orderData.paymentMethod === 'razorpay'}
                    onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                  />
                  <div className="option-content">
                    <CreditCard />
                    <span>Online Payment</span>
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
            {loading ? 'Processing...' : 
             orderData.paymentMethod === 'razorpay' ? 
             `Pay ₹${getTotalPrice()}` : 
             `Place Order - ₹${getTotalPrice()}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;