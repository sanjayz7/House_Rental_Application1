import React, { useState } from 'react';
import { Form, Button, Card, Container, Row, Col, Alert, InputGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const AdminRegister = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    department: '',
    adminCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { saveSession } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Admin password must be at least 8 characters long');
      return;
    }

    if (!formData.adminCode) {
      setError('Admin code is required for registration');
      return;
    }

    if (formData.adminCode !== 'ADMIN2024') {
      setError('Invalid admin code');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        department: formData.department,
        role: 'admin'
      });
      
      const { token, user } = response.data;
      saveSession(token, user);
      navigate('/admin-dashboard');
    } catch (err) {
      console.error('Registration error details:', err);
      
      if (err.code === 'ERR_NETWORK') {
        setError('Network error: Cannot connect to server. Please check if server is running.');
      } else if (err.response) {
        setError(`Server error: ${err.response.data?.message || 'Registration failed'}`);
      } else if (err.request) {
        setError('No response from server. Please check server connection.');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="mt-5 auth-card shadow-lg">
            <Card.Header className="text-center bg-danger text-white">
              <h3 className="mb-0">
                <i className="fas fa-user-shield me-2"></i>
                Admin Registration
              </h3>
              <p className="mb-0 mt-2 opacity-75">Register as system administrator</p>
            </Card.Header>
            <Card.Body className="p-4">
              {error && <Alert variant="danger">{error}</Alert>}
              
              <Form onSubmit={handleSubmit} className="auth-form">
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Full Name *</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Enter your full name"
                        className="form-control-lg"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Email Address *</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="Enter admin email"
                        className="form-control-lg"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Phone Number</Form.Label>
                      <Form.Control
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+1 555 555 5555"
                        className="form-control-lg"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Department</Form.Label>
                      <Form.Select
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        className="form-control-lg"
                      >
                        <option value="">Select department</option>
                        <option value="IT">Information Technology</option>
                        <option value="Operations">Operations</option>
                        <option value="Customer Service">Customer Service</option>
                        <option value="Management">Management</option>
                        <option value="Other">Other</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Admin Code *</Form.Label>
                  <Form.Control
                    type="text"
                    name="adminCode"
                    value={formData.adminCode}
                    onChange={handleChange}
                    required
                    placeholder="Enter admin registration code"
                    className="form-control-lg"
                  />
                  <Form.Text className="text-muted">
                    Contact system administrator for the admin code
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Password *</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="Enter secure password"
                      className="form-control-lg"
                    />
                    <Button
                      variant="outline-secondary"
                      type="button"
                      onClick={() => togglePasswordVisibility('password')}
                      className="password-toggle-btn"
                      style={{ borderLeft: 'none' }}
                    >
                      {showPassword ? (
                        <i className="fas fa-eye-slash"></i>
                      ) : (
                        <i className="fas fa-eye"></i>
                      )}
                    </Button>
                  </InputGroup>
                  <Form.Text className="text-muted">
                    Admin password must be at least 8 characters long
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">Confirm Password *</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      placeholder="Confirm your password"
                      className="form-control-lg"
                    />
                    <Button
                      variant="outline-secondary"
                      type="button"
                      onClick={() => togglePasswordVisibility('confirmPassword')}
                      className="password-toggle-btn"
                      style={{ borderLeft: 'none' }}
                    >
                      {showConfirmPassword ? (
                        <i className="fas fa-eye-slash"></i>
                      ) : (
                        <i className="fas fa-eye"></i>
                      )}
                    </Button>
                  </InputGroup>
                </Form.Group>

                <Button
                  type="submit"
                  variant="danger"
                  size="lg"
                  className="w-100 mb-3"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Creating Admin Account...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-user-shield me-2"></i>
                      Create Admin Account
                    </>
                  )}
                </Button>
              </Form>

              <div className="auth-links text-center">
                <p className="mb-2">
                  Already have an admin account? 
                  <Link to="/admin-login" className="ms-1 fw-bold text-danger">
                    Sign In Here
                  </Link>
                </p>
                <hr className="my-3" />
                <div className="d-flex justify-content-center gap-3">
                  <Link to="/user-register" className="text-info">
                    <i className="fas fa-user me-1"></i>
                    Register as User
                  </Link>
                  <Link to="/owner-register" className="text-warning">
                    <i className="fas fa-home me-1"></i>
                    Register as Owner
                  </Link>
                </div>
                <p className="mb-0 mt-2">
                  <Link to="/login" className="text-muted">
                    <i className="fas fa-arrow-left me-1"></i>
                    Back to General Login
                  </Link>
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminRegister;
