import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Card, Button, Badge, Modal, Form, InputGroup, Pagination, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import api, { purchaseAPI } from '../api';
import { useAuth } from '../context/AuthContext';

const ShowList = () => {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showToDelete, setShowToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [sortKey, setSortKey] = useState('dateAsc');
  const [currentPage, setCurrentPage] = useState(1);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const { user } = useAuth();
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [radiusKm, setRadiusKm] = useState(10);
  const [userLocation, setUserLocation] = useState(null);
  const [furnishedFilter, setFurnishedFilter] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [minBedrooms, setMinBedrooms] = useState('');
  const [minBathrooms, setMinBathrooms] = useState('');
  const [purchaseAlert, setPurchaseAlert] = useState({ show: false, message: '', variant: 'success' });
  const [purchasing, setPurchasing] = useState(false);
  const pageSize = 6;
  
  const navigate = useNavigate();

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
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please enable location services.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  // Format date to more readable format
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Fetch shows from API
  const fetchShows = async () => {
    try {
      setLoading(true);
      // Switch to new listings API
      const response = await api.get('/listings', { params: {
        q: searchQuery || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        category: categoryFilter || undefined
      }});
      setShows(response.data.items || response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch shows. Please try again later.');
      console.error('Error fetching shows:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShows();
  }, []);

  // Force nearby-only for end users
  useEffect(() => {
    if (user?.role === 'user') {
      setNearbyOnly(true);
      if (!userLocation && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        });
      }
    }
  }, [user]);

  // Derived data: filtered, sorted, paginated
  const categories = useMemo(() => {
    const set = new Set();
    shows.forEach(s => { if (s.CATEGORY) set.add(s.CATEGORY); });
    return Array.from(set);
  }, [shows]);

  const filtered = useMemo(() => {
    const havDistKm = (lat1, lon1, lat2, lon2) => {
      const toRad = (v) => (v * Math.PI) / 180;
      const R = 6371;
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    return shows.filter(s => {
      const matchesSearch = `${s.TITLE || ''} ${s.DESCRIPTION || ''} ${s.VENUE || ''}`
        .toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !categoryFilter || s.CATEGORY === categoryFilter;
      const available = (s.AVAILABLE_SEATS ?? 0) > 0;
      const matchesAvailability = !availabilityFilter ||
        (availabilityFilter === 'available' && available) ||
        (availabilityFilter === 'soldout' && !available);
      const price = Number(s.PRICE ?? 0);
      const meetsMin = minPrice === '' || price >= Number(minPrice);
      const meetsMax = maxPrice === '' || price <= Number(maxPrice);
      const meetsNearby = !nearbyOnly || !userLocation || (s.LATITUDE != null && s.LONGITUDE != null &&
        calculateDistance(userLocation.lat, userLocation.lng, Number(s.LATITUDE), Number(s.LONGITUDE)) <= Number(radiusKm));
      const meetsFurnished = !furnishedFilter || (String(s.FURNISHED || '').toLowerCase() === furnishedFilter.toLowerCase());
      const meetsVerified = !verifiedOnly || !!s.VERIFIED;
      const meetsBeds = minBedrooms === '' || Number(s.BEDROOMS || 0) >= Number(minBedrooms);
      const meetsBaths = minBathrooms === '' || Number(s.BATHROOMS || 0) >= Number(minBathrooms);
      return matchesSearch && matchesCategory && matchesAvailability && meetsMin && meetsMax && meetsNearby && meetsFurnished && meetsVerified && meetsBeds && meetsBaths;
    });
  }, [shows, searchQuery, categoryFilter, availabilityFilter, minPrice, maxPrice, nearbyOnly, userLocation, radiusKm, furnishedFilter, verifiedOnly, minBedrooms, minBathrooms]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    switch (sortKey) {
      case 'dateAsc':
        list.sort((a, b) => new Date(a.SHOW_DATE) - new Date(b.SHOW_DATE));
        break;
      case 'dateDesc':
        list.sort((a, b) => new Date(b.SHOW_DATE) - new Date(a.SHOW_DATE));
        break;
      case 'priceAsc':
        list.sort((a, b) => (a.PRICE ?? 0) - (b.PRICE ?? 0));
        break;
      case 'priceDesc':
        list.sort((a, b) => (b.PRICE ?? 0) - (a.PRICE ?? 0));
        break;
      case 'distanceAsc':
        if (userLocation) {
          list.sort((a, b) => {
            const distA = a.LATITUDE && a.LONGITUDE ? 
              calculateDistance(userLocation.lat, userLocation.lng, a.LATITUDE, a.LONGITUDE) : Infinity;
            const distB = b.LATITUDE && b.LONGITUDE ? 
              calculateDistance(userLocation.lat, userLocation.lng, b.LATITUDE, b.LONGITUDE) : Infinity;
            return distA - distB;
          });
        }
        break;
      default:
        break;
    }
    return list;
  }, [filtered, sortKey, userLocation]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, currentPage]);

  useEffect(() => {
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, availabilityFilter, sortKey]);

  // Handle show edit
  const handleEdit = (id) => {
    navigate(`/show/edit/${id}`);
  };

  // Handle show delete confirmation
  const handleDeleteConfirmation = (show) => {
    setShowToDelete(show);
    setShowDeleteModal(true);
  };

  // Handle show delete
  const handleDelete = async () => {
    if (!showToDelete) return;
    
    try {
      await api.delete(`/listings/${showToDelete.LISTING_ID || showToDelete.SHOW_ID}`);
      setShowDeleteModal(false);
      setShowToDelete(null);
      fetchShows(); // Refresh the list
    } catch (err) {
      console.error('Error deleting show:', err);
      setError('Failed to delete show. Please try again.');
    }
  };

  // Handle view details
  const handleViewDetails = (id) => {
    navigate(`/show/${id}`);
  };

  // Handle free purchase
  const handlePurchase = async (listingId, title) => {
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

    setPurchasing(true);
    try {
      const response = await purchaseAPI.addPurchase(listingId, `Free purchase of ${title}`);
      
      setPurchaseAlert({
        show: true,
        message: response.data.message,
        variant: 'success'
      });

      // Refresh the listings to update availability
      fetchShows();
      
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
      setPurchasing(false);
    }
  };

  if (loading) {
    return <div className="text-center py-5"><h3>Loading shows...</h3></div>;
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
        <Button variant="link" onClick={fetchShows}>Try Again</Button>
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
        <h2>Listings</h2>
        {user?.role === 'owner' && (
          <Button as={Link} to="/show/new" variant="primary">
            Add New Listing
          </Button>
        )}
      </div>

      <Row className="mb-3">
        <Col md={6} className="mb-2">
          <InputGroup>
            <InputGroup.Text>Search</InputGroup.Text>
            <Form.Control
              placeholder="Title, venue, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={3} className="mb-2 d-flex align-items-center">
          <Form.Check
            type="switch"
            id="nearby-switch"
            label="Nearby only"
            checked={nearbyOnly}
            onChange={(e) => {
              const value = e.target.checked;
              setNearbyOnly(value);
              if (value && !userLocation) {
                getUserLocation();
              }
            }}
            disabled={user?.role === 'user'}
          />
          {!userLocation && (
            <Button
              variant="outline-info"
              size="sm"
              className="ms-2"
              onClick={getUserLocation}
            >
              📍 Get Location
            </Button>
          )}
        </Col>
        <Col md={3} className="mb-2">
          <InputGroup>
            <InputGroup.Text>Radius km</InputGroup.Text>
            <Form.Control
              type="number"
              min="1"
              step="1"
              value={radiusKm}
              onChange={(e) => setRadiusKm(e.target.value)}
              disabled={!nearbyOnly}
            />
          </InputGroup>
        </Col>
        <Col md={3} className="mb-2">
          <InputGroup>
            <InputGroup.Text>Min $</InputGroup.Text>
            <Form.Control
              type="number"
              min="0"
              step="0.01"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={3} className="mb-2">
          <InputGroup>
            <InputGroup.Text>Max $</InputGroup.Text>
            <Form.Control
              type="number"
              min="0"
              step="0.01"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={2} className="mb-2">
          <Form.Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Form.Select>
        </Col>
        <Col md={2} className="mb-2">
          <Form.Select value={availabilityFilter} onChange={(e) => setAvailabilityFilter(e.target.value)}>
            <option value="">All Availability</option>
            <option value="available">Available</option>
            <option value="soldout">Sold Out</option>
          </Form.Select>
        </Col>
        <Col md={2} className="mb-2">
          <Form.Select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
            <option value="dateAsc">Date: Soonest</option>
            <option value="dateDesc">Date: Latest</option>
            <option value="priceAsc">Price: Low to High</option>
            <option value="priceDesc">Price: High to Low</option>
            {userLocation && <option value="distanceAsc">Distance: Nearest</option>}
          </Form.Select>
        </Col>
        <Col md={2} className="mb-2">
          <Form.Select value={furnishedFilter} onChange={(e) => setFurnishedFilter(e.target.value)}>
            <option value="">Any Furnishing</option>
            <option value="Furnished">Furnished</option>
            <option value="Semi-Furnished">Semi-Furnished</option>
            <option value="Unfurnished">Unfurnished</option>
          </Form.Select>
        </Col>
        <Col md={2} className="mb-2 d-flex align-items-center">
          <Form.Check
            type="switch"
            id="verified-switch"
            label="Verified"
            checked={verifiedOnly}
            onChange={(e) => setVerifiedOnly(e.target.checked)}
          />
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={3} className="mb-2">
          <InputGroup>
            <InputGroup.Text>Min Beds</InputGroup.Text>
            <Form.Control type="number" min="0" value={minBedrooms} onChange={(e) => setMinBedrooms(e.target.value)} />
          </InputGroup>
        </Col>
        <Col md={3} className="mb-2">
          <InputGroup>
            <InputGroup.Text>Min Baths</InputGroup.Text>
            <Form.Control type="number" min="0" value={minBathrooms} onChange={(e) => setMinBathrooms(e.target.value)} />
          </InputGroup>
        </Col>
      </Row>

      {sorted.length === 0 ? (
        <div className="text-center py-5">
          <h3>No listings found</h3>
          <p>Try adjusting your filters or create a new listing.</p>
        </div>
      ) : (
        <Row>
          {pageItems.map((show) => (
            <Col md={4} key={show.SHOW_ID}>
              <Card className="show-card">
                <Card.Header>{show.TITLE}</Card.Header>
                <Card.Body>
                  {show.IMAGE_URL && (
                    <div className="mb-2">
                      <img src={show.IMAGE_URL} alt={show.TITLE} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 6 }} />
                    </div>
                  )}
                  <Card.Title>
                    {formatDate(show.SHOW_DATE)}
                    {show.CATEGORY && (
                      <Badge bg="info" className="ms-2">{show.CATEGORY}</Badge>
                    )}
                    {show.VERIFIED && (
                      <Badge bg="success" className="ms-2">Verified</Badge>
                    )}
                  </Card.Title>
                  <Card.Text>
                    <strong>Rent:</strong> ${show.PRICE}
                    <br />
                    <strong>Address:</strong> {show.ADDRESS || show.VENUE}
                    <br />
                    {show.BEDROOMS ? <span><strong>Bedrooms:</strong> {show.BEDROOMS}&nbsp;&nbsp;</span> : null}
                    {show.BATHROOMS ? <span><strong>Bathrooms:</strong> {show.BATHROOMS}&nbsp;&nbsp;</span> : null}
                    {show.AREA_SQFT ? <span><strong>Area:</strong> {show.AREA_SQFT} sqft</span> : null}
                    <br />
                    {show.LATITUDE != null && show.LONGITUDE != null && (
                      <span>
                        <strong>Location:</strong> {show.LATITUDE}, {show.LONGITUDE}
                        {userLocation && (
                          <span className="ms-2">
                            <strong>Distance:</strong> {calculateDistance(userLocation.lat, userLocation.lng, show.LATITUDE, show.LONGITUDE).toFixed(1)} km
                          </span>
                        )}
                      </span>
                    )}
                  </Card.Text>
                </Card.Body>
                <Card.Footer className="d-flex justify-content-between">
                  <Button 
                    variant="outline-primary" 
                    className="btn-action"
                    onClick={() => handleViewDetails(show.SHOW_ID)}
                  >
                    View Details
                  </Button>
                  <div>
                    {/* Free Purchase Button for Users */}
                    {user?.role === 'user' && show.AVAILABLE_UNITS > 0 && (
                      <Button 
                        variant="success" 
                        className="btn-action me-2"
                        onClick={() => handlePurchase(show.SHOW_ID, show.TITLE)}
                        disabled={purchasing}
                      >
                        {purchasing ? 'Purchasing...' : '🏠 Buy for FREE'}
                      </Button>
                    )}
                    
                    {user?.role !== 'owner' && (
                      <Button 
                        variant="outline-warning" 
                        className="btn-action"
                        onClick={() => {
                          const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
                          if (!favs.find(f => f.SHOW_ID === show.SHOW_ID)) {
                            favs.push(show);
                            localStorage.setItem('favorites', JSON.stringify(favs));
                          }
                        }}
                      >
                        Favorite
                      </Button>
                    )}
                    {user?.role === 'owner' && (
                      <>
                        <Button 
                          variant="outline-secondary" 
                          className="btn-action"
                          onClick={() => handleEdit(show.SHOW_ID)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="outline-danger"
                          onClick={() => handleDeleteConfirmation(show)}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {sorted.length > pageSize && (
        <div className="d-flex justify-content-center mt-3">
          <Pagination>
            <Pagination.First disabled={currentPage === 1} onClick={() => setCurrentPage(1)} />
            <Pagination.Prev disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} />
            <Pagination.Item active>{currentPage}</Pagination.Item>
            <Pagination.Next disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} />
            <Pagination.Last disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)} />
          </Pagination>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the show "{showToDelete?.TITLE}"? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ShowList;