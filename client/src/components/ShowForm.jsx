import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import ImageUpload from './ImageUpload';

const ShowForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    address: '',
    latitude: '',
    longitude: '',
    owner_phone: '',
    bedrooms: '',
    bathrooms: '',
    area_sqft: '',
    furnished: '',
    verified: false,
    deposit: '',
    show_date: '',
    start_time: '',
    end_time: '',
    price: '',
    total_seats: '',
    available_seats: '',
    venue: '',
    category: ''
  });

  const [images, setImages] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch listing data if in edit mode
  useEffect(() => {
    const fetchShow = async () => {
      if (isEditMode) {
        try {
          setLoading(true);
          const response = await api.get(`/listings/${id}`);
          const show = response.data;
          
          // Format date for form input
          const formattedDate = new Date(show.SHOW_DATE).toISOString().split('T')[0];
          
          setFormData({
            title: show.TITLE || '',
            description: show.DESCRIPTION || '',
            image_url: show.IMAGE_URL || '',
            address: show.ADDRESS || '',
            latitude: show.LATITUDE || '',
            longitude: show.LONGITUDE || '',
            owner_phone: show.OWNER_PHONE || '',
            bedrooms: show.BEDROOMS || '',
            bathrooms: show.BATHROOMS || '',
            area_sqft: show.AREA_SQFT || '',
            furnished: show.FURNISHED || '',
            verified: !!show.VERIFIED,
            deposit: show.DEPOSIT || '',
            show_date: formattedDate,
            start_time: show.START_TIME || '',
            end_time: show.END_TIME || '',
            price: show.PRICE || '',
            total_seats: show.TOTAL_SEATS || '',
            available_seats: show.AVAILABLE_SEATS || '',
            venue: show.VENUE || '',
            category: show.CATEGORY || ''
          });

          // Load existing images if any
          if (show.IMAGE_URL) {
            setImages([{
              id: 1,
              preview: show.IMAGE_URL,
              name: 'Existing Image',
              size: 0,
              dimensions: null
            }]);
          }
        } catch (err) {
          console.error('Error fetching listing:', err);
          setError('Failed to load listing data. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchShow();
  }, [id, isEditMode]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Validate images
      if (images.length === 0) {
        setError('Please upload at least one property photo.');
        setLoading(false);
        return;
      }
      
      // Prepare data for submission
      let dataToSubmit = {...formData};
      
      // Handle images - use the first image as primary image_url for backward compatibility
      if (images.length > 0) {
        dataToSubmit.image_url = images[0].preview;
        // For future enhancement, we could store all images in a separate field
        dataToSubmit.images = images.map(img => ({
          url: img.preview,
          name: img.name,
          size: img.size,
          dimensions: img.dimensions
        }));
      }
      
      if (isEditMode) {
        // Update listing
        await api.put(`/listings/${id}`, dataToSubmit);
        setSuccess('Listing updated successfully!');
      } else {
        // Create new listing
        await api.post('/listings', dataToSubmit);
        setSuccess('Listing created successfully!');
        
        // Clear form in create mode
        setFormData({
          title: '',
          description: '',
          image_url: '',
          address: '',
          latitude: '',
          longitude: '',
          owner_phone: '',
          bedrooms: '',
          bathrooms: '',
          area_sqft: '',
          furnished: '',
          verified: false,
          deposit: '',
          show_date: '',
          start_time: '',
          end_time: '',
          price: '',
          total_seats: '',
          available_seats: '',
          venue: '',
          category: ''
        });
        setImages([]);
      }
      
      // Navigate to listings after short delay
      setTimeout(() => {
        navigate('/');
      }, 1500);
      
    } catch (err) {
      console.error('Error saving listing:', err);
      setError('Failed to save listing. Please check your input and try again.');
    } finally {
      setLoading(false);
    }
  };


  // Handle total seats change - update available seats
  const handleTotalSeatsChange = (e) => {
    const totalSeats = e.target.value;
    // Only update available seats when creating a new show
    if (!isEditMode) {
      setFormData({
        ...formData,
        total_seats: totalSeats,
        available_seats: totalSeats
      });
    } else {
      setFormData({
        ...formData,
        total_seats: totalSeats
      });
    }
  };

  return (
    <div>
      <h2 className="page-header">{isEditMode ? 'Edit Listing' : 'Add New Listing'}</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      
      <Card className="p-4 mb-4">
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Title*</Form.Label>
            <Form.Control
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Enter listing title"
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label className="fw-bold">
              Property Photos <span className="text-danger">*</span>
            </Form.Label>
            <ImageUpload
              images={images}
              onImagesChange={setImages}
              maxImages={10}
              maxSizeMB={5}
              showGuidelines={true}
            />
            <Form.Text className="text-muted">
              Upload high-quality photos of your property. The first image will be used as the main photo.
            </Form.Text>
          </Form.Group>

          <div className="row">
            <div className="col-md-8">
              <Form.Group className="mb-3">
                <Form.Label>Address</Form.Label>
                <Form.Control
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Main St, City, State"
                />
              </Form.Group>
            </div>
            <div className="col-md-4">
              <Form.Group className="mb-3">
                <Form.Label>Owner Phone</Form.Label>
                <Form.Control
                  type="tel"
                  name="owner_phone"
                  value={formData.owner_phone}
                  onChange={handleChange}
                  placeholder="+1 555 555 5555"
                />
              </Form.Group>
            </div>
          </div>

          <div className="row">
            <div className="col-md-4">
              <Form.Group className="mb-3">
                <Form.Label>Bedrooms</Form.Label>
                <Form.Control
                  type="number"
                  name="bedrooms"
                  min="0"
                  value={formData.bedrooms}
                  onChange={handleChange}
                  placeholder="e.g., 2"
                />
              </Form.Group>
            </div>
            <div className="col-md-4">
              <Form.Group className="mb-3">
                <Form.Label>Bathrooms</Form.Label>
                <Form.Control
                  type="number"
                  name="bathrooms"
                  min="0"
                  value={formData.bathrooms}
                  onChange={handleChange}
                  placeholder="e.g., 2"
                />
              </Form.Group>
            </div>
            <div className="col-md-4">
              <Form.Group className="mb-3">
                <Form.Label>Area (sqft)</Form.Label>
                <Form.Control
                  type="number"
                  name="area_sqft"
                  min="0"
                  value={formData.area_sqft}
                  onChange={handleChange}
                  placeholder="e.g., 1200"
                />
              </Form.Group>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Latitude</Form.Label>
                <Form.Control
                  type="number"
                  step="any"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  placeholder="e.g., 37.7749"
                />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Longitude</Form.Label>
                <Form.Control
                  type="number"
                  step="any"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  placeholder="e.g., -122.4194"
                />
              </Form.Group>
            </div>
          </div>

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Describe the house (rooms, amenities, rules)"
            />
          </Form.Group>

          <div className="row">
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Available From*</Form.Label>
                <Form.Control
                  type="date"
                  name="show_date"
                  value={formData.show_date}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </div>

            <div className="col-md-3">
              <Form.Group className="mb-3">
                <Form.Label>Contact Time Start</Form.Label>
                <Form.Control
                  type="time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                />
              </Form.Group>
            </div>

            <div className="col-md-3">
              <Form.Group className="mb-3">
                <Form.Label>Contact Time End</Form.Label>
                <Form.Control
                  type="time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleChange}
                />
              </Form.Group>
            </div>
          </div>

          <div className="row">
            <div className="col-md-4">
              <Form.Group className="mb-3">
                <Form.Label>Rent ($/month)*</Form.Label>
                <Form.Control
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                />
              </Form.Group>
            </div>

            <div className="col-md-4">
              <Form.Group className="mb-3">
                <Form.Label>Total Units*</Form.Label>
                <Form.Control
                  type="number"
                  name="total_seats"
                  value={formData.total_seats}
                  onChange={handleTotalSeatsChange}
                  required
                  min="1"
                />
              </Form.Group>
            </div>

            {isEditMode && (
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>Available Units*</Form.Label>
                  <Form.Control
                    type="number"
                    name="available_seats"
                    value={formData.available_seats}
                    onChange={handleChange}
                    required
                    min="0"
                    max={formData.total_seats}
                  />
                </Form.Group>
              </div>
            )}
          </div>

          <div className="row">
            <div className="col-md-8">
              <Form.Group className="mb-3">
                <Form.Label>City/Area*</Form.Label>
                <Form.Control
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  required
                  placeholder="Enter city or area"
                />
              </Form.Group>
            </div>

            <div className="col-md-4">
              <Form.Group className="mb-3">
                <Form.Label>Category</Form.Label>
                <Form.Select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="">Select a category</option>
                  <option value="Apartment">Apartment</option>
                  <option value="House">House</option>
                  <option value="Studio">Studio</option>
                  <option value="PG">PG</option>
                  <option value="Other">Other</option>
                </Form.Select>
              </Form.Group>
            </div>
          </div>

          <div className="d-flex mt-4">
            <Button 
              variant="secondary" 
              className="me-2"
              onClick={() => navigate('/')}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit" 
              disabled={loading}
            >
              {loading ? 'Saving...' : (isEditMode ? 'Update Listing' : 'Create Listing')}
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default ShowForm;