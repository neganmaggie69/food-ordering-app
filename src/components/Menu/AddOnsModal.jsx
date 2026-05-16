import { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import './AddOnsModal.scss';

const AddOnsModal = ({ isOpen, onClose, item, onAddToCart, menuItems = [] }) => {
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [quantity, setQuantity] = useState(1);

  if (!isOpen || !item) return null;

  // Get available stock for this item
  const menuItem = menuItems.find(mi => mi.id === item.id);
  const availableStock = menuItem ? (menuItem.stock || 0) : 0;

  const handleAddOnToggle = (addOn) => {
    setSelectedAddOns(prev => {
      const existing = prev.find(selected => selected.id === addOn.id);
      if (existing) {
        return prev.filter(selected => selected.id !== addOn.id);
      } else {
        return [...prev, { ...addOn, quantity: 1 }];
      }
    });
  };

  const handleAddOnQuantityChange = (addOnId, newQuantity) => {
    if (newQuantity === 0) {
      setSelectedAddOns(prev => prev.filter(selected => selected.id !== addOnId));
    } else {
      setSelectedAddOns(prev => 
        prev.map(selected => 
          selected.id === addOnId 
            ? { ...selected, quantity: newQuantity }
            : selected
        )
      );
    }
  };

  const calculateTotalPrice = () => {
    const basePrice = item.price * quantity;
    const addOnsPrice = selectedAddOns.reduce((total, addOn) => {
      return total + (addOn.price * addOn.quantity * quantity);
    }, 0);
    return basePrice + addOnsPrice;
  };

  const handleAddToCart = () => {
    const itemWithAddOns = {
      ...item,
      selectedAddOns: selectedAddOns,
      totalPrice: calculateTotalPrice(),
      quantity: quantity
    };
    
    onAddToCart(itemWithAddOns, quantity);
    onClose();
    
    // Reset state
    setSelectedAddOns([]);
    setQuantity(1);
  };

  const handleClose = () => {
    setSelectedAddOns([]);
    setQuantity(1);
    onClose();
  };

  return (
    <div className="addons-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Customize Your Order</h2>
          <button onClick={handleClose} className="close-btn">
            <X />
          </button>
        </div>

        <div className="modal-body">
          {/* Item Info */}
          <div className="item-info">
            <div className="item-image">
              <img 
                src={item.image || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop&crop=center'} 
                alt={item.name}
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop&crop=center';
                }}
              />
            </div>
            <div className="item-details">
              <div className="item-header">
                {item.isVeg !== undefined && (
                  <div className={`veg-indicator ${item.isVeg ? 'veg' : 'non-veg'}`}>
                    <div className="veg-dot" />
                  </div>
                )}
                <h3 className="item-name">{item.name}</h3>
              </div>
              <p className="item-price">₹{item.price}</p>
              {item.description && (
                <p className="item-description">{item.description}</p>
              )}
            </div>
          </div>

          {/* Add-ons Section */}
          {item.addOns && item.addOns.length > 0 && (
            <div className="addons-section">
              <h3>Add-ons (Optional)</h3>
              <div className="addons-list">
                {item.addOns.map(addOn => {
                  const selectedAddOn = selectedAddOns.find(selected => selected.id === addOn.id);
                  const isSelected = !!selectedAddOn;
                  const addOnQuantity = selectedAddOn?.quantity || 0;

                  return (
                    <div key={addOn.id} className={`addon-item ${isSelected ? 'selected' : ''}`}>
                      <div className="addon-info">
                        <span className="addon-name">{addOn.name}</span>
                        <span className="addon-price">+₹{addOn.price}</span>
                      </div>
                      
                      {!isSelected ? (
                        <button 
                          onClick={() => handleAddOnToggle(addOn)}
                          className="add-addon-btn"
                        >
                          <Plus />
                          Add
                        </button>
                      ) : (
                        <div className="addon-quantity-controls">
                          <button 
                            onClick={() => handleAddOnQuantityChange(addOn.id, addOnQuantity - 1)}
                            className="quantity-btn"
                          >
                            <Minus />
                          </button>
                          <span className="quantity">{addOnQuantity}</span>
                          <button 
                            onClick={() => handleAddOnQuantityChange(addOn.id, addOnQuantity + 1)}
                            className="quantity-btn"
                          >
                            <Plus />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Section */}
          <div className="quantity-section">
            <h3>Quantity</h3>
            {availableStock > 0 && (
              <p className="stock-info">
                {availableStock <= 10 ? `Only ${availableStock} available` : `${availableStock} available`}
              </p>
            )}
            <div className="quantity-controls">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="quantity-btn"
                disabled={quantity <= 1}
              >
                <Minus />
              </button>
              <span className="quantity">{quantity}</span>
              <button 
                onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                className="quantity-btn"
                disabled={quantity >= availableStock}
              >
                <Plus />
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div className="total-price">
            <span>Total: ₹{calculateTotalPrice()}</span>
          </div>
          <button 
            onClick={handleAddToCart} 
            className="add-to-cart-btn"
            disabled={availableStock === 0 || quantity > availableStock}
          >
            {availableStock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddOnsModal;