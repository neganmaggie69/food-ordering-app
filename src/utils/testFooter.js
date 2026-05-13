// Test utility for footer functionality
import { restaurantConfig } from '../config/restaurant';

export const testFooterConfig = () => {
  console.log('Testing Footer Configuration:');
  
  // Test restaurant config
  console.log('Restaurant Name:', restaurantConfig.name);
  console.log('Phone:', restaurantConfig.contact.phone);
  console.log('Email:', restaurantConfig.contact.email);
  console.log('Address:', restaurantConfig.contact.address);
  
  // Validate phone format
  const phoneRegex = /^\+91\s?\d{10}$/;
  if (phoneRegex.test(restaurantConfig.contact.phone)) {
    console.log('✅ Phone format is valid');
  } else {
    console.log('❌ Phone format needs checking');
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(restaurantConfig.contact.email)) {
    console.log('✅ Email format is valid');
  } else {
    console.log('❌ Email format needs checking');
  }
  
  // Check if address contains required info
  if (restaurantConfig.contact.address.includes('Bir') && 
      restaurantConfig.contact.address.includes('176077')) {
    console.log('✅ Address contains location and pin code');
  } else {
    console.log('❌ Address missing location or pin code');
  }
};

// Test footer DOM elements
export const testFooterDOM = () => {
  console.log('Testing Footer DOM Elements:');
  
  const footer = document.querySelector('.footer');
  if (footer) {
    console.log('✅ Footer element found');
    
    const contactItems = footer.querySelectorAll('.contact-item');
    console.log(`Found ${contactItems.length} contact items`);
    
    const hoursSection = footer.querySelector('.hours-info');
    if (!hoursSection) {
      console.log('✅ Hours section successfully removed');
    } else {
      console.log('❌ Hours section still present');
    }
    
    // Check background color
    const computedStyle = window.getComputedStyle(footer);
    console.log('Footer background:', computedStyle.background);
    
  } else {
    console.log('❌ Footer element not found');
  }
};

// Run tests when called
if (typeof window !== 'undefined') {
  window.testFooterConfig = testFooterConfig;
  window.testFooterDOM = testFooterDOM;
}