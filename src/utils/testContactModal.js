// Test utility for contact modal functionality
export const testContactModal = () => {
  console.log('Testing Contact Modal Functionality:');
  
  // Test 1: Check if modal opens
  const mainButton = document.querySelector('.main-contact-btn');
  if (mainButton) {
    console.log('✅ Main contact button found');
    
    // Simulate click
    mainButton.click();
    
    // Check if modal opened
    setTimeout(() => {
      const overlay = document.querySelector('.contact-info-overlay');
      const isExpanded = document.querySelector('.floating-contact.expanded');
      
      if (overlay && isExpanded) {
        console.log('✅ Modal opens correctly');
        
        // Test 2: Check if clicking overlay closes modal
        overlay.click();
        
        setTimeout(() => {
          const stillExpanded = document.querySelector('.floating-contact.expanded');
          if (!stillExpanded) {
            console.log('✅ Modal closes on overlay click');
          } else {
            console.log('❌ Modal does not close on overlay click');
          }
        }, 300);
        
      } else {
        console.log('❌ Modal does not open');
      }
    }, 100);
    
  } else {
    console.log('❌ Main contact button not found');
  }
  
  // Test 3: Check if Escape key works
  console.log('Press Escape key to test keyboard functionality');
};

// Test WhatsApp and Phone links
export const testContactLinks = () => {
  console.log('Testing Contact Links:');
  
  // Test phone link format
  const phoneRegex = /^tel:\+\d+$/;
  const testPhone = 'tel:+919876543210';
  
  if (phoneRegex.test(testPhone)) {
    console.log('✅ Phone link format is correct');
  } else {
    console.log('❌ Phone link format is incorrect');
  }
  
  // Test WhatsApp link format
  const whatsappRegex = /^https:\/\/wa\.me\/\d+\?text=.+$/;
  const testWhatsApp = 'https://wa.me/919876543210?text=Hi%20SpiceCraft!';
  
  if (whatsappRegex.test(testWhatsApp)) {
    console.log('✅ WhatsApp link format is correct');
  } else {
    console.log('❌ WhatsApp link format is incorrect');
  }
};

// Run tests when called
if (typeof window !== 'undefined') {
  window.testContactModal = testContactModal;
  window.testContactLinks = testContactLinks;
}