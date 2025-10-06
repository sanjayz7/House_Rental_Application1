import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const OwnerListings = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/listings');
        setListings((res.data && res.data.items) || res.data || []);
      } catch (e) {
        setListings([]);
      }
    };
    fetch();
  }, []);

  const myListings = useMemo(() => {
    // Demo filter: assume DESCRIPTION includes owner name tag like "Owner: <name>" or OWNER_NAME field if present
    return listings.filter(l => {
      if (l.OWNER_NAME) return l.OWNER_NAME === user?.name;
      if (l.DESCRIPTION) return l.DESCRIPTION.includes(`Owner: ${user?.name}`);
      return false;
    });
  }, [listings, user]);

  if (!user) return null;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center page-header">
        <h2>My Listings</h2>
        <Button onClick={() => navigate('/show/new')} variant="primary">Add New Listing</Button>
      </div>
      {myListings.length === 0 ? (
        <div className="text-center py-5">
          <h3>No listings found</h3>
          <p>Create your first listing to get started.</p>
        </div>
      ) : (
        <Row>
          {myListings.map(l => (
            <Col md={4} key={l.SHOW_ID}>
              <Card className="show-card">
                <Card.Header>{l.TITLE}</Card.Header>
                <Card.Body>
                  {l.IMAGE_URL && (
                    <div className="mb-2">
                      <img src={l.IMAGE_URL} alt={l.TITLE} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 6 }} />
                    </div>
                  )}
                  <Card.Text>
                    <strong>Address:</strong> {l.ADDRESS || l.VENUE}<br/>
                    <strong>Rent:</strong> ${l.PRICE}
                  </Card.Text>
                  <div className="d-flex gap-2">
                    <Button variant="outline-secondary" onClick={() => navigate(`/show/edit/${l.SHOW_ID}`)}>Edit</Button>
                    <Button variant="outline-primary" onClick={() => navigate(`/show/${l.SHOW_ID}`)}>View</Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default OwnerListings;
