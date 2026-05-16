import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Plus, Edit, Trash2, Save, X, Check, DollarSign, Search } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import LoadingSpinner from '../UI/LoadingSpinner';
import ImageUpload from '../UI/ImageUpload';
import { uploadMenuItemImage, deleteMenuItemImage } from '../../utils/imageUpload';
import toast from 'react-hot-toast';
import './AdminMenu.scss';

const AdminMenu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingPrice, setEditingPrice] = useState(null);
  const [tempPrice, setTempPrice] = useState('');
  const [editingStock, setEditingStock] = useState(null);
  const [tempStock, setTempStock] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const { menuItemAdded, menuItemOutOfStock, createNotification } = useNotifications();
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
    isVeg: true,
    isActive: true,
    image: '',
    imagePath: '',
    addOns: [],
    stock: ''
  });
  const [newAddOn, setNewAddOn] = useState({ name: '', price: '' });

  useEffect(() => {
    const q = query(collection(db, 'menuItems'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMenuItems(items);
      setFilteredItems(items);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const filtered = menuItems.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredItems(filtered);
  }, [searchTerm, menuItems]);

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      category: '',
      description: '',
      isVeg: true,
      isActive: true,
      image: '',
      imagePath: '',
      addOns: [],
      stock: ''
    });
    setSelectedImage(null);
    setNewAddOn({ name: '', price: '' });
    setShowAddForm(false);
    setEditingItem(null);
  };

  const handleAddAddOn = () => {
    if (!newAddOn.name.trim() || !newAddOn.price) {
      toast.error('Please enter add-on name and price');
      return;
    }

    const addOn = {
      id: Date.now().toString(),
      name: newAddOn.name.trim(),
      price: parseFloat(newAddOn.price)
    };

    console.log('Adding add-on:', addOn); // Debug log

    setFormData(prev => {
      const updatedFormData = {
        ...prev,
        addOns: [...prev.addOns, addOn]
      };
      console.log('Updated form data addOns:', updatedFormData.addOns); // Debug log
      return updatedFormData;
    });

    setNewAddOn({ name: '', price: '' });
    toast.success('Add-on added successfully');
  };

  const handleRemoveAddOn = (addOnId) => {
    setFormData(prev => ({
      ...prev,
      addOns: prev.addOns.filter(addOn => addOn.id !== addOnId)
    }));
    toast.success('Add-on removed');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.category || !formData.stock) {
      toast.error('Please fill in all required fields (name, price, category, and stock)');
      return;
    }

    try {
      setImageUploading(true);
      
      let imageData = {
        image: formData.image,
        imagePath: formData.imagePath
      };

      // Handle image upload if a new image is selected
      if (selectedImage) {
        try {
          const uploadResult = await uploadMenuItemImage(selectedImage, editingItem?.id);
          imageData = {
            image: uploadResult.url,
            imagePath: uploadResult.path
          };
          
          // Delete old image if editing and had previous image
          if (editingItem && editingItem.imagePath) {
            await deleteMenuItemImage(editingItem.imagePath);
          }
        } catch (imageError) {
          console.error('Image upload error:', imageError);
          toast.error('Failed to upload image. Please try again.');
          setImageUploading(false);
          return;
        }
      }

      const itemData = {
        name: formData.name,
        price: parseFloat(formData.price),
        category: formData.category,
        description: formData.description,
        isVeg: formData.isVeg,
        isActive: formData.isActive,
        addOns: formData.addOns || [],
        stock: parseInt(formData.stock),
        ...imageData,
        updatedAt: new Date()
      };

      console.log('Saving item data:', itemData); // Debug log

      if (editingItem) {
        await updateDoc(doc(db, 'menuItems', editingItem.id), itemData);
        toast.success('Item updated successfully');
      } else {
        const docRef = await addDoc(collection(db, 'menuItems'), {
          ...itemData,
          createdAt: new Date()
        });
        
        // Create notification for new menu item
        try {
          await menuItemAdded(formData.name);
        } catch (notificationError) {
          console.error('Error creating menu item notification:', notificationError);
          // Don't fail the item creation if notifications fail
        }
        
        toast.success('Item added successfully');
      }

      resetForm();
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Error saving item');
    } finally {
      setImageUploading(false);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      name: item.name,
      price: item.price.toString(),
      category: item.category,
      description: item.description || '',
      isVeg: item.isVeg,
      isActive: item.isActive,
      image: item.image || '',
      imagePath: item.imagePath || '',
      addOns: item.addOns || [],
      stock: item.stock ? item.stock.toString() : '0'
    });
    setSelectedImage(null);
    setEditingItem(item);
    setShowAddForm(true);
    
    // Scroll to top to show the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const item = menuItems.find(item => item.id === itemId);
        
        // Delete the item from Firestore
        await deleteDoc(doc(db, 'menuItems', itemId));
        
        // Delete associated image if exists
        if (item && item.imagePath) {
          await deleteMenuItemImage(item.imagePath);
        }
        
        toast.success('Item deleted successfully');
      } catch (error) {
        console.error('Error deleting item:', error);
        toast.error('Error deleting item');
      }
    }
  };

  const toggleActive = async (item) => {
    try {
      const newActiveStatus = !item.isActive;
      
      await updateDoc(doc(db, 'menuItems', item.id), {
        isActive: newActiveStatus,
        updatedAt: new Date()
      });
      
      // Create notification if item is being deactivated (out of stock)
      try {
        if (!newActiveStatus) {
          await menuItemOutOfStock(item.name);
        }
      } catch (notificationError) {
        console.error('Error creating out-of-stock notification:', notificationError);
        // Don't fail the status update if notifications fail
      }
      
      toast.success(`Item ${newActiveStatus ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error updating item status:', error);
      toast.error('Error updating item status');
    }
  };

  const startPriceEdit = (item) => {
    setEditingPrice(item.id);
    setTempPrice(item.price.toString());
  };

  const savePriceEdit = async (itemId) => {
    if (!tempPrice || isNaN(parseFloat(tempPrice))) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
      await updateDoc(doc(db, 'menuItems', itemId), {
        price: parseFloat(tempPrice),
        updatedAt: new Date()
      });
      toast.success('Price updated successfully');
      setEditingPrice(null);
      setTempPrice('');
    } catch (error) {
      console.error('Error updating price:', error);
      toast.error('Error updating price');
    }
  };

  const cancelPriceEdit = () => {
    setEditingPrice(null);
    setTempPrice('');
  };

  const startStockEdit = (item) => {
    setEditingStock(item.id);
    setTempStock((item.stock || 0).toString());
  };

  const saveStockEdit = async (itemId) => {
    if (!tempStock || isNaN(parseInt(tempStock)) || parseInt(tempStock) < 0) {
      toast.error('Please enter a valid stock quantity');
      return;
    }

    try {
      const newStock = parseInt(tempStock);
      const item = menuItems.find(item => item.id === itemId);
      const updateData = {
        stock: newStock,
        updatedAt: new Date()
      };

      // Auto-deactivate item if stock becomes 0
      if (newStock === 0) {
        updateData.isActive = false;
      }
      // Auto-activate item if stock goes from 0 to positive (and it was previously inactive due to stock)
      else if (newStock > 0 && item && !item.isActive && (item.stock || 0) === 0) {
        updateData.isActive = true;
      }

      await updateDoc(doc(db, 'menuItems', itemId), updateData);
      
      if (newStock === 0) {
        toast.success('Stock updated and item deactivated (out of stock)');
      } else if (newStock > 0 && item && !item.isActive && (item.stock || 0) === 0) {
        toast.success('Stock updated and item reactivated');
      } else {
        toast.success('Stock updated successfully');
      }
      
      setEditingStock(null);
      setTempStock('');
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Error updating stock');
    }
  };

  const cancelStockEdit = () => {
    setEditingStock(null);
    setTempStock('');
  };

  const handleImageSelect = (file) => {
    setSelectedImage(file);
  };

  const handleImageRemove = () => {
    setSelectedImage(null);
    setFormData(prev => ({ ...prev, image: '', imagePath: '' }));
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="admin-menu">
      <div className="sticky-header">
        <div className="admin-menu-header">
          <h2 className="page-title">Manage Menu</h2>
          <button
            onClick={() => setShowAddForm(true)}
            className="add-item-btn"
          >
            <Plus className="icon" />
            <span>Add Item</span>
          </button>
        </div>

        <div className="search-container">
          <div className="search-box">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search items by name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="form-container">
          <div className="form-header">
            <h3 className="form-title">
              {editingItem ? 'Edit Item' : 'Add New Item'}
            </h3>
            <button onClick={resetForm} className="close-btn">
              <X className="icon" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="item-form">
            <div className="form-row">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter item name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Price *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="form-group">
                <label>Stock Quantity *</label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                  placeholder="Available quantity"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category *</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g., Main Course, Appetizer"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the item (optional)"
                  rows="3"
                  className="form-textarea"
                />
              </div>
            </div>

            {/* Add-ons Management Section */}
            <div className="form-row">
              <div className="form-group full-width">
                <label>Add-ons (Optional)</label>
                <div className="addons-section">
                  <div className="addon-input-row">
                    <input
                      type="text"
                      value={newAddOn.name}
                      onChange={(e) => setNewAddOn(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Add-on name (e.g., Extra Cheese)"
                      className="addon-name-input"
                    />
                    <input
                      type="number"
                      value={newAddOn.price}
                      onChange={(e) => setNewAddOn(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="Price"
                      className="addon-price-input"
                      min="0"
                      step="0.01"
                    />
                    <button
                      type="button"
                      onClick={handleAddAddOn}
                      className="add-addon-btn"
                    >
                      <Plus className="icon" />
                      Add
                    </button>
                  </div>
                  
                  {formData.addOns.length > 0 && (
                    <div className="addons-list">
                      <h4>Current Add-ons:</h4>
                      {formData.addOns.map(addOn => (
                        <div key={addOn.id} className="addon-item">
                          <span className="addon-name">{addOn.name}</span>
                          <span className="addon-price">₹{addOn.price}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAddOn(addOn.id)}
                            className="remove-addon-btn"
                          >
                            <X className="icon" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="form-group full-width">
              <label>Item Image</label>
              <ImageUpload
                currentImage={formData.image}
                onImageSelect={handleImageSelect}
                onImageRemove={handleImageRemove}
                loading={imageUploading}
                disabled={imageUploading}
              />
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.isVeg}
                  onChange={(e) => setFormData(prev => ({ ...prev, isVeg: e.target.checked }))}
                />
                <span className="checkmark"></span>
                Vegetarian
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                />
                <span className="checkmark"></span>
                Active
              </label>
            </div>

            <div className="form-actions">
              <button type="button" onClick={resetForm} className="cancel-btn">
                Cancel
              </button>
              <button type="submit" className="save-btn">
                <Save className="icon" />
                {editingItem ? 'Update' : 'Add'} Item
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Menu Items Grid */}
      <div className="menu-items-grid">
        {filteredItems.map(item => (
          <div key={item.id} className={`menu-item-card ${!item.isActive ? 'inactive' : ''}`}>
            <div className="item-image">
              <img
                src={item.image || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop&crop=center'}
                alt={item.name}
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop&crop=center';
                }}
              />
              <div className="status-overlay">
                <button
                  onClick={() => toggleActive(item)}
                  className={`status-btn ${item.isActive ? 'active' : 'inactive'}`}
                >
                  {item.isActive ? 'Active' : 'Inactive'}
                </button>
              </div>
            </div>

            <div className="item-content">
              <div className="item-header">
                <div className="title-row">
                  <div className={`veg-indicator ${item.isVeg ? 'veg' : 'non-veg'}`}>
                    <div className="veg-dot" />
                  </div>
                  <h4 className="item-name">{item.name}</h4>
                </div>
                
                <div className="price-section">
                  {editingPrice === item.id ? (
                    <div className="price-edit">
                      <input
                        type="number"
                        step="0.01"
                        value={tempPrice}
                        onChange={(e) => setTempPrice(e.target.value)}
                        className="price-input"
                        autoFocus
                      />
                      <button
                        onClick={() => savePriceEdit(item.id)}
                        className="save-price-btn"
                      >
                        <Check className="icon" />
                      </button>
                      <button
                        onClick={cancelPriceEdit}
                        className="cancel-price-btn"
                      >
                        <X className="icon" />
                      </button>
                    </div>
                  ) : (
                    <div className="price-display" onClick={() => startPriceEdit(item)}>
                      <span className="price">₹{item.price}</span>
                      <Edit className="edit-icon" />
                    </div>
                  )}
                </div>

                <div className="stock-section">
                  {editingStock === item.id ? (
                    <div className="stock-edit">
                      <input
                        type="number"
                        min="0"
                        value={tempStock}
                        onChange={(e) => setTempStock(e.target.value)}
                        className="stock-input"
                        autoFocus
                      />
                      <button
                        onClick={() => saveStockEdit(item.id)}
                        className="save-stock-btn"
                      >
                        <Check className="icon" />
                      </button>
                      <button
                        onClick={cancelStockEdit}
                        className="cancel-stock-btn"
                      >
                        <X className="icon" />
                      </button>
                    </div>
                  ) : (
                    <div className="stock-display" onClick={() => startStockEdit(item)}>
                      <span className="stock-label">Stock:</span>
                      <span className={`stock-value ${(item.stock || 0) <= 5 ? 'low-stock' : ''}`}>
                        {item.stock || 0}
                      </span>
                      <Edit className="edit-icon" />
                    </div>
                  )}
                </div>
              </div>

              <div className="item-details">
                <span className="category">{item.category}</span>
                {item.description && (
                  <p className="description">{item.description}</p>
                )}
              </div>

              <div className="item-actions">
                <button
                  onClick={() => handleEdit(item)}
                  className="edit-btn"
                >
                  <Edit className="icon" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="delete-btn"
                >
                  <Trash2 className="icon" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && searchTerm && (
        <div className="empty-state">
          <div className="empty-content">
            <Search className="empty-icon" />
            <h3>No items found</h3>
            <p>Try searching with different keywords</p>
          </div>
        </div>
      )}

      {menuItems.length === 0 && !searchTerm && (
        <div className="empty-state">
          <div className="empty-content">
            <DollarSign className="empty-icon" />
            <h3>No menu items yet</h3>
            <p>Start by adding your first menu item</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="add-first-btn"
            >
              <Plus className="icon" />
              Add First Item
            </button>
          </div>
        </div>
      )}
      
      {/* Notification Test Component - Development Only */}
    </div>
  );
};

export default AdminMenu;