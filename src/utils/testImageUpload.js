// Test utility to verify image upload functionality
import { uploadMenuItemImage, validateImageFile } from './imageUpload';

// Create a test blob that simulates an image file
export const createTestImageFile = () => {
  // Create a simple canvas with a colored rectangle
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');
  
  // Draw a gradient background
  const gradient = ctx.createLinearGradient(0, 0, 400, 300);
  gradient.addColorStop(0, '#ff6b6b');
  gradient.addColorStop(1, '#4ecdc4');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 400, 300);
  
  // Add some text
  ctx.fillStyle = 'white';
  ctx.font = '24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Test Menu Item', 200, 150);
  
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const file = new File([blob], 'test-menu-item.jpg', { type: 'image/jpeg' });
      resolve(file);
    }, 'image/jpeg', 0.8);
  });
};

// Test the validation function
export const testValidation = async () => {
  console.log('Testing image validation...');
  
  try {
    const testFile = await createTestImageFile();
    const isValid = validateImageFile(testFile);
    console.log('✅ Validation passed:', isValid);
    return true;
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    return false;
  }
};

// Test the upload function (requires Firebase to be configured)
export const testUpload = async () => {
  console.log('Testing image upload...');
  
  try {
    const testFile = await createTestImageFile();
    const result = await uploadMenuItemImage(testFile, 'test-item');
    console.log('✅ Upload successful:', result);
    return result;
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    return null;
  }
};