import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import './PhoneInput.scss';

const countries = [
  { code: '+91', name: 'India', flag: '🇮🇳', iso: 'IN' },
  { code: '+1', name: 'United States', flag: '🇺🇸', iso: 'US' },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧', iso: 'GB' },
  { code: '+971', name: 'UAE', flag: '🇦🇪', iso: 'AE' },
  { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦', iso: 'SA' },
  { code: '+65', name: 'Singapore', flag: '🇸🇬', iso: 'SG' },
  { code: '+60', name: 'Malaysia', flag: '🇲🇾', iso: 'MY' },
];

const PhoneInput = ({ value, onChange, placeholder = "Enter phone number" }) => {
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setShowDropdown(false);
    // Update the full phone number
    const fullNumber = phoneNumber ? country.code + phoneNumber : country.code;
    onChange(fullNumber);
  };

  const handlePhoneChange = (e) => {
    const number = e.target.value.replace(/\D/g, ''); // Only allow digits
    setPhoneNumber(number);
    const fullNumber = selectedCountry.code + number;
    onChange(fullNumber);
  };

  const toggleDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  return (
    <div className="phone-input" ref={dropdownRef}>
      <div className="country-selector" onClick={toggleDropdown}>
        <span className="flag">{selectedCountry.flag}</span>
        <span className="iso">{selectedCountry.iso}</span>
        <span className="code">{selectedCountry.code}</span>
        <ChevronDown className={`chevron ${showDropdown ? 'open' : ''}`} />
        
        {showDropdown && (
          <div className="dropdown" onClick={(e) => e.stopPropagation()}>
            {countries.map((country) => (
              <div
                key={country.code}
                className={`dropdown-item ${selectedCountry.code === country.code ? 'selected' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCountrySelect(country);
                }}
              >
                <span className="flag">{country.flag}</span>
                <span className="name">{country.name}</span>
                <span className="code">{country.code}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <input
        type="tel"
        value={phoneNumber}
        onChange={handlePhoneChange}
        placeholder={placeholder}
        className="phone-number-input"
        maxLength={10}
      />
    </div>
  );
};

export default PhoneInput;