import { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Loader } from 'lucide-react';
import { generateImagePreview, cleanupImagePreview, validateImageFile } from '../../utils/imageUpload';
import './ImageUpload.scss';

const ImageUpload = ({ 
  currentImage, 
  onImageSelect, 
  onImageRemove, 
  loading = false,
  disabled = false,
  className = ''
}) => {
  const [preview, setPreview] = useState(currentImage || null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setPreview(currentImage || null);
  }, [currentImage]);

  useEffect(() => {
    // Cleanup preview URL on unmount
    return () => {
      if (preview && preview.startsWith('blob:')) {
        cleanupImagePreview(preview);
      }
    };
  }, []);

  const handleFileSelect = (file) => {
    if (!file || disabled || loading) return;

    try {
      validateImageFile(file);
      
      // Clean up previous preview
      if (preview && preview.startsWith('blob:')) {
        cleanupImagePreview(preview);
      }
      
      // Generate new preview
      const previewUrl = generateImagePreview(file);
      setPreview(previewUrl);
      
      // Notify parent component
      onImageSelect(file);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled && !loading) {
      setDragActive(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleRemove = () => {
    if (disabled || loading) return;
    
    // Clean up preview
    if (preview && preview.startsWith('blob:')) {
      cleanupImagePreview(preview);
    }
    
    setPreview(null);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Notify parent component
    onImageRemove();
  };

  const handleClick = () => {
    if (!disabled && !loading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`image-upload ${className} ${disabled ? 'disabled' : ''} ${loading ? 'loading' : ''}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleInputChange}
        className="file-input"
        disabled={disabled || loading}
      />
      
      {preview ? (
        <div className="image-preview">
          <img 
            src={preview} 
            alt="Preview" 
            className="preview-image"
          />
          <div className="image-overlay">
            <div className="overlay-actions">
              <button
                type="button"
                onClick={handleClick}
                className="change-btn"
                disabled={disabled || loading}
              >
                <Upload className="icon" />
                Change
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="remove-btn"
                disabled={disabled || loading}
              >
                <X className="icon" />
                Remove
              </button>
            </div>
          </div>
          {loading && (
            <div className="loading-overlay">
              <Loader className="spinner" />
              <span>Uploading...</span>
            </div>
          )}
        </div>
      ) : (
        <div
          className={`upload-area ${dragActive ? 'drag-active' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
        >
          <div className="upload-content">
            {loading ? (
              <>
                <Loader className="upload-icon spinner" />
                <p className="upload-text">Uploading image...</p>
              </>
            ) : (
              <>
                <ImageIcon className="upload-icon" />
                <p className="upload-text">
                  <span className="primary-text">Click to upload</span> or drag and drop
                </p>
                <p className="upload-hint">
                  JPEG, PNG or WebP (max 5MB)
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;