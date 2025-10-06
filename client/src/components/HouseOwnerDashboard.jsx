import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Alert, Dropdown, Badge } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api, { purchaseAPI } from '../api';

const HouseOwnerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [sales, setSales] = useState([]);
  const [salesStats, setSalesStats] = useState({ total: 0, completed: 0, pending: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'info' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [listingToDelete, setListingToDelete] = useState(null);

  // Statistics state
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    totalBookings: 0,
    pendingBookings: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    if (user && user.role === 'owner') {
      loadDashboardData();
    } else {
      navigate('/owner-login');
    }
  }, [user, navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Load owner's listings, bookings, and sales
      const [listingsRes, bookingsRes, salesRes, salesStatsRes] = await Promise.all([
        api.get('/listings'),
        api.get('/bookings'),
        purchaseAPI.getSellerSales().catch(() => ({ data: [] })),
        purchaseAPI.getPurchaseStats().catch(() => ({ data: { total: 0, completed: 0, pending: 0, cancelled: 0 } }))
      ]);

      // Filter listings by owner
      const ownerListings = listingsRes.data?.filter(listing => 
        listing.ownerEmail === user?.email
      ) || [];
      
      // Filter bookings for owner's listings
      const ownerBookings = bookingsRes.data?.filter(booking => 
        ownerListings.some(listing => listing.id === booking.listingId)
      ) || [];

      setListings(ownerListings);
      setBookings(ownerBookings);
      setSales(salesRes.data || []);
      setSalesStats(salesStatsRes.data || { total: 0, completed: 0, pending: 0, cancelled: 0 });
      
      // Calculate statistics
      const activeListings = ownerListings.filter(l => l.verified).length;
      const pendingBookings = ownerBookings.filter(b => b.status === 'pending').length;
      const totalRevenue = ownerBookings.reduce((sum, booking) => sum + (booking.amount || 0), 0);

      setStats({
        totalListings: ownerListings.length,
        activeListings,
        totalBookings: ownerBookings.length,
        pendingBookings,
        totalRevenue
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showAlert('Error loading dashboard data', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message, type = 'info') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: 'info' }), 5000);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleDeleteListing = (listingId) => {
    setListingToDelete(listingId);
    setShowDeleteModal(true);
  };

  const confirmDeleteListing = async () => {
    if (!listingToDelete) return;

    try {
      await api.delete(`/listings/${listingToDelete}`);
      showAlert('Listing deleted successfully!', 'success');
      loadDashboardData();
    } catch (error) {
      console.error('Error deleting listing:', error);
      showAlert('Error deleting listing', 'danger');
    } finally {
      setShowDeleteModal(false);
      setListingToDelete(null);
    }
  };

  const renderListingsTable = () => {
    if (listings.length === 0) {
      return (
        <tr>
          <td colSpan="6" className="text-center py-4">
            <div className="text-muted">
              <i className="fas fa-home fa-3x mb-3 d-block"></i>
              <p>No properties listed yet</p>
              <Button 
                variant="primary" 
                onClick={() => navigate('/owner-add-listing')}
              >
                <i className="fas fa-plus me-2"></i>
                Add Your First Property
              </Button>
            </div>
          </td>
        </tr>
      );
    }

    return listings.map(listing => (
      <tr key={listing.id}>
        <td>#{listing.id}</td>
        <td>
          <div>
            <strong>{listing.title}</strong>
            <br />
            <small className="text-muted">{listing.address}</small>
          </div>
        </td>
        <td>${listing.rent?.toLocaleString() || listing.price?.toLocaleString() || 'N/A'}</td>
        <td>
          <Badge bg={listing.verified ? 'success' : 'warning'}>
            {listing.verified ? 'Verified' : 'Pending'}
          </Badge>
        </td>
        <td>{listing.bedrooms || 'N/A'} bed / {listing.bathrooms || 'N/A'} bath</td>
        <td>
          <Dropdown>
            <Dropdown.Toggle variant="outline-secondary" size="sm">
              Actions
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => navigate(`/listings/${listing.id}`)}>
                <i className="fas fa-eye me-2"></i>View Details
              </Dropdown.Item>
              <Dropdown.Item onClick={() => navigate(`/listings/${listing.id}/edit`)}>
                <i className="fas fa-edit me-2"></i>Edit Property
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item 
                className="text-danger" 
                onClick={() => handleDeleteListing(listing.id)}
              >
                <i className="fas fa-trash me-2"></i>Delete
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </td>
      </tr>
    ));
  };

  const renderBookingsTable = () => {
    if (bookings.length === 0) {
      return (
        <tr>
          <td colSpan="5" className="text-center py-4">
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
        <td>{booking.userEmail}</td>
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

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="owner-dashboard">
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
      <div className="owner-header bg-primary text-white py-4 mb-4">
        <Container>
          <Row className="align-items-center">
            <Col md={8}>
              <h1 className="mb-0">
                <i className="fas fa-home me-3"></i>Property Owner Dashboard
              </h1>
              <p className="mb-0 opacity-75">Welcome back, {user?.name || 'Owner'}!</p>
            </Col>
            <Col md={4} className="text-end">
              <Button 
                variant="success" 
                className="me-2"
                onClick={() => navigate('/owner-add-listing')}
              >
                <i className="fas fa-plus me-2"></i>Add New Property
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
                <div className="stats-icon text-primary mb-2">
                  <i className="fas fa-home"></i>
                </div>
                <h3 className="text-primary">{stats.totalListings}</h3>
                <p className="mb-1">Total Properties</p>
                <small className="text-muted">{stats.activeListings} active</small>
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
                <small className="text-muted">{stats.pendingBookings} pending</small>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <Card className="stats-card h-100">
              <Card.Body className="text-center">
                <div className="stats-icon text-info mb-2">
                  <i className="fas fa-dollar-sign"></i>
                </div>
                <h3 className="text-info">${stats.totalRevenue.toLocaleString()}</h3>
                <p className="mb-1">Total Revenue</p>
                <small className="text-muted">From bookings</small>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <Card className="stats-card h-100">
              <Card.Body className="text-center">
                <div className="stats-icon text-warning mb-2">
                  <i className="fas fa-shopping-cart"></i>
                </div>
                <h3 className="text-warning">{salesStats.completed}</h3>
                <p className="mb-1">Properties Sold</p>
                <small className="text-muted">Free purchases</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Quick Actions */}
        <Row className="mb-4">
          <Col md={12}>
            <Card>
              <Card.Header className="bg-success text-white">
                <h5 className="mb-0"><i className="fas fa-bolt me-2"></i>Quick Actions</h5>
              </Card.Header>
              <Card.Body>
                <div className="d-grid gap-2 d-md-flex">
                  <Button 
                    variant="primary" 
                    onClick={() => navigate('/owner-add-listing')}
                    className="me-2"
                  >
                    <i className="fas fa-plus me-2"></i>Add New Property
                  </Button>
                  <Button 
                    variant="outline-primary" 
                    onClick={loadDashboardData}
                    className="me-2"
                  >
                    <i className="fas fa-refresh me-2"></i>Refresh Data
                  </Button>
                  <Button 
                    variant="outline-info" 
                    onClick={() => navigate('/')}
                  >
                    <i className="fas fa-search me-2"></i>Browse All Properties
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* My Properties */}
        <Card className="table-container mb-4">
          <Card.Header className="d-flex justify-content-between align-items-center bg-primary text-white">
            <h5 className="mb-0"><i className="fas fa-list me-2"></i>My Properties</h5>
            <Button 
              variant="light" 
              size="sm"
              onClick={() => navigate('/owner-add-listing')}
            >
              <i className="fas fa-plus me-1"></i>Add Property
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
                    <th>Details</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {renderListingsTable()}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>

        {/* Sales History */}
        <Card className="table-container mb-4">
          <Card.Header className="d-flex justify-content-between align-items-center bg-success text-white">
            <h5 className="mb-0"><i className="fas fa-shopping-cart me-2"></i>Property Sales</h5>
            <Badge bg="light" text="dark" className="fs-6">
              {sales.length} Sales
            </Badge>
          </Card.Header>
          <Card.Body>
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Sale ID</th>
                    <th>Property Details</th>
                    <th>Buyer</th>
                    <th>Sale Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4">
                        <div className="text-muted">
                          <i className="fas fa-shopping-cart fa-3x mb-3 d-block"></i>
                          <p>No sales yet</p>
                          <p className="small">When users purchase your properties for free, they'll appear here</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sales.map(sale => (
                      <tr key={sale.purchaseId}>
                        <td>#{sale.purchaseId}</td>
                        <td>
                          <div>
                            <strong>{sale.property.title}</strong>
                            <br />
                            <small className="text-muted">{sale.property.address}</small>
                            <br />
                            <small className="text-muted">
                              {sale.property.bedrooms} bed • {sale.property.bathrooms} bath • {sale.property.areaSqft} sqft
                            </small>
                          </div>
                        </td>
                        <td>
                          <div>
                            <strong>{sale.buyer.name}</strong>
                            <br />
                            <small className="text-muted">{sale.buyer.email}</small>
                          </div>
                        </td>
                        <td>
                          {new Date(sale.purchaseDate).toLocaleDateString()}
                        </td>
                        <td>
                          <Badge bg={sale.status === 'completed' ? 'success' : sale.status === 'pending' ? 'warning' : 'danger'}>
                            {sale.status}
                          </Badge>
                        </td>
                        <td>
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={() => navigate(`/show/${sale.property.listingId}`)}
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

        {/* Recent Bookings */}
        <Card className="table-container">
          <Card.Header className="bg-success text-white">
            <h5 className="mb-0"><i className="fas fa-calendar-check me-2"></i>Recent Bookings</h5>
          </Card.Header>
          <Card.Body>
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Tenant Email</th>
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
      </Container>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this property listing? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDeleteListing}>
            Delete Property
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default HouseOwnerDashboard;
