import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { Clock, CheckCircle, XCircle, Truck, ShoppingBag, Calendar, MapPin, CreditCard, Filter, ChevronDown } from 'lucide-react';
import LoadingSpinner from '../UI/LoadingSpinner';
import './OrdersSection.scss';

const OrdersSection = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by createdAt in JavaScript instead of Firestore
      ordersList.sort((a, b) => {
        const aDate = a.createdAt?.toDate?.() || new Date(0);
        const bDate = b.createdAt?.toDate?.() || new Date(0);
        return bDate - aDate;
      });
      
      setOrders(ordersList);
      setFilteredOrders(ordersList);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching orders:', error);
      setOrders([]);
      setFilteredOrders([]);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(order => order.status === statusFilter));
    }
  }, [statusFilter, orders]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFilterDropdown && !event.target.closest('.filter-container')) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilterDropdown]);

  const filterOptions = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Order Received' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'ready', label: 'Ready for Pickup' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

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

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Order Received';
      case 'preparing':
        return 'Preparing';
      case 'ready':
        return 'Ready for Pickup';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
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

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="orders-section">
      <div className="orders-header">
        <div className="header-left">
          <h2 className="page-title">My Orders</h2>
          <div className="orders-count">
            {filteredOrders.length} {filteredOrders.length === 1 ? 'Order' : 'Orders'}
          </div>
        </div>
        
        {orders.length > 0 && (
          <div className="filter-container">
            <button 
              className="filter-btn"
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            >
              <Filter className="icon" />
              <span>{filterOptions.find(opt => opt.value === statusFilter)?.label}</span>
              <ChevronDown className="chevron" />
            </button>
            
            {showFilterDropdown && (
              <div className="filter-dropdown">
                {filterOptions.map(option => (
                  <button
                    key={option.value}
                    className={`filter-option ${statusFilter === option.value ? 'active' : ''}`}
                    onClick={() => {
                      setStatusFilter(option.value);
                      setShowFilterDropdown(false);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-content">
            <ShoppingBag className="empty-icon" />
            <h3>No orders yet</h3>
            <p>Your delicious journey starts with your first order!</p>
          </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-content">
            <Filter className="empty-icon" />
            <h3>No orders found</h3>
            <p>Try changing the filter to see more orders</p>
          </div>
        </div>
      ) : (
        <div className="orders-list">
          {filteredOrders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <div className="order-number">#{order.id.slice(-6)}</div>
                  <div className="order-date">
                    <Calendar className="icon" />
                    <span>{order.createdAt?.toDate?.()?.toLocaleDateString() || 'Date not available'}</span>
                  </div>
                </div>
                <div className={`order-status ${order.status}`}>
                  {getStatusIcon(order.status)}
                  <span>{getStatusText(order.status)}</span>
                </div>
              </div>

              <div className="order-content">
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
                </div>

                <div className="order-footer">
                  <div className="payment-info">
                    <CreditCard className="icon" />
                    <span>{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'UPI'}</span>
                  </div>
                  <div className="total-amount">₹{order.totalAmount}</div>
                </div>
                
                {order.address && (
                  <div className="address-section">
                    <MapPin className="icon" />
                    <span className="address">{order.address}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersSection;