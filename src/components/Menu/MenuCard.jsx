import { Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../../contexts/CartContext';
import AddOnsModal from './AddOnsModal';
import './MenuCard.scss';

const MenuCard = ({ item, menuItems = [] }) => {
  const { cartItems, addToCart, updateQuantity, canAddToCart, getAvailableStock, getCurrentCartQuantity } = useCart();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [showAddOnsModal, setShowAddOnsModal] = useState(false);
  
  const cartItem = cartItems.find(cartItem => cartItem.id === item.id);
  const quantity = cartItem ? cartItem.quantity : 0;
  const availableStock = getAvailableStock(item, menuItems);
  const currentCartQuantity = getCurrentCartQuantity(item);
  const canAdd = canAddToCart(item, menuItems);

  const handleAdd = () => {
    if (item.isActive && canAdd) {
      // Check if item has add-ons
      if (item.addOns && item.addOns.length > 0) {
        setShowAddOnsModal(true);
      } else {
        addToCart(item, menuItems);
      }
    }
  };

  const handleAddToCartWithAddOns = (itemWithAddOns, quantity) => {
    // Add the item with selected add-ons to cart
    for (let i = 0; i < quantity; i++) {
      addToCart(itemWithAddOns, menuItems);
    }
  };

  const handleIncrease = () => {
    if (item.isActive && canAdd) {
      updateQuantity(item.id, quantity + 1, menuItems);
    }
  };

  const handleDecrease = () => {
    if (item.isActive) {
      updateQuantity(item.id, quantity - 1, menuItems);
    }
  };

  const handleImageError = (e) => {
    e.target.src = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop&crop=center';
  };

  const toggleDescription = () => {
    setIsDescriptionExpanded(!isDescriptionExpanded);
  };

  // Check if description is long enough to need truncation (roughly 80 characters)
  const needsTruncation = item.description && item.description.length > 35;

  return (
    <>
      <div className={`menu-card ${!item.isActive ? 'disabled' : ''}`}>
        <img 
          src={item.image || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop&crop=center'} 
          alt={item.name} 
          className="menu-card-image"
          onError={handleImageError}
        />
        
        <div className="menu-card-content">
          <div className="menu-card-header">
            <div className="title-row">
              {item.isVeg !== undefined && (
                <div className={`veg-indicator ${item.isVeg ? 'veg' : 'non-veg'}`}>
                  <div className="veg-dot" />
                </div>
              )}
              <h3 className="menu-card-title">{item.name}</h3>
            </div>
            <span className="menu-card-price">₹{item.price}</span>
          </div>

          {item.description && (
            <div className="menu-card-description-container">
              <p className={`menu-card-description ${isDescriptionExpanded ? 'expanded' : ''}`}>
                {item.description}
              </p>
              {needsTruncation && (
                <button 
                  onClick={toggleDescription}
                  className="see-more-btn"
                >
                  {isDescriptionExpanded ? (
                    <>
                      <span>See less</span>
                      <ChevronUp className="chevron-icon" />
                    </>
                  ) : (
                    <>
                      <span>See more</span>
                      <ChevronDown className="chevron-icon" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Add-ons indicator */}
          {item.addOns && item.addOns.length > 0 && (
            <div className="addons-indicator">
              <span>Add-ons available</span>
            </div>
          )}

          {/* Stock indicator - only show low stock warnings, not out of stock */}
          {availableStock <= 10 && availableStock > 0 && (
            <div className="stock-indicator">
              <span className={availableStock <= 5 ? 'low-stock' : 'medium-stock'}>
                Only {availableStock} left!
              </span>
            </div>
          )}

          <div className="menu-card-footer">
            <div className="menu-card-info">
              {item.category && (
                <span className="category-badge">{item.category}</span>
              )}
            </div>

            {!item.isActive || availableStock === 0 ? (
              <div className="unavailable-badge">
                {availableStock === 0 ? 'Out of Stock' : 'Unavailable'}
              </div>
            ) : quantity === 0 ? (
              <button onClick={handleAdd} className="add-btn" disabled={!canAdd}>
                <Plus />
                <span>Add</span>
              </button>
            ) : (
              <div className="quantity-controls">
                <button onClick={handleDecrease} className="quantity-btn">
                  <Minus />
                </button>
                <span className="quantity">{quantity}</span>
                <button 
                  onClick={handleIncrease} 
                  className="quantity-btn primary"
                  disabled={!canAdd}
                >
                  <Plus />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add-ons Modal */}
      <AddOnsModal
        isOpen={showAddOnsModal}
        onClose={() => setShowAddOnsModal(false)}
        item={item}
        onAddToCart={handleAddToCartWithAddOns}
        menuItems={menuItems}
      />
    </>
  );
};

export default MenuCard;