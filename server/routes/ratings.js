const express = require('express');
const router = express.Router();
const ratingsController = require('../controllers/ratingsController');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/:listingId', ratingsController.getListingRatings);
router.get('/:listingId/avg', ratingsController.getListingAverage);
router.post('/:listingId', authenticate, requireRole('user','owner','admin'), ratingsController.submitRating);

module.exports = router;
