import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { auth, db } from '../../firebase/config';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import PhoneInput from '../UI/PhoneInput';
import './LoginModal.scss';

const LoginModal = ({ isOpen, onClose }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);

  // Clean up reCAPTCHA when modal closes
  useEffect(() => {
    if (!isOpen) {
      cleanupRecaptcha();
    }
  }, [isOpen]);

  const cleanupRecaptcha = () => {
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (error) {
        console.log('Error clearing reCAPTCHA:', error);
      }
      window.recaptchaVerifier = null;
    }
  };

  const setupRecaptcha = () => {
    try {
      // Clean up any existing verifier
      cleanupRecaptcha();
      
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: (response) => {
          console.log('reCAPTCHA solved');
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
          cleanupRecaptcha();
        }
      });
    } catch (error) {
      console.error('Error setting up reCAPTCHA:', error);
      toast.error('Error setting up verification. Please refresh and try again.');
    }
  };

  const sendOTP = async () => {
    if (!phoneNumber || phoneNumber.length < 12) { // +91 + 10 digits minimum
      toast.error('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      setupRecaptcha();
      
      if (!window.recaptchaVerifier) {
        throw new Error('reCAPTCHA not initialized');
      }

      console.log('Sending OTP to:', phoneNumber);
      console.log('Firebase config check:', {
        apiKey: auth.app.options.apiKey?.substring(0, 10) + '...',
        authDomain: auth.app.options.authDomain,
        projectId: auth.app.options.projectId
      });
      
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
      setConfirmationResult(confirmation);
      setStep('otp');
      toast.success('OTP sent successfully');
    } catch (error) {
      console.error('Error sending OTP:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        customData: error.customData
      });
      
      // Handle specific Firebase errors
      if (error.code === 'auth/invalid-app-credential') {
        toast.error('❌ Phone authentication not enabled in Firebase Console. Check setup guide.');
      } else if (error.code === 'auth/captcha-check-failed') {
        toast.error('Verification failed. Please try again.');
      } else if (error.code === 'auth/invalid-phone-number') {
        toast.error('Invalid phone number format.');
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('Too many attempts. Please try again later.');
      } else if (error.code === 'auth/unauthorized-domain') {
        toast.error('❌ Domain not authorized. Add localhost to Firebase Console.');
      } else {
        toast.error(`Error: ${error.code || 'Unknown error'}. Check console for details.`);
      }
      
      cleanupRecaptcha();
    }
    setLoading(false);
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    if (!confirmationResult) {
      toast.error('Please request a new OTP');
      return;
    }

    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      const user = result.user;

      // Check if user document exists, if not create one
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          phoneNumber: user.phoneNumber,
          createdAt: new Date(),
          isAdmin: false
        });
      }

      toast.success('Login successful');
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error verifying OTP:', error);
      
      if (error.code === 'auth/invalid-verification-code') {
        toast.error('Invalid OTP. Please check and try again.');
      } else if (error.code === 'auth/code-expired') {
        toast.error('OTP has expired. Please request a new one.');
      } else {
        toast.error('Invalid OTP. Please try again.');
      }
    }
    setLoading(false);
  };

  const resetForm = () => {
    setPhoneNumber('');
    setOtp('');
    setStep('phone');
    setConfirmationResult(null);
    cleanupRecaptcha();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleResendOTP = () => {
    setStep('phone');
    setOtp('');
    setConfirmationResult(null);
    cleanupRecaptcha();
  };

  if (!isOpen) return null;

  return (
    <div className="login-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Login</h2>
          <button onClick={handleClose} className="close-btn">
            <X />
          </button>
        </div>

        <div className="modal-body">
          {step === 'phone' ? (
            <>
              <div className="form-group">
                <label>Phone Number</label>
                <PhoneInput
                  value={phoneNumber}
                  onChange={setPhoneNumber}
                  placeholder="Enter your phone number"
                />
                <p className="help-text">
                  We'll send you an OTP to verify your number
                </p>
              </div>

              <div className="button-group">
                <button
                  onClick={sendOTP}
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label>Enter OTP</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    className="otp-input"
                  />
                </div>
                <p className="help-text">
                  OTP sent to {phoneNumber}
                </p>
              </div>

              <div className="button-group">
                <button
                  onClick={verifyOTP}
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>

                <button
                  onClick={handleResendOTP}
                  className="btn-link"
                >
                  Resend OTP
                </button>

                <button
                  onClick={() => setStep('phone')}
                  className="btn-link"
                >
                  Change Phone Number
                </button>
              </div>
            </>
          )}

          <div id="recaptcha-container"></div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;