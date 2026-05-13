import { useState, useEffect } from 'react';
import { Phone, MessageCircle, X } from 'lucide-react';
import { restaurantConfig, getWhatsAppURL, getPhoneURL } from '../../config/restaurant';
import './FloatingContact.scss';

const FloatingContact = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('keydown', handleEscapeKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isExpanded]);

  const handlePhoneCall = () => {
    window.location.href = getPhoneURL();
  };

  const handleWhatsAppChat = () => {
    window.open(getWhatsAppURL('general'), '_blank');
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleOverlayClick = (e) => {
    // Close modal when clicking on the overlay (not the content)
    if (e.target === e.currentTarget) {
      setIsExpanded(false);
    }
  };

  return (
    <div className={`floating-contact ${isExpanded ? 'expanded' : ''}`}>
      {/* Main contact button */}
      <button 
        className="main-contact-btn"
        onClick={toggleExpanded}
        aria-label="Contact options"
      >
        {isExpanded ? <X className="icon" /> : <Phone className="icon" />}
      </button>

      {/* Contact options */}
      <div className="contact-options">
        <button 
          className="contact-option phone-btn"
          onClick={handlePhoneCall}
          aria-label="Call restaurant"
        >
          <Phone className="icon" />
          <span className="tooltip">Call Now</span>
        </button>

        <button 
          className="contact-option whatsapp-btn"
          onClick={handleWhatsAppChat}
          aria-label="WhatsApp chat"
        >
          <MessageCircle className="icon" />
          <span className="tooltip">WhatsApp</span>
        </button>
      </div>

      {/* Contact info overlay (shows when expanded) */}
      {isExpanded && (
        <div className="contact-info-overlay" onClick={handleOverlayClick}>
          <div className="contact-info">
            <h4>Contact Us</h4>
            <div className="contact-methods">
              <div className="contact-method" onClick={handlePhoneCall}>
                <Phone className="method-icon" />
                <div className="method-details">
                  <span className="method-label">Call</span>
                  <span className="method-value">{restaurantConfig.contact.phone}</span>
                </div>
              </div>
              <div className="contact-method" onClick={handleWhatsAppChat}>
                <MessageCircle className="method-icon" />
                <div className="method-details">
                  <span className="method-label">WhatsApp</span>
                  <span className="method-value">Chat with us</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingContact;