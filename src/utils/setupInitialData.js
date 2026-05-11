import { populateMenuItems } from './populateData';

// One-time setup function to populate initial data
export const setupInitialData = async () => {
  try {
    console.log('Setting up initial data...');
    const populated = await populateMenuItems();
    
    if (populated) {
      console.log('Initial data setup completed successfully!');
    } else {
      console.log('Data already exists, skipping setup.');
    }
  } catch (error) {
    console.error('Error setting up initial data:', error);
  }
};

// Call this function once when the app starts
// You can run this manually in the browser console or call it from main.jsx once