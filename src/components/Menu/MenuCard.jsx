import { Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../../contexts/CartContext';
import './MenuCard.scss';

const MenuCard = ({ item }) => {
  const { cartItems, addToCart, updateQuantity } = useCart();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  
  const cartItem = cartItems.find(cartItem => cartItem.id === item.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  const handleAdd = () => {
    if (item.isActive) {
      addToCart(item);
    }
  };

  const handleIncrease = () => {
    if (item.isActive) {
      updateQuantity(item.id, quantity + 1);
    }
  };

  const handleDecrease = () => {
    if (item.isActive) {
      updateQuantity(item.id, quantity - 1);
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

        <div className="menu-card-footer">
          <div className="menu-card-info">
            {item.category && (
              <span className="category-badge">{item.category}</span>
            )}
          </div>

          {!item.isActive ? (
            <div className="unavailable-badge">
              Unavailable
            </div>
          ) : quantity === 0 ? (
            <button onClick={handleAdd} className="add-btn">
              <Plus />
              <span>Add</span>
            </button>
          ) : (
            <div className="quantity-controls">
              <button onClick={handleDecrease} className="quantity-btn">
                <Minus />
              </button>
              <span className="quantity">{quantity}</span>
              <button onClick={handleIncrease} className="quantity-btn primary">
                <Plus />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuCard;