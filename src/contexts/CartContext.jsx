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
  const [menuItems, setMenuItems] = useState([]);

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

  const addToCart = (item, menuItems = []) => {
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

      // Find the menu item to check stock
      const menuItem = menuItems.find(mi => mi.id === item.id);
      const availableStock = menuItem ? (menuItem.stock || 0) : 0;
      
      // Calculate current quantity in cart for this item
      const currentCartQuantity = existingItem ? existingItem.quantity : 0;
      
      // Check if adding one more would exceed stock
      if (currentCartQuantity + 1 > availableStock) {
        // Don't add to cart if it would exceed stock
        return prev;
      }

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

  const updateQuantity = (itemKey, quantity, menuItems = []) => {
    if (quantity <= 0) {
      removeFromCart(itemKey);
      return;
    }
    
    setCartItems(prev => {
      const cartItem = prev.find(item => (item.uniqueKey || item.id) === itemKey);
      if (!cartItem) return prev;
      
      // Find the menu item to check stock
      const menuItem = menuItems.find(mi => mi.id === cartItem.id);
      const availableStock = menuItem ? (menuItem.stock || 0) : 0;
      
      // Don't allow quantity to exceed available stock
      const finalQuantity = Math.min(quantity, availableStock);
      
      return prev.map(item =>
        (item.uniqueKey || item.id) === itemKey ? { ...item, quantity: finalQuantity } : item
      );
    });
  };

  const canAddToCart = (item, menuItems = []) => {
    const menuItem = menuItems.find(mi => mi.id === item.id);
    const availableStock = menuItem ? (menuItem.stock || 0) : 0;
    
    // Find current quantity in cart
    const itemKey = item.selectedAddOns && item.selectedAddOns.length > 0 
      ? `${item.id}_${item.selectedAddOns.map(addon => `${addon.id}_${addon.quantity}`).join('_')}`
      : item.id;
    
    const existingItem = cartItems.find(cartItem => {
      if (item.selectedAddOns && item.selectedAddOns.length > 0) {
        return cartItem.uniqueKey === itemKey;
      } else {
        return cartItem.id === item.id && (!cartItem.selectedAddOns || cartItem.selectedAddOns.length === 0);
      }
    });
    
    const currentCartQuantity = existingItem ? existingItem.quantity : 0;
    return currentCartQuantity < availableStock;
  };

  const getAvailableStock = (item, menuItems = []) => {
    const menuItem = menuItems.find(mi => mi.id === item.id);
    return menuItem ? (menuItem.stock || 0) : 0;
  };

  const getCurrentCartQuantity = (item) => {
    const itemKey = item.selectedAddOns && item.selectedAddOns.length > 0 
      ? `${item.id}_${item.selectedAddOns.map(addon => `${addon.id}_${addon.quantity}`).join('_')}`
      : item.id;
    
    const existingItem = cartItems.find(cartItem => {
      if (item.selectedAddOns && item.selectedAddOns.length > 0) {
        return cartItem.uniqueKey === itemKey;
      } else {
        return cartItem.id === item.id && (!cartItem.selectedAddOns || cartItem.selectedAddOns.length === 0);
      }
    });
    
    return existingItem ? existingItem.quantity : 0;
  };

  const cleanupUnavailableItems = (menuItemsData = menuItems) => {
    setCartItems(prev => {
      const validItems = prev.filter(cartItem => {
        const menuItem = menuItemsData.find(mi => mi.id === cartItem.id);
        
        // Remove items that are no longer active or have no stock
        if (!menuItem || !menuItem.isActive || (menuItem.stock || 0) === 0) {
          return false;
        }
        
        return true;
      }).map(cartItem => {
        const menuItem = menuItemsData.find(mi => mi.id === cartItem.id);
        const availableStock = menuItem ? (menuItem.stock || 0) : 0;
        
        // Adjust quantity if it exceeds available stock
        if (cartItem.quantity > availableStock) {
          return { ...cartItem, quantity: availableStock };
        }
        
        return cartItem;
      });
      
      return validItems;
    });
  };

  const updateMenuItems = (items) => {
    console.log('CartContext: Updating menu items with', items.length, 'items');
    
    // Log items with stock for debugging
    items.forEach(item => {
      if (item.stock !== undefined) {
        console.log(`CartContext: ${item.name} - Stock: ${item.stock}, Active: ${item.isActive}`);
      }
    });
    
    setMenuItems(items);
    // Auto-cleanup cart when menu items are updated
    cleanupUnavailableItems(items);
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
    menuItems,
    updateMenuItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getDeliveryFee,
    getTotalItems,
    canAddToCart,
    getAvailableStock,
    getCurrentCartQuantity,
    cleanupUnavailableItems
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};