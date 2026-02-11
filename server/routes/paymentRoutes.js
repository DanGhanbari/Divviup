const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const verifyToken = require('../middlewares/authMiddleware');

// Webhook must be raw body, so we might need to handle it in server.js or here carefully.
// Usually webhook is defined separately or before body parsers.
// Let's define the checkout route here.
router.post('/webhook', paymentController.webhook);
router.post('/create-checkout-session', verifyToken, paymentController.createCheckoutSession);
router.post('/cancel-subscription', verifyToken, paymentController.cancelSubscription);

module.exports = router;
