import React, { useState } from 'react';
import { Form, Button, Card, Container, Row, Col, Alert, InputGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const UserRegister = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    preferences: {
      budget: '',
      location: '',
      propertyType: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { saveSession } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('preferences.')) {
      const prefKey = name.split('.')[1];
      setFormData({
        ...formData,
        preferences: {
          ...formData.preferences,
          [prefKey]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
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

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        preferences: formData.preferences,
        role: 'user'
      });
      
      const { token, user } = response.data;
      saveSession(token, user);
      navigate('/user-dashboard');
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
            <Card.Header className="text-center bg-info text-white">
              <h3 className="mb-0">
                <i className="fas fa-user-plus me-2"></i>
                User Registration
              </h3>
              <p className="mb-0 mt-2 opacity-75">Join us to find your perfect home</p>
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
                        placeholder="Enter your email"
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
                      <Form.Label className="fw-bold">Budget Range</Form.Label>
                      <Form.Select
                        name="preferences.budget"
                        value={formData.preferences.budget}
                        onChange={handleChange}
                        className="form-control-lg"
                      >
                        <option value="">Select budget range</option>
                        <option value="under-1000">Under $1,000</option>
                        <option value="1000-2000">$1,000 - $2,000</option>
                        <option value="2000-3000">$2,000 - $3,000</option>
                        <option value="3000-4000">$3,000 - $4,000</option>
                        <option value="4000-plus">$4,000+</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Preferred Location</Form.Label>
                      <Form.Control
                        type="text"
                        name="preferences.location"
                        value={formData.preferences.location}
                        onChange={handleChange}
                        placeholder="City or area preference"
                        className="form-control-lg"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Property Type</Form.Label>
                      <Form.Select
                        name="preferences.propertyType"
                        value={formData.preferences.propertyType}
                        onChange={handleChange}
                        className="form-control-lg"
                      >
                        <option value="">Select property type</option>
                        <option value="apartment">Apartment</option>
                        <option value="house">House</option>
                        <option value="studio">Studio</option>
                        <option value="pg">PG (Paying Guest)</option>
                        <option value="any">Any</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Password *</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="Enter your password"
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
                    Password must be at least 6 characters long
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
                  variant="info"
                  size="lg"
                  className="w-100 mb-3"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-user-plus me-2"></i>
                      Create User Account
                    </>
                  )}
                </Button>
              </Form>

              <div className="auth-links text-center">
                <p className="mb-2">
                  Already have an account? 
                  <Link to="/user-login" className="ms-1 fw-bold text-info">
                    Sign In Here
                  </Link>
                </p>
                <hr className="my-3" />
                <div className="d-flex justify-content-center gap-3">
                  <Link to="/owner-register" className="text-warning">
                    <i className="fas fa-home me-1"></i>
                    Register as Owner
                  </Link>
                  <Link to="/admin-register" className="text-danger">
                    <i className="fas fa-cog me-1"></i>
                    Register as Admin
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

export default UserRegister;
