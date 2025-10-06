const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, requireRole } = require('../middleware/auth');

// All admin routes require authentication
router.use(authenticate);

// Export functionality
// Allow sample exports (?mock=1) for any authenticated user to help testing without DB/role requirements
router.get('/export/listings', (req, res, next) => {
  if (req.query.mock === '1') return adminController.exportListings(req, res);
  return requireRole('admin')(req, res, () => adminController.exportListings(req, res));
});
router.get('/export/bookings', (req, res, next) => {
  if (req.query.mock === '1') return adminController.exportBookings(req, res);
  return requireRole('admin')(req, res, () => adminController.exportBookings(req, res));
});
router.get('/export/users', (req, res, next) => {
  if (req.query.mock === '1') return adminController.exportUsers(req, res);
  return requireRole('admin')(req, res, () => adminController.exportUsers(req, res));
});

// The remaining admin APIs require admin role
router.use(requireRole('admin'));

// Dashboard statistics
router.get('/stats', adminController.getDashboardStats);

// User management
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Booking management
router.get('/bookings', adminController.getAllBookings);
router.post('/bookings', adminController.createBooking);
router.put('/bookings/:id', adminController.updateBooking);
router.delete('/bookings/:id', adminController.deleteBooking);

// Email functionality
router.post('/send-bulk-email', adminController.sendBulkEmail);
router.post('/send-welcome-emails', adminController.sendWelcomeEmails);

// (moved above with conditional role bypass for mock)

module.exports = router;
