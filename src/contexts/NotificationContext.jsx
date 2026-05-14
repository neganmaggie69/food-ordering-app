import { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user, isAdmin } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Listen to notifications for current user
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    // Simplified query to avoid index requirements
    // We'll fetch only the latest 20 notifications
    const q = query(
      collection(db, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allNotifications = snapshot.docs.map(doc => {
        const data = doc.data();
        // Remove any existing id field from data to prevent overwriting
        const { id: dataId, ...cleanData } = data;
        return {
          id: doc.id, // Always use Firestore document ID
          ...cleanData,
          createdAt: data.createdAt?.toDate() || new Date()
        };
      });

      // Filter notifications client-side based on user role
      let userNotifications = [];
      
      if (isAdmin) {
        // Admin gets all notifications
        userNotifications = allNotifications;
      } else {
        // Regular users get their personal notifications and general ones
        userNotifications = allNotifications.filter(notification => 
          notification.recipientId === user.uid || 
          notification.recipientId === 'all' ||
          notification.type === 'all'
        );
      }

      setNotifications(userNotifications);
      
      // Count unread notifications
      const unread = userNotifications.filter(n => !n.read).length;
      setUnreadCount(unread);
      
      setLoading(false);

      // Show toast for new notifications (only if not initial load)
      if (notifications.length > 0) {
        const newNotifications = userNotifications.filter(n => 
          !notifications.find(existing => existing.id === n.id) && !n.read
        );
        
        newNotifications.forEach(notification => {
          if (notification.showToast !== false) {
            toast(notification.message, {
              icon: getNotificationIcon(notification.category),
              duration: 4000,
            });
          }
        });
      }
    }, (error) => {
      console.error('Error listening to notifications:', error);
      setLoading(false);
    });

    return unsubscribe;
  }, [user, isAdmin, notifications.length]);

  // Create a new notification
  const createNotification = async (notificationData) => {
    try {
      console.log('Creating notification:', notificationData);
      
      const docRef = await addDoc(collection(db, 'notifications'), {
        ...notificationData,
        createdAt: serverTimestamp(),
        read: false,
        id: null // Firestore will generate this
      });
      
      console.log('Notification created with ID:', docRef.id);
      return docRef;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      if (!notificationId) {
        console.error('Cannot mark notification as read: ID is null or undefined');
        return;
      }
      
      console.log('Marking notification as read:', notificationId);
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
        readAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read && n.id);
      if (unreadNotifications.length === 0) {
        console.log('No unread notifications to mark as read');
        return;
      }
      
      console.log('Marking all notifications as read:', unreadNotifications.length);
      const promises = unreadNotifications.map(n => 
        updateDoc(doc(db, 'notifications', n.id), {
          read: true,
          readAt: serverTimestamp()
        })
      );
      await Promise.all(promises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      if (!notificationId) {
        console.error('Cannot delete notification: ID is null or undefined');
        return;
      }
      
      console.log('Deleting notification:', notificationId);
      await deleteDoc(doc(db, 'notifications', notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Helper function to get notification icon
  const getNotificationIcon = (category) => {
    switch (category) {
      case 'order':
        return '🍽️';
      case 'payment':
        return '💳';
      case 'delivery':
        return '🚚';
      case 'menu':
        return '📋';
      case 'system':
        return '⚙️';
      case 'promotion':
        return '🎉';
      case 'warning':
        return '⚠️';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '🔔';
    }
  };

  // Predefined notification creators for common scenarios
  const notificationHelpers = {
    // Order notifications
    orderPlaced: (orderData) => {
      const { customerName, total, items } = orderData;
      const itemCount = items?.length || 0;
      
      // Create a description of items
      let itemDescription = '';
      if (itemCount === 0) {
        itemDescription = 'items';
      } else if (itemCount === 1) {
        itemDescription = items[0].name;
      } else if (itemCount === 2) {
        itemDescription = `${items[0].name}, ${items[1].name}`;
      } else if (itemCount === 3) {
        itemDescription = `${items[0].name}, ${items[1].name}, ${items[2].name}`;
      } else {
        itemDescription = `${items[0].name}, ${items[1].name} & ${itemCount - 2} more items`;
      }
      
      const message = `New order: ${itemDescription} - ₹${total} from ${customerName}`;
      
      console.log('Creating order placed notification:', orderData);
      return createNotification({
        type: 'admin',
        category: 'order',
        title: 'New Order Received',
        message,
        data: { customerName, total, itemCount, itemDescription },
        priority: 'high',
        recipientId: 'admin'
      });
    },

    orderStatusChanged: (orderData, status, recipientId) => {
      const { items } = orderData || {};
      const itemCount = items?.length || 0;
      
      // Create a description of items
      let message = '';
      if (itemCount === 0) {
        message = `Your order is now ${status}`;
      } else if (itemCount === 1) {
        message = `Your order (${items[0].name}) is now ${status}`;
      } else if (itemCount === 2) {
        message = `Your order (${items[0].name}, ${items[1].name}) is now ${status}`;
      } else if (itemCount === 3) {
        message = `Your order (${items[0].name}, ${items[1].name}, ${items[2].name}) is now ${status}`;
      } else {
        message = `Your order (${items[0].name}, ${items[1].name} & ${itemCount - 2} more items) is now ${status}`;
      }
      
      return createNotification({
        type: 'user',
        recipientId,
        category: 'order',
        title: 'Order Status Updated',
        message,
        data: { status, itemCount },
        priority: 'medium'
      });
    },

    orderDelivered: (orderData, recipientId) => {
      const { items } = orderData;
      const itemCount = items?.length || 0;
      
      // Create a description of items
      let itemDescription = '';
      if (itemCount === 0) {
        itemDescription = 'your order';
      } else if (itemCount === 1) {
        itemDescription = items[0].name;
      } else if (itemCount === 2) {
        itemDescription = `${items[0].name}, ${items[1].name}`;
      } else if (itemCount === 3) {
        itemDescription = `${items[0].name}, ${items[1].name}, ${items[2].name}`;
      } else {
        itemDescription = `${items[0].name}, ${items[1].name} & ${itemCount - 2} more items`;
      }
      
      return createNotification({
        type: 'user',
        recipientId,
        category: 'delivery',
        title: 'Order Delivered',
        message: `Your order (${itemDescription}) has been delivered successfully!`,
        data: { itemDescription, itemCount },
        priority: 'high'
      });
    },

    // Menu notifications
    menuItemAdded: (itemName) => createNotification({
      type: 'all',
      recipientId: 'all',
      category: 'menu',
      title: 'New Menu Item',
      message: `New item added: ${itemName}`,
      data: { itemName },
      priority: 'low',
      showToast: false // Don't show toast for menu updates
    }),

    menuItemOutOfStock: (itemName) => createNotification({
      type: 'admin',
      category: 'menu',
      title: 'Item Out of Stock',
      message: `${itemName} is now out of stock`,
      data: { itemName },
      priority: 'medium'
    }),

    // System notifications
    systemMaintenance: (message, scheduledTime) => createNotification({
      type: 'all',
      recipientId: 'all',
      category: 'system',
      title: 'Scheduled Maintenance',
      message,
      data: { scheduledTime },
      priority: 'high'
    }),

    // Promotion notifications
    newPromotion: (title, description, code) => createNotification({
      type: 'all',
      recipientId: 'all',
      category: 'promotion',
      title,
      message: description,
      data: { code },
      priority: 'medium'
    }),

    // Payment notifications
    paymentReceived: (orderId, amount) => createNotification({
      type: 'admin',
      category: 'payment',
      title: 'Payment Received',
      message: `Payment of ₹${amount} received for order #${orderId}`,
      data: { orderId, amount },
      priority: 'medium'
    }),

    paymentFailed: (orderId, recipientId) => createNotification({
      type: 'user',
      recipientId,
      category: 'payment',
      title: 'Payment Failed',
      message: `Payment failed for order #${orderId}. Please try again.`,
      data: { orderId },
      priority: 'high'
    })
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    ...notificationHelpers
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};