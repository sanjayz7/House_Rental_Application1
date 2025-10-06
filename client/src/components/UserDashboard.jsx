import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Table, Alert, Badge, Form } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api, { purchaseAPI } from '../api';

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [recentListings, setRecentListings] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [purchaseStats, setPurchaseStats] = useState({ total: 0, completed: 0, pending: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'info' });
  const [searchFilters, setSearchFilters] = useState({
    location: '',
    budget: '',
    propertyType: ''
  });

  // Statistics state
  const [stats, setStats] = useState({
    totalFavorites: 0,
    totalBookings: 0,
    savedSearches: 0,
    viewedProperties: 0
  });

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      // Load user's favorites, bookings, recent listings, and purchases
      const [favoritesRes, bookingsRes, listingsRes, purchasesRes, purchaseStatsRes] = await Promise.all([
        api.get('/favorites').catch(() => ({ data: [] })),
        api.get('/bookings').catch(() => ({ data: [] })),
        api.get('/listings?limit=6'),
        purchaseAPI.getUserPurchases().catch(() => ({ data: [] })),
        purchaseAPI.getPurchaseStats().catch(() => ({ data: { total: 0, completed: 0, pending: 0, cancelled: 0 } }))
      ]);

      setFavorites(favoritesRes.data || []);
      setBookings(bookingsRes.data || []);
      setRecentListings(listingsRes.data || []);
      setPurchases(purchasesRes.data || []);
      setPurchaseStats(purchaseStatsRes.data || { total: 0, completed: 0, pending: 0, cancelled: 0 });
      
      // Calculate statistics
      setStats({
        totalFavorites: favoritesRes.data?.length || 0,
        totalBookings: bookingsRes.data?.length || 0,
        savedSearches: 0, // Mock data - would come from saved searches
        viewedProperties: 0 // Mock data - would come from view history
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showAlert('Error loading dashboard data', 'danger');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (user && user.role === 'user') {
      loadDashboardData();
    } else {
      navigate('/user-login');
    }
  }, [user, navigate, loadDashboardData]);

  const showAlert = (message, type = 'info') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: 'info' }), 5000);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearch = () => {
    const queryParams = new URLSearchParams();
    if (searchFilters.location) queryParams.append('location', searchFilters.location);
    if (searchFilters.budget) queryParams.append('budget', searchFilters.budget);
    if (searchFilters.propertyType) queryParams.append('type', searchFilters.propertyType);
    
    navigate(`/listings?${queryParams.toString()}`);
  };

  const removeFavorite = async (listingId) => {
    try {
      await api.delete(`/favorites/${listingId}`);
      setFavorites(favorites.filter(fav => fav.listingId !== listingId));
      showAlert('Removed from favorites', 'success');
    } catch (error) {
      console.error('Error removing favorite:', error);
      showAlert('Error removing favorite', 'danger');
    }
  };

  const renderFavoritesTable = () => {
    if (favorites.length === 0) {
      return (
        <tr>
          <td colSpan="5" className="text-center py-4">
            <div className="text-muted">
              <i className="fas fa-heart fa-3x mb-3 d-block"></i>
              <p>No favorite properties yet</p>
              <Button 
                variant="info" 
                onClick={() => navigate('/listings')}
              >
                <i className="fas fa-search me-2"></i>
                Browse Properties
              </Button>
            </div>
          </td>
        </tr>
      );
    }

    return favorites.map(favorite => (
      <tr key={favorite.id}>
        <td>#{favorite.listingId}</td>
        <td>
          <div>
            <strong>{favorite.title}</strong>
            <br />
            <small className="text-muted">{favorite.address}</small>
          </div>
        </td>
        <td>${favorite.rent?.toLocaleString() || favorite.price?.toLocaleString() || 'N/A'}</td>
        <td>
          <Badge bg={favorite.verified ? 'success' : 'warning'}>
            {favorite.verified ? 'Verified' : 'Pending'}
          </Badge>
        </td>
        <td>
          <Button 
            variant="outline-primary" 
            size="sm"
            onClick={() => navigate(`/show/${favorite.listingId}`)}
            className="me-2"
          >
            <i className="fas fa-eye me-1"></i>View
          </Button>
          <Button 
            variant="outline-danger" 
            size="sm"
            onClick={() => removeFavorite(favorite.listingId)}
          >
            <i className="fas fa-heart-broken me-1"></i>Remove
          </Button>
        </td>
      </tr>
    ));
  };

  const renderBookingsTable = () => {
    if (bookings.length === 0) {
      return (
        <tr>
          <td colSpan="4" className="text-center py-4">
            <div className="text-muted">
              <i className="fas fa-calendar-check fa-3x mb-3 d-block"></i>
              <p>No bookings yet</p>
            </div>
          </td>
        </tr>
      );
    }

    return bookings.map(booking => (
      <tr key={booking.id}>
        <td>#{booking.id}</td>
        <td>Listing #{booking.listingId}</td>
        <td>${booking.amount?.toLocaleString() || '0'}</td>
        <td>
          <Badge bg={booking.status === 'confirmed' ? 'success' : 'warning'}>
            {booking.status}
          </Badge>
        </td>
      </tr>
    ));
  };

  const renderRecentListings = () => {
    return recentListings.slice(0, 3).map(listing => (
      <Col md={4} key={listing.id} className="mb-3">
        <Card className="h-100 property-card">
          <div className="property-image-container">
            <img 
              src={listing.image_url || '/placeholder-property.jpg'} 
              alt={listing.title}
              className="property-image"
            />
            <div className="property-overlay">
              <Button 
                variant="outline-light" 
                size="sm"
                className="heart-btn"
                onClick={() => navigate(`/show/${listing.id}`)}
              >
                <i className="fas fa-eye"></i>
              </Button>
            </div>
          </div>
          <Card.Body>
            <h6 className="property-title">{listing.title}</h6>
            <p className="property-location">{listing.address}</p>
            <div className="property-price">
              <strong>${listing.rent?.toLocaleString() || listing.price?.toLocaleString() || 'N/A'}</strong>
              <small>/month</small>
            </div>
          </Card.Body>
        </Card>
      </Col>
    ));
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="text-center">
          <div className="loading-container">
            <div className="spinner-border text-info mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <p className="mt-3 text-white fw-bold">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-dashboard">
      {/* Alert */}
      {alert.show && (
        <Alert 
          variant={alert.type} 
          dismissible 
          onClose={() => setAlert({ show: false, message: '', type: 'info' })}
          className="position-fixed"
          style={{ top: '20px', right: '20px', zIndex: 9999, minWidth: '300px' }}
        >
          {alert.message}
        </Alert>
      )}

      {/* Header */}
      <div className="user-header bg-info text-white py-4 mb-4">
        <Container>
          <Row className="align-items-center">
            <Col md={8}>
              <h1 className="mb-0">
                <i className="fas fa-user me-3"></i>User Dashboard
              </h1>
              <p className="mb-0 opacity-75">Welcome back, {user?.name || 'User'}!</p>
            </Col>
            <Col md={4} className="text-end">
              <Button 
                variant="light" 
                className="me-2"
                onClick={() => navigate('/listings')}
              >
                <i className="fas fa-search me-2"></i>Browse Properties
              </Button>
              <Button 
                variant="outline-light"
                onClick={handleLogout}
              >
                <i className="fas fa-sign-out-alt me-2"></i>Logout
              </Button>
            </Col>
          </Row>
        </Container>
      </div>

      <Container>
        {/* Statistics Cards */}
        <Row className="mb-4">
          <Col lg={3} md={6} className="mb-3">
            <Card className="stats-card h-100">
              <Card.Body className="text-center">
                <div className="stats-icon text-info mb-2">
                  <i className="fas fa-heart"></i>
                </div>
                <h3 className="text-info">{stats.totalFavorites}</h3>
                <p className="mb-1">Favorite Properties</p>
                <small className="text-muted">Saved for later</small>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <Card className="stats-card h-100">
              <Card.Body className="text-center">
                <div className="stats-icon text-success mb-2">
                  <i className="fas fa-calendar-check"></i>
                </div>
                <h3 className="text-success">{stats.totalBookings}</h3>
                <p className="mb-1">Total Bookings</p>
                <small className="text-muted">Properties booked</small>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <Card className="stats-card h-100">
              <Card.Body className="text-center">
                <div className="stats-icon text-warning mb-2">
                  <i className="fas fa-search"></i>
                </div>
                <h3 className="text-warning">{stats.savedSearches}</h3>
                <p className="mb-1">Saved Searches</p>
                <small className="text-muted">Search alerts</small>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <Card className="stats-card h-100">
              <Card.Body className="text-center">
                <div className="stats-icon text-success mb-2">
                  <i className="fas fa-home"></i>
                </div>
                <h3 className="text-success">{purchaseStats.completed}</h3>
                <p className="mb-1">Properties Purchased</p>
                <small className="text-muted">Free purchases</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Quick Search */}
        <Card className="mb-4">
          <Card.Header className="bg-light">
            <h5 className="mb-0"><i className="fas fa-search me-2"></i>Quick Search</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Location</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter city or area"
                    value={searchFilters.location}
                    onChange={(e) => setSearchFilters({...searchFilters, location: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Budget Range</Form.Label>
                  <Form.Select
                    value={searchFilters.budget}
                    onChange={(e) => setSearchFilters({...searchFilters, budget: e.target.value})}
                  >
                    <option value="">Select budget</option>
                    <option value="under-1000">Under $1,000</option>
                    <option value="1000-2000">$1,000 - $2,000</option>
                    <option value="2000-3000">$2,000 - $3,000</option>
                    <option value="3000-4000">$3,000 - $4,000</option>
                    <option value="4000-plus">$4,000+</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Property Type</Form.Label>
                  <Form.Select
                    value={searchFilters.propertyType}
                    onChange={(e) => setSearchFilters({...searchFilters, propertyType: e.target.value})}
                  >
                    <option value="">Select type</option>
                    <option value="apartment">Apartment</option>
                    <option value="house">House</option>
                    <option value="studio">Studio</option>
                    <option value="pg">PG</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <div className="text-center">
              <Button variant="info" onClick={handleSearch}>
                <i className="fas fa-search me-2"></i>Search Properties
              </Button>
            </div>
          </Card.Body>
        </Card>

        {/* My Favorites */}
        <Card className="table-container mb-4">
          <Card.Header className="d-flex justify-content-between align-items-center bg-info text-white">
            <h5 className="mb-0"><i className="fas fa-heart me-2"></i>My Favorite Properties</h5>
            <Button 
              variant="light" 
              size="sm"
              onClick={() => navigate('/favorites')}
            >
              <i className="fas fa-external-link-alt me-1"></i>View All
            </Button>
          </Card.Header>
          <Card.Body>
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Property Details</th>
                    <th>Rent</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {renderFavoritesTable()}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>

        {/* Recent Bookings */}
        <Card className="table-container mb-4">
          <Card.Header className="bg-success text-white">
            <h5 className="mb-0"><i className="fas fa-calendar-check me-2"></i>Recent Bookings</h5>
          </Card.Header>
          <Card.Body>
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Property</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {renderBookingsTable()}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>

        {/* Purchase History */}
        <Card className="table-container mb-4">
          <Card.Header className="d-flex justify-content-between align-items-center bg-success text-white">
            <h5 className="mb-0"><i className="fas fa-shopping-cart me-2"></i>My Purchases</h5>
            <Badge bg="light" text="dark" className="fs-6">
              {purchases.length} Properties
            </Badge>
          </Card.Header>
          <Card.Body>
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Purchase ID</th>
                    <th>Property Details</th>
                    <th>Seller</th>
                    <th>Purchase Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4">
                        <div className="text-muted">
                          <i className="fas fa-shopping-cart fa-3x mb-3 d-block"></i>
                          <p>No purchases yet</p>
                          <Button variant="success" onClick={() => navigate('/listings')}>
                            <i className="fas fa-search me-2"></i>Browse Properties
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    purchases.map(purchase => (
                      <tr key={purchase.purchaseId}>
                        <td>#{purchase.purchaseId}</td>
                        <td>
                          <div>
                            <strong>{purchase.property.title}</strong>
                            <br />
                            <small className="text-muted">{purchase.property.address}</small>
                            <br />
                            <small className="text-muted">
                              {purchase.property.bedrooms} bed • {purchase.property.bathrooms} bath • {purchase.property.areaSqft} sqft
                            </small>
                          </div>
                        </td>
                        <td>
                          <div>
                            <strong>{purchase.seller.name}</strong>
                            <br />
                            <small className="text-muted">{purchase.seller.email}</small>
                          </div>
                        </td>
                        <td>
                          {new Date(purchase.purchaseDate).toLocaleDateString()}
                        </td>
                        <td>
                          <Badge bg={purchase.status === 'completed' ? 'success' : purchase.status === 'pending' ? 'warning' : 'danger'}>
                            {purchase.status}
                          </Badge>
                        </td>
                        <td>
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={() => navigate(`/show/${purchase.property.listingId}`)}
                          >
                            <i className="fas fa-eye me-1"></i>View
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>

        {/* Recent Properties */}
        <Card>
          <Card.Header className="bg-primary text-white">
            <h5 className="mb-0"><i className="fas fa-home me-2"></i>Recent Properties</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              {recentListings.length === 0 ? (
                <Col md={12} className="text-center py-4">
                  <div className="text-muted">
                    <i className="fas fa-home fa-3x mb-3 d-block"></i>
                    <p>No recent properties to show</p>
                    <Button variant="primary" onClick={() => navigate('/listings')}>
                      <i className="fas fa-search me-2"></i>Browse Properties
                    </Button>
                  </div>
                </Col>
              ) : (
                renderRecentListings()
              )}
            </Row>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default UserDashboard;
