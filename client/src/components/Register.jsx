import React, { useState } from 'react';
import { Form, Button, Card, Container, Row, Col, Alert, InputGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

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
        role: formData.role
      });

      setSuccess('Account created successfully! You can now login.');
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'user'
      });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
              <h3>Create Account</h3>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}
              
              <Form onSubmit={handleSubmit} className="auth-form">
                <Form.Group className="mb-3">
                  <Form.Label>Full Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter your full name"
                  />
                </Form.Group>

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
                  <Form.Label>Role</Form.Label>
                  <Form.Select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                  >
                    <option value="user">User - Browse and rent houses</option>
                    <option value="owner">House Owner - List properties</option>
                    <option value="admin">Admin - Manage platform</option>
                  </Form.Select>
                  <div className="role-description">
                    {formData.role === 'user' && 'Users can browse listings, contact owners, and rate properties'}
                    {formData.role === 'owner' && 'Owners can upload house photos, set prices, and manage listings'}
                    {formData.role === 'admin' && 'Admins can verify listings, monitor users, and manage the platform'}
                  </div>
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
                      placeholder="Enter password (min 6 characters)"
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

                <Form.Group className="mb-3">
                  <Form.Label>Confirm Password</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      placeholder="Confirm your password"
                    />
                    <Button
                      variant="outline-secondary"
                      type="button"
                      onClick={toggleConfirmPasswordVisibility}
                      className="password-toggle-btn"
                      style={{ borderLeft: 'none' }}
                    >
                      {showConfirmPassword ? (
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
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </Form>

              <div className="auth-links text-center">
                <p>Already have an account? <Link to="/login">Login here</Link></p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;
