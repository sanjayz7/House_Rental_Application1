const express = require('express');
const router = express.Router();
const showController = require('../controllers/showController');

// Get all shows
router.get('/', showController.getAllShows);

// Get a single show by ID
router.get('/:id', showController.getShowById);

// Create a new show
router.post('/', showController.createShow);

// Update a show
router.put('/:id', showController.updateShow);

// Delete a show
router.delete('/:id', showController.deleteShow);

module.exports = router;