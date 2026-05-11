import { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import MenuCard from './MenuCard';
import LoadingSpinner from '../UI/LoadingSpinner';
import './MenuSection.scss';

const MenuSection = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [vegFilter, setVegFilter] = useState('all'); // 'all', 'veg', 'non-veg'

  useEffect(() => {
    // Query all menu items (both active and inactive)
    const q = query(collection(db, 'menuItems'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMenuItems(items);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const categories = ['all', ...new Set(menuItems.map(item => item.category))];
  
  // Filter by category and veg preference
  const filteredItems = menuItems.filter(item => {
    const categoryMatch = selectedCategory === 'all' || item.category === selectedCategory;
    const vegMatch = vegFilter === 'all' || 
                    (vegFilter === 'veg' && item.isVeg) || 
                    (vegFilter === 'non-veg' && !item.isVeg);
    return categoryMatch && vegMatch;
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="menu-section">
      <div className="container">
        <h2 className="section-title">Our Menu</h2>
        
        {/* Sticky filter container */}
        <div className="filters-container">
          {/* Veg/Non-veg Filter */}
          <div className="veg-filters">
            <button
              onClick={() => setVegFilter('all')}
              className={`veg-filter-btn ${vegFilter === 'all' ? 'active' : ''}`}
            >
              All
            </button>
            <button
              onClick={() => setVegFilter('veg')}
              className={`veg-filter-btn veg ${vegFilter === 'veg' ? 'active' : ''}`}
            >
              <div className="veg-indicator veg">
                <div className="veg-dot" />
              </div>
              Veg
            </button>
            <button
              onClick={() => setVegFilter('non-veg')}
              className={`veg-filter-btn non-veg ${vegFilter === 'non-veg' ? 'active' : ''}`}
            >
              <div className="veg-indicator non-veg">
                <div className="veg-dot" />
              </div>
              Non-Veg
            </button>
          </div>

          {/* Category Filters */}
          <div className="category-filters">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              >
                {category === 'all' ? 'All Items' : category}
              </button>
            ))}
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="empty-state">
            <p>No items available in this category</p>
          </div>
        ) : (
          <div className="menu-grid">
            {filteredItems.map(item => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuSection;