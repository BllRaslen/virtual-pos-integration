const express = require('express');
const paymentController = require('../controllers/paymentController');

const router = express.Router();

// Route to handle payment requests
router.post('/payment', paymentController.processPayment);

// Route to handle successful payment responses
router.post('/ok-url', paymentController.processApproval);

// Route to handle failed payment responses
router.post('/fail-url', paymentController.processFailure);

// Route to handle payment fulfillment
router.post('/payment-fulfillment', paymentController.handlePaymentFulfillment);

// Route for payment success page
router.get('/payment-success', (req, res) => {
    res.send('Payment was successful! Thank you for your purchase.');
});

// Route for payment failure page
router.get('/payment-fail', (req, res) => {
    res.send('Payment failed. Please try again.');
});

// Route to perform SaleReversal
router.post('/sale-reversal', paymentController.processSaleReversal);

module.exports = router;
