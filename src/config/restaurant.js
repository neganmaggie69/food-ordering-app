// Restaurant configuration
// Update these values with your actual restaurant information

export const restaurantConfig = {
  // Basic Information
  name: 'SpiceCraft',
  tagline: 'Authentic flavors, fresh ingredients',
  description: 'Authentic flavors, fresh ingredients, and exceptional service. Order your favorite dishes online for pickup or delivery.',
  
  // Contact Information
  contact: {
    phone: '+91 8091724773',
    whatsapp: '+918091724773', // Include country code, no spaces or special characters
    email: 'spicecraftofficial@gmail.com',
    address: 'Near Ajay Pal Temple, Chougan, Bir, HP, Pin Code : 176077'
  },
  
  // Operating Hours
  hours: {
    weekdays: '11:00 AM - 10:00 PM',
    weekends: '11:00 AM - 11:00 PM',
    // You can also specify individual days if needed
    // monday: '11:00 AM - 10:00 PM',
    // tuesday: '11:00 AM - 10:00 PM',
    // etc.
  },
  
  // Social Media
  social: {
    youtube: 'https://www.youtube.com/@spicecraftofficial',
    instagram: 'https://www.instagram.com/_spicecraft_',
    whatsapp: 'https://wa.me/918091724773'
  },
  
  // WhatsApp Message Templates
  whatsappMessages: {
    general: "Hi {restaurantName}! I'd like to inquire about your menu and place an order.",
    orderInquiry: "Hi {restaurantName}! I'm interested in placing an order. Could you help me with the menu?",
    delivery: "Hi {restaurantName}! I'd like to know about delivery options in my area.",
    catering: "Hi {restaurantName}! I'm interested in catering services for an event."
  },
  
  // Business Settings
  settings: {
    currency: '₹',
    timezone: 'Asia/Kolkata',
    deliveryRadius: '10km', // Delivery radius
    minimumOrder: 200, // Minimum order amount
    deliveryFee: 40 // Standard Delivery fee
  }
};

// Helper function to get formatted WhatsApp message
export const getWhatsAppMessage = (messageType = 'general', customMessage = null) => {
  if (customMessage) {
    return encodeURIComponent(customMessage.replace('{restaurantName}', restaurantConfig.name));
  }
  
  const message = restaurantConfig.whatsappMessages[messageType] || restaurantConfig.whatsappMessages.general;
  return encodeURIComponent(message.replace('{restaurantName}', restaurantConfig.name));
};

// Helper function to get WhatsApp URL
export const getWhatsAppURL = (messageType = 'general', customMessage = null) => {
  const message = getWhatsAppMessage(messageType, customMessage);
  return `https://wa.me/${restaurantConfig.contact.whatsapp}?text=${message}`;
};

// Helper function to get phone call URL
export const getPhoneURL = () => {
  return `tel:${restaurantConfig.contact.phone}`;
};

// Helper function to get email URL
export const getEmailURL = (subject = 'Inquiry', body = '') => {
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  return `mailto:${restaurantConfig.contact.email}?subject=${encodedSubject}&body=${encodedBody}`;
};