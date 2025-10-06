import React, { useState } from 'react';
import { Form, Button, Card, Alert, Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import ImageUpload from './ImageUpload';

const HouseOwnerAddListing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    latitude: '',
    longitude: '',
    owner_phone: '',
    bedrooms: '',
    bathrooms: '',
    area_sqft: '',
    furnished: '',
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
      
      // Validate required fields
      if (!formData.title || !formData.price || !formData.venue || !formData.show_date) {
        setError('Please fill in all required fields.');
        setLoading(false);
        return;
      }
      
      // Validate images
      if (images.length === 0) {
        setError('Please upload at least one property photo.');
        setLoading(false);
        return;
      }
      
      // Prepare data for submission
      let dataToSubmit = {
        ...formData,
        ownerEmail: user?.email,
        verified: false, // New listings start as unverified
        rent: formData.price, // Map price to rent for consistency
        image_url: images[0].preview, // Use first image as primary
        images: images.map(img => ({
          url: img.preview,
          name: img.name,
          size: img.size,
          dimensions: img.dimensions
        }))
      };
      
      // Create new listing
      await api.post('/listings', dataToSubmit);
      setSuccess('Property listed successfully! It will be reviewed by our team before going live.');
      
      // Clear form
      setFormData({
        title: '',
        description: '',
        address: '',
        latitude: '',
        longitude: '',
        owner_phone: '',
        bedrooms: '',
        bathrooms: '',
        area_sqft: '',
        furnished: '',
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
      
      // Navigate to dashboard after short delay
      setTimeout(() => {
        navigate('/owner-dashboard');
      }, 2000);
      
    } catch (err) {
      console.error('Error creating listing:', err);
      setError('Failed to create listing. Please check your input and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle total seats change - update available seats
  const handleTotalSeatsChange = (e) => {
    const totalSeats = e.target.value;
    setFormData({
      ...formData,
      total_seats: totalSeats,
      available_seats: totalSeats
    });
  };

  return (
    <div className="owner-add-listing">
      <Container>
        <Row className="justify-content-center">
          <Col lg={10}>
            {/* Header */}
            <div className="text-center mb-4">
              <h2 className="page-header">
                <i className="fas fa-plus-circle me-2 text-success"></i>
                Add New Property Listing
              </h2>
              <p className="text-muted">Fill in the details below to list your property for rent</p>
            </div>
            
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}
            
            <Card className="shadow">
              <Card.Body className="p-4">
                <Form onSubmit={handleSubmit}>
                  {/* Basic Information */}
                  <div className="mb-4">
                    <h5 className="text-primary mb-3">
                      <i className="fas fa-info-circle me-2"></i>
                      Basic Information
                    </h5>
                    
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Property Title *</Form.Label>
                      <Form.Control
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        placeholder="e.g., Beautiful 2BR Apartment in Downtown"
                        className="form-control-lg"
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

                    <Row>
                      <Col md={8}>
                        <Form.Group className="mb-3">
                          <Form.Label>Property Address</Form.Label>
                          <Form.Control
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="123 Main St, City, State, ZIP"
                            className="form-control-lg"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Contact Phone</Form.Label>
                          <Form.Control
                            type="tel"
                            name="owner_phone"
                            value={formData.owner_phone}
                            onChange={handleChange}
                            placeholder="+1 555 555 5555"
                            className="form-control-lg"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label>Property Description</Form.Label>
                      <Form.Control
                        as="textarea"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        placeholder="Describe your property, amenities, nearby facilities, etc."
                        className="form-control-lg"
                      />
                    </Form.Group>
                  </div>

                  {/* Property Details */}
                  <div className="mb-4">
                    <h5 className="text-primary mb-3">
                      <i className="fas fa-home me-2"></i>
                      Property Details
                    </h5>
                    
                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Bedrooms</Form.Label>
                          <Form.Control
                            type="number"
                            name="bedrooms"
                            min="0"
                            value={formData.bedrooms}
                            onChange={handleChange}
                            placeholder="e.g., 2"
                            className="form-control-lg"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Bathrooms</Form.Label>
                          <Form.Control
                            type="number"
                            name="bathrooms"
                            min="0"
                            value={formData.bathrooms}
                            onChange={handleChange}
                            placeholder="e.g., 2"
                            className="form-control-lg"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Area (sqft)</Form.Label>
                          <Form.Control
                            type="number"
                            name="area_sqft"
                            min="0"
                            value={formData.area_sqft}
                            onChange={handleChange}
                            placeholder="e.g., 1200"
                            className="form-control-lg"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Furnished Status</Form.Label>
                          <Form.Select
                            name="furnished"
                            value={formData.furnished}
                            onChange={handleChange}
                            className="form-control-lg"
                          >
                            <option value="">Select option</option>
                            <option value="Fully Furnished">Fully Furnished</option>
                            <option value="Semi Furnished">Semi Furnished</option>
                            <option value="Unfurnished">Unfurnished</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Security Deposit ($)</Form.Label>
                          <Form.Control
                            type="number"
                            name="deposit"
                            min="0"
                            value={formData.deposit}
                            onChange={handleChange}
                            placeholder="e.g., 1000"
                            className="form-control-lg"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>

                  {/* Location & Availability */}
                  <div className="mb-4">
                    <h5 className="text-primary mb-3">
                      <i className="fas fa-map-marker-alt me-2"></i>
                      Location & Availability
                    </h5>
                    
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Latitude</Form.Label>
                          <Form.Control
                            type="number"
                            step="any"
                            name="latitude"
                            value={formData.latitude}
                            onChange={handleChange}
                            placeholder="e.g., 37.7749"
                            className="form-control-lg"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Longitude</Form.Label>
                          <Form.Control
                            type="number"
                            step="any"
                            name="longitude"
                            value={formData.longitude}
                            onChange={handleChange}
                            placeholder="e.g., -122.4194"
                            className="form-control-lg"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Available From *</Form.Label>
                          <Form.Control
                            type="date"
                            name="show_date"
                            value={formData.show_date}
                            onChange={handleChange}
                            required
                            className="form-control-lg"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>Contact Time Start</Form.Label>
                          <Form.Control
                            type="time"
                            name="start_time"
                            value={formData.start_time}
                            onChange={handleChange}
                            className="form-control-lg"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>Contact Time End</Form.Label>
                          <Form.Control
                            type="time"
                            name="end_time"
                            value={formData.end_time}
                            onChange={handleChange}
                            className="form-control-lg"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>

                  {/* Pricing & Details */}
                  <div className="mb-4">
                    <h5 className="text-primary mb-3">
                      <i className="fas fa-dollar-sign me-2"></i>
                      Pricing & Details
                    </h5>
                    
                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Monthly Rent ($) *</Form.Label>
                          <Form.Control
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            required
                            min="0"
                            step="0.01"
                            placeholder="e.g., 1500"
                            className="form-control-lg"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Total Units *</Form.Label>
                          <Form.Control
                            type="number"
                            name="total_seats"
                            value={formData.total_seats}
                            onChange={handleTotalSeatsChange}
                            required
                            min="1"
                            placeholder="e.g., 1"
                            className="form-control-lg"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Available Units</Form.Label>
                          <Form.Control
                            type="number"
                            name="available_seats"
                            value={formData.available_seats}
                            onChange={handleChange}
                            min="0"
                            max={formData.total_seats}
                            placeholder="e.g., 1"
                            className="form-control-lg"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={8}>
                        <Form.Group className="mb-3">
                          <Form.Label>City/Area *</Form.Label>
                          <Form.Control
                            type="text"
                            name="venue"
                            value={formData.venue}
                            onChange={handleChange}
                            required
                            placeholder="Enter city or area"
                            className="form-control-lg"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Property Type</Form.Label>
                          <Form.Select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="form-control-lg"
                          >
                            <option value="">Select type</option>
                            <option value="Apartment">Apartment</option>
                            <option value="House">House</option>
                            <option value="Studio">Studio</option>
                            <option value="PG">PG (Paying Guest)</option>
                            <option value="Other">Other</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>

                  {/* Submit Buttons */}
                  <div className="d-flex justify-content-between mt-4">
                    <Button 
                      variant="outline-secondary" 
                      size="lg"
                      onClick={() => navigate('/owner-dashboard')}
                    >
                      <i className="fas fa-arrow-left me-2"></i>
                      Back to Dashboard
                    </Button>
                    <Button 
                      variant="success" 
                      type="submit" 
                      size="lg"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Creating Listing...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-plus me-2"></i>
                          Create Property Listing
                        </>
                      )}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default HouseOwnerAddListing;
