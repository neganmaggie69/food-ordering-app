import { useState } from 'react';
import { X, MapPin, CreditCard, Truck } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import toast from 'react-hot-toast';
import './CheckoutModal.scss';

const CheckoutModal = ({ isOpen, onClose, onOrderSuccess }) => {
  const { cartItems, getTotalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { orderPlaced } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState({
    address: '',
    paymentMethod: 'cod', // 'cod' or 'razorpay'
    notes: ''
  });
  const [confirmationChecked, setConfirmationChecked] = useState(false);

  const cleanObjectForFirestore = (obj) => {
    const cleaned = {};
    Object.keys(obj).forEach(key => {
      if (obj[key] !== undefined && obj[key] !== null) {
        if (typeof obj[key] === 'object' && !Array.isArray(obj[key]) && !(obj[key] instanceof Date)) {
          cleaned[key] = cleanObjectForFirestore(obj[key]);
        } else {
          cleaned[key] = obj[key];
        }
      }
    });
    return cleaned;
  };

  const validateOrderData = (orderData) => {
    const required = ['userId', 'items', 'totalAmount', 'address', 'paymentMethod'];
    const missing = required.filter(field => !orderData[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
    
    if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
      throw new Error('Order must contain at least one item');
    }
    
    if (orderData.totalAmount <= 0) {
      throw new Error('Order total must be greater than 0');
    }
    
    return true;
  };

  const saveOrderWithRetry = async (orderData, maxRetries = 3) => {
    // Clean and validate order data first
    const cleanedData = cleanObjectForFirestore(orderData);
    validateOrderData(cleanedData);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt} to save order:`, cleanedData);
        const docRef = await addDoc(collection(db, 'orders'), cleanedData);
        console.log('Order saved successfully with ID:', docRef.id);
        return docRef;
      } catch (error) {
        console.error(`Attempt ${attempt} failed:`, error);
        if (attempt === maxRetries) {
          throw error;
        }
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  };

  const handleInputChange = (field, value) => {
    console.log('Changing field:', field, 'to value:', value);
    setOrderData(prev => ({ ...prev, [field]: value }));
  };

  const initializeRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        console.log('Razorpay SDK loaded successfully');
        resolve(true);
      };
      script.onerror = () => {
        console.error('Failed to load Razorpay SDK');
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const handleRazorpayPayment = async (orderDetails) => {
    try {
      const res = await initializeRazorpay();
      if (!res) {
        toast.error('Razorpay SDK failed to load. Please check your internet connection.');
        return false;
      }

      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_9WaeLLJnOFJCBz';
      console.log('Using Razorpay key:', razorpayKey);

      const options = {
        key: razorpayKey,
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
        // Save order with payment details - only include defined fields
        const finalOrder = {
          ...orderDetails,
          paymentId: response.razorpay_payment_id,
          paymentStatus: 'paid'
        };
        
        // Only add razorpaySignature if it exists
        if (response.razorpay_signature) {
          finalOrder.razorpaySignature = response.razorpay_signature;
        }
        
        try {
          console.log('Saving order:', finalOrder);
          const docRef = await saveOrderWithRetry(finalOrder);
          console.log('Order saved with ID:', docRef.id);
          
          // Create notifications for order placement
          try {
            await orderPlaced({
              customerName: user.phoneNumber || user.email || 'Customer',
              total: getTotalPrice(),
              items: cartItems
            });
            console.log('Order notification created successfully');
          } catch (notificationError) {
            console.error('Error creating notifications:', notificationError);
            // Don't fail the order if notifications fail
          }
          
          clearCart();
          toast.success('Payment successful! Order placed.');
          onClose();
          if (onOrderSuccess) onOrderSuccess();
        } catch (error) {
          console.error('Error saving order after payment:', error);
          
          // Store failed order locally for recovery
          const failedOrder = {
            ...finalOrder,
            failedAt: new Date().toISOString(),
            error: error.message
          };
          localStorage.setItem('failedOrder_' + response.razorpay_payment_id, JSON.stringify(failedOrder));
          
          // More specific error message
          if (error.code === 'permission-denied') {
            toast.error('Permission denied. Please login again and try.');
          } else if (error.code === 'unavailable') {
            toast.error('Service temporarily unavailable. Your payment was successful. Please contact support with payment ID: ' + response.razorpay_payment_id);
          } else if (error.message.includes('Missing required fields')) {
            toast.error('Order data incomplete. Payment ID: ' + response.razorpay_payment_id + '. Please contact support.');
          } else {
            toast.error('Payment successful but order save failed. Payment ID: ' + response.razorpay_payment_id + '. Please contact support.');
          }
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
    } catch (error) {
      console.error('Error in Razorpay payment:', error);
      toast.error('Error initializing payment. Please try again.');
      return false;
    }
  };

  const handlePlaceOrder = async () => {
    if (!orderData.address.trim()) {
      toast.error('Please enter delivery address');
      return;
    }

    if (!confirmationChecked) {
      toast.error('Please confirm that you understand this service operates only in Bir, Himachal Pradesh, PIN - 176077 area');
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
        const orderDoc = await saveOrderWithRetry(baseOrder);
        
        // Create notifications for order placement
        try {
          // Notify admin about new order with meaningful information
          await orderPlaced({
            customerName: user.phoneNumber || user.email || 'Customer',
            total: getTotalPrice(),
            items: cartItems
          });
          
          console.log('Order notification created successfully');
        } catch (notificationError) {
          console.error('Error creating notifications:', notificationError);
          // Don't fail the order if notifications fail
        }
        
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
              {cartItems.map(item => {
                const itemKey = item.uniqueKey || item.id;
                const basePrice = item.price;
                const addOnsPrice = item.selectedAddOns ? 
                  item.selectedAddOns.reduce((total, addOn) => total + (addOn.price * addOn.quantity), 0) : 0;
                const totalItemPrice = (basePrice + addOnsPrice) * item.quantity;

                return (
                  <div key={itemKey} className="summary-item-group">
                    <div className="summary-item">
                      <span>{item.name} x {item.quantity}</span>
                      <span>₹{totalItemPrice}</span>
                    </div>
                    
                    {/* Display add-ons if any */}
                    {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                      <div className="summary-addons">
                        {item.selectedAddOns.map(addOn => (
                          <div key={addOn.id} className="summary-addon">
                            <span>+ {addOn.name} x{addOn.quantity}</span>
                            <span>₹{addOn.price * addOn.quantity * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
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

          <div className="section">
            <div className="confirmation-checkbox">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={confirmationChecked}
                  onChange={(e) => setConfirmationChecked(e.target.checked)}
                  className="checkbox-input"
                />
                <span className="checkbox-custom"></span>
                <span className="checkbox-text">
                  I confirm that I am ordering from <strong>Bir, Himachal Pradesh, PIN - 176077</strong> and understand that delivery is only available within this location.
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            onClick={handlePlaceOrder}
            disabled={loading || !confirmationChecked}
            className={`place-order-btn ${!confirmationChecked ? 'disabled' : ''}`}
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