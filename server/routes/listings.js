const express = require('express');
const router = express.Router();
const listingsController = require('../controllers/listingsController');
const { authenticate, requireRole } = require('../middleware/auth');

// Public
router.get('/', listingsController.getAllListings);
router.get('/search', listingsController.searchListings);
router.get('/:id', listingsController.getListingById);

// Authenticated owner actions
router.post('/', authenticate, requireRole('owner', 'admin'), listingsController.createListing);
router.put('/:id', authenticate, requireRole('owner', 'admin'), listingsController.updateListing);
router.delete('/:id', authenticate, requireRole('owner', 'admin'), listingsController.deleteListing);

// Admin verify toggle
router.post('/:id/verify', authenticate, requireRole('admin'), listingsController.verifyListing);

module.exports = router;
