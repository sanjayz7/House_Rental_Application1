import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Row, Col, Form, Alert, Modal } from 'react-bootstrap';
import api, { purchaseAPI } from '../api';
import { useAuth } from '../context/AuthContext';

const ShowDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingQty, setBookingQty] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [rating, setRating] = useState(0);
  const [ratingSaved, setRatingSaved] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [showNavigationModal, setShowNavigationModal] = useState(false);
  const [navigationLoading, setNavigationLoading] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseAlert, setPurchaseAlert] = useState({ show: false, message: '', variant: 'success' });

  // Format date to more readable format
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Get user's current location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      setNavigationLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          
          // Calculate distance if we have both user location and property location
          if (show?.LATITUDE && show?.LONGITUDE) {
            const dist = calculateDistance(
              latitude, 
              longitude, 
              show.LATITUDE, 
              show.LONGITUDE
            );
            setDistance(dist);
          }
          setNavigationLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setNavigationLoading(false);
          alert('Unable to get your location. Please enable location services.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  // Open Google Maps with directions
  const openGoogleMapsDirections = () => {
    if (!userLocation) {
      getUserLocation();
      return;
    }

    if (show?.LATITUDE && show?.LONGITUDE) {
      const url = `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${show.LATITUDE},${show.LONGITUDE}`;
      window.open(url, '_blank');
    } else if (show?.ADDRESS) {
      const url = `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${encodeURIComponent(show.ADDRESS)}`;
      window.open(url, '_blank');
    }
  };

  // Fetch show data
  useEffect(() => {
    const fetchShowDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/listings/${id}`);
        setShow(response.data);
      } catch (err) {
        console.error('Error fetching show details:', err);
        setError('Failed to load show details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchShowDetails();
  }, [id]);

  useEffect(() => {
    // Load existing rating from localStorage
    const ratings = JSON.parse(localStorage.getItem('ratings') || '{}');
    if (ratings[id]) setRating(ratings[id]);
  }, [id]);

  const saveRating = () => {
    const ratings = JSON.parse(localStorage.getItem('ratings') || '{}');
    ratings[id] = rating;
    localStorage.setItem('ratings', JSON.stringify(ratings));
    setRatingSaved(true);
    setTimeout(() => setRatingSaved(false), 1500);
  };

  const handleBookTickets = async () => {
    if (!show) return;
    setBookingError(null);
    setBookingSuccess(null);
    if (bookingQty < 1) {
      setBookingError('Please select at least 1 ticket.');
      return;
    }
    if (bookingQty > (show.AVAILABLE_SEATS ?? 0)) {
      setBookingError('Not enough seats available for the requested quantity.');
      return;
    }
    try {
      setBookingLoading(true);
      // Attempt to update available seats via API (optimistic path)
      const newAvailable = (show.AVAILABLE_SEATS ?? 0) - bookingQty;
      await api.put(`/listings/${id}`, { available_units: newAvailable });
      setShow({ ...show, AVAILABLE_SEATS: newAvailable });
      setBookingSuccess(`Successfully booked ${bookingQty} ticket(s).`);
    } catch (e) {
      console.error('Error booking tickets:', e);
      setBookingError('Booking failed. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  // Handle free purchase
  const handlePurchase = async () => {
    if (!user) {
      setPurchaseAlert({
        show: true,
        message: 'Please login to purchase properties',
        variant: 'warning'
      });
      return;
    }

    if (user.role !== 'user') {
      setPurchaseAlert({
        show: true,
        message: 'Only regular users can purchase properties',
        variant: 'warning'
      });
      return;
    }

    if (!show || show.AVAILABLE_UNITS <= 0) {
      setPurchaseAlert({
        show: true,
        message: 'This property is no longer available',
        variant: 'warning'
      });
      return;
    }

    setPurchaseLoading(true);
    try {
      const response = await purchaseAPI.addPurchase(show.SHOW_ID, `Free purchase of ${show.TITLE}`);
      
      setPurchaseAlert({
        show: true,
        message: response.data.message,
        variant: 'success'
      });

      // Update available units
      setShow({ ...show, AVAILABLE_UNITS: show.AVAILABLE_UNITS - 1 });
      
      // Hide alert after 5 seconds
      setTimeout(() => {
        setPurchaseAlert({ show: false, message: '', variant: 'success' });
      }, 5000);

    } catch (error) {
      console.error('Purchase error:', error);
      setPurchaseAlert({
        show: true,
        message: error.response?.data?.message || 'Failed to purchase property. Please try again.',
        variant: 'danger'
      });
      
      // Hide alert after 5 seconds
      setTimeout(() => {
        setPurchaseAlert({ show: false, message: '', variant: 'success' });
      }, 5000);
    } finally {
      setPurchaseLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-5"><h3>Loading listing details...</h3></div>;
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
        <Button variant="link" onClick={() => navigate('/')}>Return to Listings</Button>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="text-center py-5">
        <h3>Listing not found</h3>
        <Button variant="primary" onClick={() => navigate('/')}>Return to Listings</Button>
      </div>
    );
  }

  return (
    <div>
      {/* Purchase Alert */}
      {purchaseAlert.show && (
        <Alert 
          variant={purchaseAlert.variant} 
          dismissible 
          onClose={() => setPurchaseAlert({ show: false, message: '', variant: 'success' })}
          className="mb-3"
        >
          {purchaseAlert.message}
        </Alert>
      )}

      <div className="d-flex justify-content-between align-items-center page-header">
        <h2>Listing Details</h2>
        <div>
          <Button 
            variant="outline-secondary" 
            onClick={() => navigate(`/show/edit/${id}`)}
            className="me-2"
          >
            Edit Listing
          </Button>
          <Button 
            variant="outline-warning" 
            className="me-2"
            onClick={() => {
              const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
              if (!favs.find(f => f.SHOW_ID === show.SHOW_ID)) {
                favs.push(show);
                localStorage.setItem('favorites', JSON.stringify(favs));
              }
              navigate('/favorites');
            }}
          >
            Add to Favorites
          </Button>
          <Button 
            variant="primary" 
            onClick={() => navigate('/')}
          >
            Back to Listings
          </Button>
        </div>
      </div>

      <Card className="show-details mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h3 className="mb-0">{show.TITLE}</h3>
          {show.CATEGORY && (
            <Badge bg="info" className="px-3 py-2">{show.CATEGORY}</Badge>
          )}
          {show.VERIFIED && (
            <Badge bg="success" className="px-3 py-2 ms-2">Verified</Badge>
          )}
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={8}>
              {show.IMAGE_URL && (
                <div className="mb-3">
                  <img src={show.IMAGE_URL} alt={show.TITLE} style={{ maxWidth: '100%', borderRadius: 8 }} />
                </div>
              )}
              {show.DESCRIPTION && (
                <div className="mb-4">
                  <h5>Description</h5>
                  <p>{show.DESCRIPTION}</p>
                </div>
              )}

              <div className="mb-4">
                <h5>Rating</h5>
                <div className="d-flex align-items-center gap-2">
                  <Form.Range min={1} max={5} value={rating} onChange={(e) => setRating(Number(e.target.value))} />
                  <span>{rating || 0}/5</span>
                  {user?.role === 'user' && (
                    <Button size="sm" variant="outline-primary" onClick={saveRating}>Save Rating</Button>
                  )}
                </div>
                {ratingSaved && <small className="text-success">Rating saved</small>}
              </div>

              <Row className="mb-4">
                <Col md={6}>
                  <h5>Availability</h5>
                  <p>
                    <strong>Available From:</strong> {formatDate(show.SHOW_DATE)}<br />
                    {show.PRICE && (<><strong>Rent:</strong> ${show.PRICE} / month</>)}<br />
                    {show.BEDROOMS ? <><strong>Bedrooms:</strong> {show.BEDROOMS}<br /></> : null}
                    {show.BATHROOMS ? <><strong>Bathrooms:</strong> {show.BATHROOMS}<br /></> : null}
                    {show.AREA_SQFT ? <><strong>Area:</strong> {show.AREA_SQFT} sqft<br /></> : null}
                    {show.FURNISHED ? <><strong>Furnishing:</strong> {show.FURNISHED}</> : null}
                  </p>
                </Col>
                <Col md={6}>
                  <h5>Address</h5>
                  <p>{show.ADDRESS || show.VENUE}</p>
                </Col>
              </Row>
            </Col>
            
            <Col md={4}>
              <Card className="bg-light">
                <Card.Body>
                  <h5>Contact & Location</h5>
                  <p className="mb-2">
                    <strong>Owner Phone:</strong> {show.OWNER_PHONE || 'N/A'}
                  </p>
                  <p className="mb-2">
                    <strong>Coordinates:</strong> {show.LATITUDE ?? 'N/A'}, {show.LONGITUDE ?? 'N/A'}
                  </p>
                  
                  {/* Distance Information */}
                  {distance && (
                    <div className="mb-3 p-2 bg-white rounded border">
                      <h6 className="mb-1">Distance from your location:</h6>
                      <p className="mb-0 text-primary fw-bold">{distance.toFixed(1)} km</p>
                    </div>
                  )}
                  
                  <div className="mt-3 d-grid gap-2">
                    <Button
                      variant="success"
                      onClick={() => setShowNavigationModal(true)}
                      disabled={navigationLoading}
                    >
                      {navigationLoading ? 'Getting Location...' : 'Navigate to Property'}
                    </Button>
                    
                    {!userLocation && (
                      <Button
                        variant="outline-info"
                        onClick={getUserLocation}
                        disabled={navigationLoading}
                      >
                        {navigationLoading ? 'Getting Location...' : 'Get My Location'}
                      </Button>
                    )}
                    
                    {show.OWNER_PHONE && (
                      <Button as="a" href={`tel:${show.OWNER_PHONE}`} variant="outline-primary">Call Owner</Button>
                    )}
                    
                    {/* Free Purchase Button for Users */}
                    {user?.role === 'user' && show.AVAILABLE_UNITS > 0 && (
                      <Button 
                        variant="success" 
                        onClick={handlePurchase}
                        disabled={purchaseLoading}
                        className="mt-2"
                      >
                        {purchaseLoading ? 'Purchasing...' : '🏠 Buy for FREE'}
                      </Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
        <Card.Footer className="text-muted">
          <small>
            Created: {new Date(show.CREATED_AT).toLocaleString()}<br />
            Last Updated: {new Date(show.UPDATED_AT).toLocaleString()}
          </small>
        </Card.Footer>
      </Card>

      {/* Navigation Modal */}
      <Modal show={showNavigationModal} onHide={() => setShowNavigationModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Navigation to Property</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!userLocation ? (
            <div className="text-center py-4">
              <p>We need your current location to provide navigation directions.</p>
              <Button 
                variant="primary" 
                onClick={getUserLocation}
                disabled={navigationLoading}
              >
                {navigationLoading ? 'Getting Location...' : 'Get My Location'}
              </Button>
            </div>
          ) : (
            <div>
              <Row className="mb-3">
                <Col md={6}>
                  <h6>Your Location</h6>
                  <p className="mb-1">
                    <strong>Latitude:</strong> {userLocation.lat.toFixed(6)}
                  </p>
                  <p className="mb-1">
                    <strong>Longitude:</strong> {userLocation.lng.toFixed(6)}
                  </p>
                </Col>
                <Col md={6}>
                  <h6>Property Location</h6>
                  <p className="mb-1">
                    <strong>Address:</strong> {show.ADDRESS || show.VENUE || 'N/A'}
                  </p>
                  <p className="mb-1">
                    <strong>Coordinates:</strong> {show.LATITUDE?.toFixed(6) || 'N/A'}, {show.LONGITUDE?.toFixed(6) || 'N/A'}
                  </p>
                </Col>
              </Row>
              
              {distance && (
                <div className="alert alert-info">
                  <h6 className="mb-2">Route Information</h6>
                  <p className="mb-1">
                    <strong>Distance:</strong> {distance.toFixed(1)} km
                  </p>
                  <p className="mb-1">
                    <strong>Estimated Travel Time:</strong> {Math.round(distance * 2)} minutes (by car)
                  </p>
                </div>
              )}
              
              <div className="d-grid gap-2">
                <Button
                  variant="success"
                  size="lg"
                  onClick={openGoogleMapsDirections}
                >
                  🗺️ Open Google Maps Directions
                </Button>
                
                <Button
                  variant="outline-primary"
                  onClick={() => {
                    if (show?.LATITUDE && show?.LONGITUDE) {
                      const url = `https://www.google.com/maps/search/?api=1&query=${show.LATITUDE},${show.LONGITUDE}`;
                      window.open(url, '_blank');
                    }
                  }}
                >
                  📍 View Property on Map
                </Button>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNavigationModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ShowDetails;