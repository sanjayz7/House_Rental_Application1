import React, { useState } from 'react';
import { Form, Button, Card, Container, Row, Col, Alert, InputGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const Login = () => {
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
      
      saveSession(token, user);
      navigate('/');
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
        <Col md={6}>
          <Card className="mt-5 auth-card">
            <Card.Header className="text-center">
              <h3>Login to Your Account</h3>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              
              <Form onSubmit={handleSubmit} className="auth-form">
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Enter your email"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="Enter your password"
                    />
                    <Button
                      variant="outline-secondary"
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="password-toggle-btn"
                      style={{ borderLeft: 'none' }}
                    >
                      {showPassword ? (
                        <span role="img" aria-label="hide password">👁️‍🗨️</span>
                      ) : (
                        <span role="img" aria-label="show password">👁️</span>
                      )}
                    </Button>
                  </InputGroup>
                </Form.Group>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-100"
                  disabled={loading}
                >
                  {loading ? 'Logging in...' : 'Login'}
                </Button>
              </Form>

              <div className="auth-links text-center">
                <p>Don't have an account? <Link to="/register">Create one here</Link></p>
                <small className="text-muted">
                  Choose your role: User (browse houses), Owner (list properties), or Admin (manage platform)
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;
