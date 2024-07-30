const express = require('express');
const paymentController = require('../controllers/paymentController');

const router = express.Router();

// Define the route to handle payment requests
router.post('/payment', paymentController.processPayment);

// Define the route to handle successful payment responses
router.post('/ok-url', paymentController.processApproval);

// Define the route to handle failed payment responses
router.post('/fail-url', paymentController.processFailure);
module.exports = router;
