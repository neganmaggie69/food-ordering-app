import { Plus, Minus } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import './MenuCard.scss';

const MenuCard = ({ item }) => {
  const { cartItems, addToCart, updateQuantity } = useCart();
  
  const cartItem = cartItems.find(cartItem => cartItem.id === item.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  const handleAdd = () => {
    addToCart(item);
  };

  const handleIncrease = () => {
    updateQuantity(item.id, quantity + 1);
  };

  const handleDecrease = () => {
    updateQuantity(item.id, quantity - 1);
  };

  const handleImageError = (e) => {
    e.target.src = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop&crop=center';
  };

  return (
    <div className="menu-card">
      <img 
        src={item.image || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop&crop=center'} 
        alt={item.name} 
        className="menu-card-image"
        onError={handleImageError}
      />
      
      <div className="menu-card-content">
        <div className="menu-card-header">
          <h3 className="menu-card-title">{item.name}</h3>
          <span className="menu-card-price">₹{item.price}</span>
        </div>

        <div className="menu-card-footer">
          <div className="menu-card-badges">
            {item.category && (
              <span className="category-badge">{item.category}</span>
            )}
            {item.isVeg !== undefined && (
              <div className={`veg-indicator ${item.isVeg ? 'veg' : 'non-veg'}`}>
                <div className="veg-dot" />
              </div>
            )}
          </div>

          {quantity === 0 ? (
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