const express = require('express');
const router = express.Router();
const imagesController = require('../controllers/imagesController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth.authenticate);

// Get all images for a listing
router.get('/listing/:listingId', imagesController.getListingImages);

// Add image to listing
router.post('/listing/:listingId', imagesController.addImage);

// Update image
router.put('/:imageId', imagesController.updateImage);

// Delete image
router.delete('/:imageId', imagesController.deleteImage);

// Reorder images for a listing
router.put('/listing/:listingId/reorder', imagesController.reorderImages);

// Set primary image
router.put('/:imageId/primary', imagesController.setPrimaryImage);

module.exports = router;
