import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { populateMenuItems } from '../../utils/populateData';
import MenuCard from './MenuCard';
import LoadingSpinner from '../UI/LoadingSpinner';
import './MenuSection.scss';

const MenuSection = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    // Populate sample data if needed
    populateMenuItems();

    const q = query(
      collection(db, 'menuItems'),
      where('isActive', '==', true)
    );

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
  
  const filteredItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="menu-section">
      <div className="container">
        <h2 className="section-title">Our Menu</h2>
        
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