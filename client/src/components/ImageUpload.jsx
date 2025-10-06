import React, { useState, useRef, useCallback } from 'react';
import { Form, Button, Alert, Card, Row, Col, Badge } from 'react-bootstrap';

const ImageUpload = ({ 
  images = [], 
  onImagesChange, 
  maxImages = 10, 
  maxSizeMB = 5,
  acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  showGuidelines = true 
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);

  // Image validation
  const validateImage = (file) => {
    const errors = [];
    
    // Check file type
    if (!acceptedFormats.includes(file.type)) {
      errors.push(`Invalid file type. Accepted formats: ${acceptedFormats.join(', ')}`);
    }
    
    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      errors.push(`File too large. Maximum size: ${maxSizeMB}MB`);
    }
    
    // Check image dimensions (basic check)
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        if (img.width < 300 || img.height < 200) {
          errors.push('Image too small. Minimum dimensions: 300x200px');
        }
        if (img.width > 4000 || img.height > 4000) {
          errors.push('Image too large. Maximum dimensions: 4000x4000px');
        }
        resolve({ valid: errors.length === 0, errors });
      };
      img.onerror = () => {
        errors.push('Invalid image file');
        resolve({ valid: false, errors });
      };
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle file selection
  const handleFiles = useCallback(async (files) => {
    if (!files || files.length === 0) return;
    
    setUploading(true);
    setErrors([]);
    
    const newImages = [];
    const validationErrors = [];
    
    // Check if adding these files would exceed max images
    if (images.length + files.length > maxImages) {
      validationErrors.push(`Maximum ${maxImages} images allowed. You can add ${maxImages - images.length} more.`);
      setErrors(validationErrors);
      setUploading(false);
      return;
    }
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = await validateImage(file);
      
      if (validation.valid) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newImage = {
            id: Date.now() + i,
            file: file,
            preview: e.target.result,
            name: file.name,
            size: file.size,
            dimensions: null // Will be set after image loads
          };
          
          // Get image dimensions
          const img = new Image();
          img.onload = () => {
            newImage.dimensions = { width: img.width, height: img.height };
            newImages.push(newImage);
            
            if (newImages.length === files.length - validationErrors.length) {
              onImagesChange([...images, ...newImages]);
              setUploading(false);
            }
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      } else {
        validationErrors.push(...validation.errors.map(err => `${file.name}: ${err}`));
      }
    }
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
    }
    
    setUploading(false);
  }, [images, maxImages, maxSizeMB, acceptedFormats, onImagesChange]);

  // Drag and drop handlers
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, [handleFiles]);

  // File input change
  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(Array.from(e.target.files));
    }
  };

  // Remove image
  const removeImage = (imageId) => {
    onImagesChange(images.filter(img => img.id !== imageId));
  };

  // Move image up/down
  const moveImage = (imageId, direction) => {
    const currentIndex = images.findIndex(img => img.id === imageId);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex >= 0 && newIndex < images.length) {
      const newImages = [...images];
      [newImages[currentIndex], newImages[newIndex]] = [newImages[newIndex], newImages[currentIndex]];
      onImagesChange(newImages);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="image-upload-container">
      {showGuidelines && (
        <Card className="mb-3" style={{ backgroundColor: '#f8f9fa' }}>
          <Card.Body className="py-2">
            <div className="d-flex align-items-center mb-2">
              <i className="bi bi-image me-2 text-primary"></i>
              <strong>Image Guidelines</strong>
            </div>
            <div className="row text-sm">
              <div className="col-md-6">
                <div className="d-flex align-items-center mb-1">
                  <i className="bi bi-check-circle me-1 text-success" style={{fontSize: '14px'}}></i>
                  <span>Formats: JPG, PNG, WebP</span>
                </div>
                <div className="d-flex align-items-center mb-1">
                  <i className="bi bi-check-circle me-1 text-success" style={{fontSize: '14px'}}></i>
                  <span>Max size: {maxSizeMB}MB per image</span>
                </div>
              </div>
              <div className="col-md-6">
                <div className="d-flex align-items-center mb-1">
                  <i className="bi bi-check-circle me-1 text-success" style={{fontSize: '14px'}}></i>
                  <span>Min: 300x200px</span>
                </div>
                <div className="d-flex align-items-center mb-1">
                  <i className="bi bi-check-circle me-1 text-success" style={{fontSize: '14px'}}></i>
                  <span>Max: {maxImages} images total</span>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Upload Area */}
      <div
        className={`upload-area ${dragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragActive ? '#007bff' : '#dee2e6'}`,
          borderRadius: '8px',
          padding: '2rem',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: dragActive ? '#f8f9ff' : '#fafafa',
          transition: 'all 0.3s ease',
          position: 'relative'
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedFormats.join(',')}
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
        
        <div className="upload-content">
          <i 
            className={`bi bi-cloud-upload mb-3 ${dragActive ? 'text-primary' : 'text-muted'}`}
            style={{ 
              fontSize: '48px',
              animation: uploading ? 'pulse 1.5s infinite' : 'none' 
            }}
          ></i>
          <h5 className="mb-2">
            {uploading ? 'Processing Images...' : 'Upload Property Photos'}
          </h5>
          <p className="text-muted mb-3">
            {dragActive 
              ? 'Drop images here' 
              : 'Drag & drop images here or click to browse'
            }
          </p>
          <Button 
            variant="outline-primary" 
            size="sm"
            disabled={uploading || images.length >= maxImages}
          >
            Choose Files
          </Button>
          {images.length > 0 && (
            <div className="mt-2">
              <Badge bg="info">
                {images.length} / {maxImages} images
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <Alert variant="danger" className="mt-3">
          <div className="d-flex align-items-center mb-2">
            <i className="bi bi-exclamation-triangle me-2"></i>
            <strong>Upload Errors:</strong>
          </div>
          <ul className="mb-0">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Alert>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="mt-4">
          <h6 className="mb-3">
            <i className="bi bi-image me-2"></i>
            Uploaded Images ({images.length})
          </h6>
          <Row>
            {images.map((image, index) => (
              <Col key={image.id} xs={12} sm={6} md={4} lg={3} className="mb-3">
                <Card className="image-preview-card">
                  <div className="position-relative">
                    <Card.Img
                      variant="top"
                      src={image.preview}
                      style={{
                        height: '150px',
                        objectFit: 'cover',
                        borderRadius: '8px 8px 0 0'
                      }}
                    />
                    <div className="image-overlay">
                      <div className="d-flex justify-content-between align-items-center p-2">
                        <Badge bg="primary" className="me-1">
                          #{index + 1}
                        </Badge>
                        <div className="d-flex gap-1">
                          <Button
                            variant="outline-light"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveImage(image.id, 'up');
                            }}
                            disabled={index === 0}
                            style={{ padding: '2px 6px' }}
                          >
                            ↑
                          </Button>
                          <Button
                            variant="outline-light"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveImage(image.id, 'down');
                            }}
                            disabled={index === images.length - 1}
                            style={{ padding: '2px 6px' }}
                          >
                            ↓
                          </Button>
                            <Button
                              variant="outline-light"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeImage(image.id);
                              }}
                              style={{ padding: '2px 6px' }}
                            >
                              <i className="bi bi-x"></i>
                            </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Card.Body className="p-2">
                    <div className="text-truncate" title={image.name}>
                      <small className="text-muted">{image.name}</small>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">
                        {formatFileSize(image.size)}
                      </small>
                      {image.dimensions && (
                        <small className="text-muted">
                          {image.dimensions.width}×{image.dimensions.height}
                        </small>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )}

      <style jsx>{`
        .upload-area:hover {
          border-color: #007bff !important;
          background-color: #f8f9ff !important;
        }
        
        .upload-area.uploading {
          pointer-events: none;
          opacity: 0.7;
        }
        
        .image-preview-card {
          transition: transform 0.2s ease;
        }
        
        .image-preview-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .image-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 50%);
          opacity: 0;
          transition: opacity 0.3s ease;
          border-radius: 8px 8px 0 0;
        }
        
        .image-preview-card:hover .image-overlay {
          opacity: 1;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default ImageUpload;
