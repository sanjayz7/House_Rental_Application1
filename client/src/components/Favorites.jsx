import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
    setFavorites(favs);
  }, []);

  const removeFavorite = (id) => {
    const updated = favorites.filter((f) => f.SHOW_ID !== id);
    setFavorites(updated);
    localStorage.setItem('favorites', JSON.stringify(updated));
  };

  if (favorites.length === 0) {
    return (
      <div className="text-center py-5">
        <h3>No favorites yet</h3>
        <p>Add events to your favorites to find them quickly.</p>
        <Button variant="primary" onClick={() => navigate('/')}>Browse Events</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center page-header">
        <h2>Favorites</h2>
        <Button variant="outline-danger" onClick={() => { setFavorites([]); localStorage.setItem('favorites', '[]'); }}>Clear All</Button>
      </div>
      <Row>
        {favorites.map((show) => (
          <Col md={4} key={show.SHOW_ID}>
            <Card className="show-card">
              <Card.Header>{show.TITLE}</Card.Header>
              <Card.Body>
                {show.IMAGE_URL && (
                  <div className="mb-2">
                    <img src={show.IMAGE_URL} alt={show.TITLE} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 6 }} />
                  </div>
                )}
                <Card.Title>
                  {new Date(show.SHOW_DATE).toLocaleDateString()}
                  {show.CATEGORY && (
                    <Badge bg="info" className="ms-2">{show.CATEGORY}</Badge>
                  )}
                </Card.Title>
                <Card.Text>
                  <strong>Venue:</strong> {show.VENUE}
                  <br />
                  <strong>Price:</strong> ${show.PRICE}
                </Card.Text>
                <div className="d-flex justify-content-between">
                  <Button variant="outline-primary" onClick={() => navigate(`/show/${show.SHOW_ID}`)}>View</Button>
                  <Button variant="outline-danger" onClick={() => removeFavorite(show.SHOW_ID)}>Remove</Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Favorites;
