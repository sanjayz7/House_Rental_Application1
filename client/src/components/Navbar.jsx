import React from 'react';
import { Navbar as BootstrapNavbar, Nav, Container, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <BootstrapNavbar expand="lg" className="navbar" variant="dark">
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/">House Rental</BootstrapNavbar.Brand>
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link as={Link} to="/">Home</Nav.Link>
            <Nav.Link as={Link} to="/listings">Browse Listings</Nav.Link>
            <Nav.Link as={Link} to="/favorites">Favorites</Nav.Link>
            {user?.role === 'user' && (
              <Nav.Link as={Link} to="/user-dashboard">User Dashboard</Nav.Link>
            )}
            {user?.role === 'owner' && (
              <Nav.Link as={Link} to="/owner-dashboard">Owner Dashboard</Nav.Link>
            )}
            {user?.role === 'admin' && (
              <Nav.Link as={Link} to="/admin-dashboard">Admin Dashboard</Nav.Link>
            )}
            {user ? (
              <Nav.Link onClick={logout}>Logout ({user.name})</Nav.Link>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">General Login</Nav.Link>
                <Nav.Link as={Link} to="/user-login" className="text-info">User Login</Nav.Link>
                <Nav.Link as={Link} to="/owner-login" className="text-warning">Owner Login</Nav.Link>
                <Nav.Link as={Link} to="/admin-login" className="text-danger">Admin Login</Nav.Link>
              </>
            )}
            {user?.role === 'owner' && (
              <Button 
                as={Link} 
                to="/owner-add-listing" 
                variant="success" 
                className="post-property-btn ms-2"
                size="sm"
              >
                 Post Property FREE
              </Button>
            )}
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;