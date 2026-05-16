import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Clock, CheckCircle, XCircle, Truck, Phone, MapPin, CreditCard, ChevronDown, Filter } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import LoadingSpinner from '../UI/LoadingSpinner';
import toast from 'react-hot-toast';
import './AdminOrders.scss';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const { user } = useAuth();
  const { orderStatusChanged, orderDelivered, paymentReceived } = useNotifications();

  useEffect(() => {
    const q = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersList);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFilterDropdown && !event.target.closest('.filter-container')) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilterDropdown]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const order = orders.find(o => o.id === orderId);
      
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: new Date()
      });
      
      // Create notifications for status changes
      try {
        if (order && order.userId) {
          await orderStatusChanged(order, newStatus, order.userId, user?.uid);
          
          // Special notification for delivery
          if (newStatus === 'delivered') {
            await orderDelivered(order, order.userId, user?.uid);
          }
        }
      } catch (notificationError) {
        console.error('Error creating status change notification:', notificationError);
        // Don't fail the status update if notifications fail
      }
      
      toast.success('Order status updated');
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Error updating order status');
    }
  };

  const updatePaymentStatus = async (orderId, newPaymentStatus) => {
    try {
      const order = orders.find(o => o.id === orderId);
      
      await updateDoc(doc(db, 'orders', orderId), {
        paymentStatus: newPaymentStatus,
        updatedAt: new Date()
      });
      
      // Create notification for payment received
      try {
        if (newPaymentStatus === 'paid' && order) {
          await paymentReceived(orderId, order.totalAmount);
        }
      } catch (notificationError) {
        console.error('Error creating payment notification:', notificationError);
        // Don't fail the payment update if notifications fail
      }
      
      toast.success('Payment status updated');
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Error updating payment status');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'preparing':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'ready':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'delivered':
        return <Truck className="h-5 w-5 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filterOptions = [
    { value: 'all', label: 'All Orders', count: orders.length },
    { value: 'pending', label: 'Pending', count: orders.filter(o => o.status === 'pending').length },
    { value: 'preparing', label: 'Preparing', count: orders.filter(o => o.status === 'preparing').length },
    { value: 'ready', label: 'Ready', count: orders.filter(o => o.status === 'ready').length },
    { value: 'delivered', label: 'Delivered', count: orders.filter(o => o.status === 'delivered').length },
    { value: 'cancelled', label: 'Cancelled', count: orders.filter(o => o.status === 'cancelled').length }
  ];

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => order.status === filter);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="admin-orders">
      <div className="orders-header">
        <div className="header-left">
          <h2 className="page-title">Live Orders</h2>
          <div className="orders-count">
            {filteredOrders.length} {filteredOrders.length === 1 ? 'Order' : 'Orders'}
          </div>
        </div>
        
        <div className="filter-container">
          <button 
            className="filter-btn"
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
          >
            <Filter className="icon" />
            <span>{filterOptions.find(opt => opt.value === filter)?.label}</span>
            <ChevronDown className="chevron" />
          </button>
          
          {showFilterDropdown && (
            <div className="filter-dropdown">
              {filterOptions.map(option => (
                <button
                  key={option.value}
                  className={`filter-option ${filter === option.value ? 'active' : ''}`}
                  onClick={() => {
                    setFilter(option.value);
                    setShowFilterDropdown(false);
                  }}
                >
                  <span>{option.label}</span>
                  <span className="count">{option.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-content">
            <Truck className="empty-icon" />
            <h3>No orders found</h3>
            <p>Orders will appear here when customers place them</p>
          </div>
        </div>
      ) : (
        <div className="orders-grid">
          {filteredOrders.map(order => (
            <div key={order.id} className={`order-card ${order.status}`}>
              <div className="order-header">
                <div className="order-info">
                  <div className="order-number">#{order.id.slice(-6)}</div>
                  <div className="order-time">
                    {order.createdAt?.toDate?.()?.toLocaleTimeString() || 'Time not available'}
                  </div>
                </div>
                <div className={`order-status ${order.status}`}>
                  {getStatusIcon(order.status)}
                  <span>{order.status}</span>
                </div>
              </div>

              <div className="order-content">
                <div className="customer-info">
                  <Phone className="icon" />
                  <a href={`tel:${order.userPhone}`} className="phone-link">
                    {order.userPhone}
                  </a>
                </div>

                <div className="order-items">
                  {order.items?.map((item, index) => (
                    <div key={index} className="order-item">
                      <span className="item-name">{item.name}</span>
                      <div className="item-details">
                        <span className="quantity">x{item.quantity}</span>
                        <span className="price">₹{item.price * item.quantity}</span>
                      </div>
                    </div>
                  ))}
                  <div className="total-row">
                    <span>Total</span>
                    <span className="total-amount">₹{order.totalAmount}</span>
                  </div>
                </div>

                <div className="order-details">
                  <div className="payment-info">
                    <CreditCard className="icon" />
                    <span>{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</span>
                    <span className={`payment-status ${order.paymentStatus || 'pending'}`}>
                      {order.paymentStatus === 'paid' ? '✓ Paid' : 
                       order.paymentStatus === 'failed' ? '✗ Failed' : 
                       order.paymentMethod === 'cod' ? 'COD' : 'Pending'}
                    </span>
                  </div>
                  
                  {order.address && (
                    <div className="address-info">
                      <MapPin className="icon" />
                      <span className="address">{order.address}</span>
                    </div>
                  )}
                </div>

                <div className="order-actions">
                  {order.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        className="action-btn primary"
                      >
                        Start Preparing
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                        className="action-btn danger"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      className="action-btn success full-width"
                    >
                      Mark Ready
                    </button>
                  )}
                  
                  {order.status === 'ready' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'delivered')}
                      className="action-btn success full-width"
                    >
                      Mark Delivered
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;