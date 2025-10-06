import React, { useState } from 'react';
import { Form, Button, Card, Container, Row, Col, Alert, InputGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const HouseOwnerLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { saveSession } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', formData);
      const { token, user } = response.data;
      
      // Check if user is an owner
      if (user.role !== 'owner') {
        setError('Access denied. This login is for property owners only.');
        setLoading(false);
        return;
      }
      
      saveSession(token, user);
      navigate('/owner-dashboard');
    } catch (err) {
      console.error('Login error details:', err);
      
      if (err.code === 'ERR_NETWORK') {
        setError('Network error: Cannot connect to server. Please check if server is running.');
      } else if (err.response) {
        setError(`Server error: ${err.response.data?.message || 'Login failed'}`);
      } else if (err.request) {
        setError('No response from server. Please check server connection.');
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="mt-5 auth-card shadow-lg">
            <Card.Header className="text-center bg-primary text-white">
              <h3 className="mb-0">
                <i className="fas fa-home me-2"></i>
                Property Owner Login
              </h3>
              <p className="mb-0 mt-2 opacity-75">Manage your rental properties</p>
            </Card.Header>
            <Card.Body className="p-4">
              {error && <Alert variant="danger">{error}</Alert>}
              
              <Form onSubmit={handleSubmit} className="auth-form">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Email Address</Form.Label>
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

                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">Password</Form.Label>
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
                      onClick={togglePasswordVisibility}
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
                </Form.Group>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-100 mb-3"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Signing In...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-sign-in-alt me-2"></i>
                      Sign In
                    </>
                  )}
                </Button>
              </Form>

              <div className="auth-links text-center">
                <p className="mb-2">
                  Don't have an owner account? 
                  <Link to="/owner-register" className="ms-1 fw-bold text-primary">
                    Register as Owner
                  </Link>
                </p>
                <hr className="my-3" />
                <p className="mb-0">
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

export default HouseOwnerLogin;
