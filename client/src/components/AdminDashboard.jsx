import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Alert, Dropdown } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [exportType, setExportType] = useState('listings');
  const [exportFormat, setExportFormat] = useState('csv');
  const [useSampleExport, setUseSampleExport] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [alert, setAlert] = useState({ show: false, message: '', type: 'info' });

  // Statistics state
  const [stats, setStats] = useState({
    totalListings: 0,
    verifiedListings: 0,
    totalUsers: 0,
    activeUsers: 0,
    owners: 0,
    totalBookings: 0,
    withImages: 0,
    withLocation: 0
  });

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadDashboardData();
    } else {
      navigate('/admin-login');
    }
  }, [user, navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Load all data in parallel
      const [listingsRes, bookingsRes, usersRes, statsRes] = await Promise.all([
        api.get('/listings'),
        api.get('/admin/bookings'),
        api.get('/admin/users'),
        api.get('/admin/stats')
      ]);

      setListings(listingsRes.data || []);
      setBookings(bookingsRes.data || []);
      setUsers(usersRes.data || []);
      
      // Set statistics from API
      if (statsRes.data) {
        setStats(statsRes.data);
      } else {
        // Fallback to calculating from data
        calculateStats(listingsRes.data || [], bookingsRes.data || [], usersRes.data || []);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showAlert('Error loading dashboard data', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (listingsData, bookingsData, usersData) => {
    const verifiedListings = listingsData.filter(l => l.verified).length;
    const activeUsers = usersData.filter(u => u.role === 'user').length;
    const owners = usersData.filter(u => u.role === 'owner').length;
    const withImages = Math.floor(listingsData.length * 0.8); // Mock calculation
    const withLocation = Math.floor(listingsData.length * 0.6); // Mock calculation

    setStats({
      totalListings: listingsData.length,
      verifiedListings,
      totalUsers: usersData.length,
      activeUsers,
      owners,
      totalBookings: bookingsData.length,
      withImages,
      withLocation
    });
  };

  const showAlert = (message, type = 'info') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: 'info' }), 5000);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Render functions
  const renderBookingsTable = () => {
    if (bookings.length === 0) {
      return (
        <tr>
          <td colSpan="7" className="text-center">No bookings found</td>
        </tr>
      );
    }

    return bookings.map(booking => (
      <tr key={booking.id}>
        <td>#{booking.id}</td>
        <td>{booking.userEmail}</td>
        <td>Listing #{booking.listingId}</td>
        <td><span className="badge bg-success">$0.00</span></td>
        <td>{booking.date}</td>
        <td>
          <span className={`badge bg-${booking.status === 'confirmed' ? 'success' : 'warning'}`}>
            {booking.status}
          </span>
        </td>
        <td>
          <Button 
            variant="outline-info" 
            size="sm"
            onClick={() => viewBookingDetails(booking.id)}
          >
            <i className="fas fa-eye"></i>
          </Button>
        </td>
      </tr>
    ));
  };

  const renderListingsTable = () => {
    if (listings.length === 0) {
      return (
        <tr>
          <td colSpan="7" className="text-center">No listings found</td>
        </tr>
      );
    }

    return listings.map(listing => (
      <tr key={listing.id}>
        <td>#{listing.id}</td>
        <td>{listing.title}</td>
        <td>{listing.address}</td>
        <td>{listing.rent?.toLocaleString()}</td>
        <td>{listing.ownerEmail}</td>
        <td>
          <span className={`badge bg-${listing.verified ? 'success' : 'warning'}`}>
            {listing.verified ? 'Verified' : 'Pending'}
          </span>
        </td>
        <td>
          <Dropdown>
            <Dropdown.Toggle variant="outline-secondary" size="sm">
              Actions
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => createZeroBooking(listing.id)}>
                <i className="fas fa-plus me-2"></i>Zero-Fee Booking
              </Dropdown.Item>
              <Dropdown.Item onClick={() => viewListing(listing.id)}>
                <i className="fas fa-eye me-2"></i>View Details
              </Dropdown.Item>
              <Dropdown.Item onClick={() => editListing(listing.id)}>
                <i className="fas fa-edit me-2"></i>Edit
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item 
                className="text-danger" 
                onClick={() => deleteListing(listing.id)}
              >
                <i className="fas fa-trash me-2"></i>Delete
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </td>
      </tr>
    ));
  };

  const renderRecentActivity = () => {
    const activities = [
      'New listing added by admin',
      'Zero-fee booking created',
      'Listing verified by admin',
      'Bulk email sent to users',
      'New user registration'
    ];

    return activities.map((activity, index) => (
      <div key={index} className="activity-item">
        <small className="text-muted">
          {new Date(Date.now() - index * 3600000).toLocaleString()}
        </small>
        <p className="mb-1">{activity}</p>
      </div>
    ));
  };

  // Action functions
  const createZeroFeeBooking = async () => {
    try {
      const newBooking = {
        listingId: listings[0]?.id || 1,
        userEmail: user?.email || 'admin@example.com',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        status: 'confirmed'
      };

      await api.post('/admin/bookings', newBooking);
      showAlert('Zero-fee booking created successfully!', 'success');
      loadDashboardData();
    } catch (error) {
      console.error('Error creating booking:', error);
      showAlert('Error creating booking', 'danger');
    }
  };

  const createZeroBooking = async (listingId) => {
    try {
      const newBooking = {
        listingId: listingId,
        userEmail: user?.email || 'admin@example.com',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        status: 'confirmed'
      };

      await api.post('/admin/bookings', newBooking);
      showAlert(`Zero-fee booking created for listing #${listingId}!`, 'success');
      loadDashboardData();
    } catch (error) {
      console.error('Error creating booking:', error);
      showAlert('Error creating booking', 'danger');
    }
  };

  const verifyAllListings = async () => {
    try {
      const unverifiedListings = listings.filter(l => !l.verified);
      await Promise.all(
        unverifiedListings.map(listing => 
          api.put(`/listings/${listing.id}`, { verified: true })
        )
      );
      showAlert('All listings have been verified!', 'success');
      loadDashboardData();
    } catch (error) {
      console.error('Error verifying listings:', error);
      showAlert('Error verifying listings', 'danger');
    }
  };

  const sendWelcomeEmails = async () => {
    try {
      const response = await api.post('/admin/send-welcome-emails');
      showAlert(`Welcome emails sent to ${response.data.recipients || users.length} users!`, 'info');
    } catch (error) {
      console.error('Error sending emails:', error);
      showAlert('Error sending emails', 'danger');
    }
  };

  const viewBookingDetails = (bookingId) => {
    showAlert(`Viewing details for booking #${bookingId}`, 'info');
  };

  const viewListing = (listingId) => {
    showAlert(`Viewing listing #${listingId}`, 'info');
  };

  const editListing = (listingId) => {
    showAlert(`Editing listing #${listingId}`, 'info');
  };

  const deleteListing = async (listingId) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        await api.delete(`/listings/${listingId}`);
        showAlert('Listing deleted successfully!', 'warning');
        loadDashboardData();
      } catch (error) {
        console.error('Error deleting listing:', error);
        showAlert('Error deleting listing', 'danger');
      }
    }
  };

  const refreshListings = () => {
    loadDashboardData();
    showAlert('Listings refreshed!', 'info');
  };

  // Export functionality
  const performExport = () => {
    exportData(exportType, exportFormat, useSampleExport);
    setShowExportModal(false);
  };

  const exportData = async (type, format, mock = false) => {
    try {
      let data = [];
      let filename = '';
      const mockQuery = mock ? '?mock=1' : '';

      // Fetch data from API for export
      let response;
      switch (type) {
        case 'listings':
          response = await api.get(`/admin/export/listings${mockQuery}`);
          data = response.data;
          filename = 'listings_report';
          break;
        case 'bookings':
          response = await api.get(`/admin/export/bookings${mockQuery}`);
          data = response.data;
          filename = 'bookings_report';
          break;
        case 'users':
          response = await api.get(`/admin/export/users${mockQuery}`);
          data = response.data;
          filename = 'users_report';
          break;
      }

      if (format === 'csv') {
        downloadCSV(convertToCSV(data), `${filename}.csv`);
      } else if (format === 'json') {
        downloadJSON(data, `${filename}.json`);
      }

      showAlert(`${type} report exported successfully!`, 'success');
    } catch (error) {
      console.error('Error exporting data:', error);
      showAlert('Error exporting data', 'danger');
    }
  };

  const convertToCSV = (data) => {
    if (!data.length) return '';
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(',')
    );
    return [csvHeaders, ...csvRows].join('\n');
  };

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    downloadFile(blob, filename);
  };

  const downloadJSON = (data, filename) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    downloadFile(blob, filename);
  };

  const downloadFile = (blob, filename) => {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Email functionality
  const sendBulkEmail = async () => {
    if (!emailSubject || !emailBody) {
      showAlert('Please fill in both subject and message fields', 'warning');
      return;
    }

    try {
      const response = await api.post('/admin/send-bulk-email', {
        subject: emailSubject,
        body: emailBody
      });
      showAlert(`Bulk email sent successfully to ${response.data.recipients || users.length} users!`, 'success');
      setShowEmailModal(false);
      setEmailSubject('');
      setEmailBody('');
    } catch (error) {
      console.error('Error sending bulk email:', error);
      showAlert('Error sending bulk email', 'danger');
    }
  };

  return (
    <div className="admin-dashboard">
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
      <div className="admin-header">
        <Container>
          <Row className="align-items-center">
            <Col md={8}>
              <h1 className="mb-0">
                <i className="fas fa-chart-line me-3"></i>Admin Dashboard
              </h1>
              <p className="mb-0 opacity-75">Manage listings, users, and monitor platform activity</p>
            </Col>
            <Col md={4} className="text-end">
              <Button 
                variant="outline-primary" 
                className="me-2"
                onClick={() => setShowExportModal(true)}
              >
                <i className="fas fa-download me-2"></i>Export Reports
              </Button>
              <Button 
                variant="outline-info"
                className="me-2"
                onClick={() => setShowEmailModal(true)}
              >
                <i className="fas fa-envelope me-2"></i>Bulk Email
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
            <Card className="stats-card">
              <Card.Body className="text-center">
                <div className="stats-icon text-primary mb-2">
                  <i className="fas fa-home"></i>
                </div>
                <h3 className="text-primary">{stats.totalListings}</h3>
                <p className="mb-1">Total Listings</p>
                <small className="text-muted">{stats.verifiedListings} verified</small>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <Card className="stats-card">
              <Card.Body className="text-center">
                <div className="stats-icon text-success mb-2">
                  <i className="fas fa-users"></i>
                </div>
                <h3 className="text-success">{stats.totalUsers}</h3>
                <p className="mb-1">Total Users</p>
                <small className="text-muted">{stats.activeUsers} active, {stats.owners} owners</small>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <Card className="stats-card">
              <Card.Body className="text-center">
                <div className="stats-icon text-info mb-2">
                  <i className="fas fa-calendar-check"></i>
                </div>
                <h3 className="text-info">{stats.totalBookings}</h3>
                <p className="mb-1">Zero-Fee Bookings</p>
                <small className="zero-fee-badge">$0 Platform Fee</small>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <Card className="stats-card">
              <Card.Body className="text-center">
                <div className="stats-icon text-warning mb-2">
                  <i className="fas fa-images"></i>
                </div>
                <h3 className="text-warning">{stats.withImages}</h3>
                <p className="mb-1">With Images</p>
                <small className="text-muted">{stats.withLocation} with GPS location</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Quick Actions */}
        <Row className="mb-4">
          <Col md={6}>
            <Card>
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0"><i className="fas fa-bolt me-2"></i>Quick Actions</h5>
              </Card.Header>
              <Card.Body>
                <div className="d-grid gap-2">
                  <Button 
                    variant="outline-success" 
                    onClick={createZeroFeeBooking}
                    disabled={loading}
                  >
                    <i className="fas fa-plus me-2"></i>Create Zero-Fee Booking
                  </Button>
                  <Button 
                    variant="outline-info" 
                    onClick={verifyAllListings}
                    disabled={loading}
                  >
                    <i className="fas fa-check-circle me-2"></i>Verify All Pending Listings
                  </Button>
                  <Button 
                    variant="outline-warning" 
                    onClick={sendWelcomeEmails}
                    disabled={loading}
                  >
                    <i className="fas fa-paper-plane me-2"></i>Send Welcome Emails
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card>
              <Card.Header className="bg-info text-white">
                <h5 className="mb-0"><i className="fas fa-clock me-2"></i>Recent Activity</h5>
              </Card.Header>
              <Card.Body className="recent-activity">
                <div className="activity-item">
                  {loading ? 'Loading recent activities...' : renderRecentActivity()}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Recent Bookings */}
        <Card className="table-container mb-4">
          <Card.Header className="d-flex justify-content-between align-items-center bg-success text-white">
            <h5 className="mb-0"><i className="fas fa-ticket-alt me-2"></i>Recent Zero-Fee Bookings</h5>
            <span className="badge bg-light text-dark">All bookings are fee-free!</span>
          </Card.Header>
          <Card.Body>
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>User Email</th>
                    <th>Listing</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="text-center">Loading bookings...</td>
                    </tr>
                  ) : (
                    renderBookingsTable()
                  )}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>

        {/* All Listings Management */}
        <Card className="table-container">
          <Card.Header className="d-flex justify-content-between align-items-center bg-primary text-white">
            <h5 className="mb-0"><i className="fas fa-list me-2"></i>All Listings</h5>
            <div>
              <Button 
                variant="light" 
                size="sm" 
                className="me-2"
                onClick={() => exportData('listings', 'csv')}
              >
                <i className="fas fa-file-csv me-1"></i>Export CSV
              </Button>
              <Button 
                variant="outline-light" 
                size="sm"
                onClick={refreshListings}
              >
                <i className="fas fa-refresh me-1"></i>Refresh
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Address</th>
                    <th>Rent</th>
                    <th>Owner Email</th>
                    <th>Verified</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="text-center">Loading listings...</td>
                    </tr>
                  ) : (
                    renderListingsTable()
                  )}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      </Container>

      {/* Export Modal */}
      <Modal show={showExportModal} onHide={() => setShowExportModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title><i className="fas fa-download me-2"></i>Export Reports</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Report Type</Form.Label>
            <Form.Select 
              value={exportType} 
              onChange={(e) => setExportType(e.target.value)}
            >
              <option value="listings">Listings Report</option>
              <option value="bookings">Bookings Report</option>
              <option value="users">Users Report</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Export Format</Form.Label>
            <Form.Select 
              value={exportFormat} 
              onChange={(e) => setExportFormat(e.target.value)}
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Check
              type="switch"
              id="use-sample-export"
              label="Use sample data (dummy export)"
              checked={useSampleExport}
              onChange={(e) => setUseSampleExport(e.target.checked)}
            />
            <Form.Text className="text-muted">
              Enable to download generated sample rows without touching live data.
            </Form.Text>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Date Range (Optional)</Form.Label>
            <Row>
              <Col>
                <Form.Control type="date" placeholder="Start Date" />
              </Col>
              <Col>
                <Form.Control type="date" placeholder="End Date" />
              </Col>
            </Row>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowExportModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={performExport}>
            Export Report
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Email Modal */}
      <Modal show={showEmailModal} onHide={() => setShowEmailModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title><i className="fas fa-envelope me-2"></i>Send Bulk Email</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Recipients</Form.Label>
            <Form.Control 
              type="text" 
              readOnly 
              value="All registered users will receive this email"
            />
            <Form.Text className="text-muted">
              Email will be sent to all user email addresses in the system
            </Form.Text>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Subject</Form.Label>
            <Form.Control 
              type="text" 
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="Enter email subject"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Message</Form.Label>
            <Form.Control 
              as="textarea" 
              rows={8}
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              placeholder="Enter your message here..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEmailModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={sendBulkEmail}>
            Send Email
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminDashboard;