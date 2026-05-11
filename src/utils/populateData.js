import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { sampleMenuItems } from '../data/sampleMenu';

export const populateMenuItems = async () => {
  try {
    // Check if menu items already exist
    const menuSnapshot = await getDocs(collection(db, 'menuItems'));
    
    if (menuSnapshot.empty) {
      console.log('Populating menu items...');
      
      for (const item of sampleMenuItems) {
        await addDoc(collection(db, 'menuItems'), {
          ...item,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      console.log('Menu items populated successfully!');
      return true;
    } else {
      console.log('Menu items already exist');
      return false;
    }
  } catch (error) {
    console.error('Error populating menu items:', error);
    return false;
  }
};