const express = require('express');
const router = express.Router();
const { getExchangeRate } = require('../utils/currencyService');

// GET /api/currency/rate?from=USD&to=EUR
router.get('/rate', async (req, res) => {
    try {
        const { from, to } = req.query;

        if (!from || !to) {
            return res.status(400).json({ error: 'Missing from or to currency parameters' });
        }

        const rate = await getExchangeRate(from, to);
        res.json({ rate });
    } catch (err) {
        console.error('Error fetching exchange rate:', err);
        res.status(500).json({ error: 'Failed to fetch exchange rate' });
    }
});

module.exports = router;
