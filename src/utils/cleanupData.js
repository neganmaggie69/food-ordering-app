import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

// Utility to clean up duplicate menu items
export const cleanupMenuItems = async () => {
  try {
    console.log('Cleaning up menu items...');
    
    const menuSnapshot = await getDocs(collection(db, 'menuItems'));
    const items = menuSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`Found ${items.length} menu items`);
    
    // Group items by name to find duplicates
    const itemsByName = {};
    items.forEach(item => {
      if (!itemsByName[item.name]) {
        itemsByName[item.name] = [];
      }
      itemsByName[item.name].push(item);
    });
    
    // Delete duplicates (keep the first one)
    let deletedCount = 0;
    for (const [name, duplicates] of Object.entries(itemsByName)) {
      if (duplicates.length > 1) {
        console.log(`Found ${duplicates.length} duplicates for "${name}"`);
        // Keep the first one, delete the rest
        for (let i = 1; i < duplicates.length; i++) {
          await deleteDoc(doc(db, 'menuItems', duplicates[i].id));
          deletedCount++;
        }
      }
    }
    
    console.log(`Cleanup completed. Deleted ${deletedCount} duplicate items.`);
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up menu items:', error);
    return 0;
  }
};

// Utility to delete all menu items (use with caution)
export const deleteAllMenuItems = async () => {
  try {
    console.log('Deleting all menu items...');
    
    const menuSnapshot = await getDocs(collection(db, 'menuItems'));
    const deletePromises = menuSnapshot.docs.map(doc => 
      deleteDoc(doc.ref)
    );
    
    await Promise.all(deletePromises);
    console.log(`Deleted ${menuSnapshot.docs.length} menu items`);
    return menuSnapshot.docs.length;
  } catch (error) {
    console.error('Error deleting menu items:', error);
    return 0;
  }
};