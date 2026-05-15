import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [deliveryType, setDeliveryType] = useState('delivery'); // 'pickup' or 'delivery'

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
    
    const savedDeliveryType = localStorage.getItem('deliveryType');
    if (savedDeliveryType) {
      setDeliveryType(savedDeliveryType);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Save delivery type to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('deliveryType', deliveryType);
  }, [deliveryType]);

  const addToCart = (item) => {
    setCartItems(prev => {
      // Create a unique identifier for items with add-ons
      const itemKey = item.selectedAddOns && item.selectedAddOns.length > 0 
        ? `${item.id}_${item.selectedAddOns.map(addon => `${addon.id}_${addon.quantity}`).join('_')}`
        : item.id;
      
      const existingItem = prev.find(cartItem => {
        if (item.selectedAddOns && item.selectedAddOns.length > 0) {
          // For items with add-ons, match by unique key
          return cartItem.uniqueKey === itemKey;
        } else {
          // For regular items, match by id and no add-ons
          return cartItem.id === item.id && (!cartItem.selectedAddOns || cartItem.selectedAddOns.length === 0);
        }
      });

      if (existingItem) {
        return prev.map(cartItem =>
          (item.selectedAddOns && item.selectedAddOns.length > 0 ? cartItem.uniqueKey === itemKey : cartItem.id === item.id)
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      
      // Add new item with unique key for add-ons
      const newItem = { 
        ...item, 
        quantity: 1,
        uniqueKey: itemKey
      };
      
      return [...prev, newItem];
    });
  };

  const removeFromCart = (itemKey) => {
    setCartItems(prev => prev.filter(item => (item.uniqueKey || item.id) !== itemKey));
  };

  const updateQuantity = (itemKey, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemKey);
      return;
    }
    setCartItems(prev =>
      prev.map(item =>
        (item.uniqueKey || item.id) === itemKey ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getTotalPrice = (includeDelivery = false) => {
    const itemsTotal = cartItems.reduce((total, item) => {
      let itemPrice = item.price;
      
      // Add add-ons price if any
      if (item.selectedAddOns && item.selectedAddOns.length > 0) {
        const addOnsPrice = item.selectedAddOns.reduce((addOnTotal, addOn) => {
          return addOnTotal + (addOn.price * addOn.quantity);
        }, 0);
        itemPrice += addOnsPrice;
      }
      
      return total + (itemPrice * item.quantity);
    }, 0);

    // Add delivery fee if delivery is selected and includeDelivery is true
    if (includeDelivery && deliveryType === 'delivery') {
      return itemsTotal + 40; // Standard delivery fee
    }
    
    return itemsTotal;
  };

  const getDeliveryFee = () => {
    return deliveryType === 'delivery' ? 40 : 0;
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const value = {
    cartItems,
    deliveryType,
    setDeliveryType,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getDeliveryFee,
    getTotalItems
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};