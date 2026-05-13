import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase/config';

// Image compression utility
const compressImage = (file, maxWidth = 800, maxHeight = 600, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// Validate image file
export const validateImageFile = (file) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!validTypes.includes(file.type)) {
    throw new Error('Please select a valid image file (JPEG, PNG, or WebP)');
  }
  
  if (file.size > maxSize) {
    throw new Error('Image size should be less than 5MB');
  }
  
  return true;
};

// Upload image to Firebase Storage
export const uploadMenuItemImage = async (file, itemId = null) => {
  try {
    // Validate file
    validateImageFile(file);
    
    // Compress image
    const compressedFile = await compressImage(file);
    
    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `menu-items/${itemId || timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    
    // Create storage reference
    const storageRef = ref(storage, fileName);
    
    // Upload file
    const snapshot = await uploadBytes(storageRef, compressedFile);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return {
      url: downloadURL,
      path: fileName,
      size: compressedFile.size
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// Delete image from Firebase Storage
export const deleteMenuItemImage = async (imagePath) => {
  try {
    if (!imagePath) return;
    
    const storageRef = ref(storage, imagePath);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
    // Don't throw error for deletion failures
  }
};

// Generate preview URL for selected file
export const generateImagePreview = (file) => {
  return URL.createObjectURL(file);
};

// Clean up preview URL
export const cleanupImagePreview = (previewUrl) => {
  if (previewUrl && previewUrl.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl);
  }
};