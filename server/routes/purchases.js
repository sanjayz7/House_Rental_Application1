const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Add a new purchase (free house purchase)
router.post('/', purchaseController.addPurchase);

// Get user's purchases
router.get('/my-purchases', purchaseController.getUserPurchases);

// Get seller's sales
router.get('/my-sales', purchaseController.getSellerSales);

// Get purchase statistics
router.get('/stats', purchaseController.getPurchaseStats);

module.exports = router;

