import { X } from 'lucide-react';
import './PrivacyModal.scss';

const PrivacyModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="privacy-modal-overlay" onClick={handleOverlayClick}>
      <div className="privacy-modal">
        <div className="privacy-header">
          <h2>Privacy Policy</h2>
          <button onClick={onClose} className="close-btn">
            <X className="icon" />
          </button>
        </div>
        
        <div className="privacy-content">
          <section>
            <h3>Information We Collect</h3>
            <p>We collect information you provide when placing orders, including phone number and delivery address.</p>
          </section>

          <section>
            <h3>How We Use Your Information</h3>
            <ul>
              <li>Process and fulfill your food orders</li>
              <li>Communicate about order status and delivery</li>
              <li>Improve our services and menu offerings</li>
            </ul>
          </section>

          <section>
            <h3>Information Sharing</h3>
            <p>We do not sell or share your personal information with third parties except as necessary to fulfill your orders.</p>
          </section>

          <section>
            <h3>Data Security</h3>
            <p>We implement appropriate security measures to protect your personal information against unauthorized access.</p>
          </section>

          <section>
            <h3>Contact Us</h3>
            <p>For privacy concerns, contact us at spicecraftofficial@gmail.com or +91 8091724773.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyModal;