const axios = require('axios');

// Simple in-memory cache
let ratesCache = {
    timestamp: 0,
    rates: {}
};

const CACHE_DURATION = 1000 * 60 * 60; // 1 Hour

/**
 * Fetch exchange rate from base currency to target currency.
 * Uses Open Exchange Rates (Free tier allows base 'USD').
 * We will convert using USD as bridge if needed, but since free tier is only USD base,
 * we can calculate Cross Rates: Rate(A->B) = Rate(USD->B) / Rate(USD->A)
 */
const getExchangeRate = async (fromCurrency, toCurrency) => {
    // If currencies are the same, rate is 1.0
    if (fromCurrency === toCurrency) return 1.0;

    const appId = process.env.OPEN_EXCHANGE_RATES_APP_ID;
    if (!appId) {
        console.warn('OPEN_EXCHANGE_RATES_APP_ID not configured. Defaulting to 1.0');
        return 1.0;
    }

    const now = Date.now();

    // Check Cache
    if (ratesCache.timestamp + CACHE_DURATION > now && Object.keys(ratesCache.rates).length > 0) {
        // console.log('Using cached exchange rates');
    } else {
        // Fetch Fresh Rates
        console.log('Fetching fresh exchange rates from Open Exchange Rates...');
        try {
            const response = await axios.get(`https://openexchangerates.org/api/latest.json?app_id=${appId}`);
            if (response.data && response.data.rates) {
                ratesCache.rates = response.data.rates;
                ratesCache.timestamp = now;
            }
        } catch (error) {
            console.error('Failed to fetch exchange rates:', error.message);
            // Return 1.0 on failure to avoid blocking user flow, but log it.
            // In a production app, might want to fallback to stale cache or error out.
            if (Object.keys(ratesCache.rates).length > 0) {
                console.warn('Returning stale rates due to API failure.');
            } else {
                return 1.0;
            }
        }
    }

    const rates = ratesCache.rates;

    // Free tier base is usually USD.
    // Rate(USD -> Target) = rates[Target]
    // Rate(From -> To) = Rate(USD -> To) / Rate(USD -> From)

    const rateUSDTo = rates[toCurrency];
    const rateUSDFrom = rates[fromCurrency];

    if (!rateUSDTo || !rateUSDFrom) {
        console.warn(`Currency not found in rates: ${fromCurrency} or ${toCurrency}. Defaulting to 1.0`);
        return 1.0;
    }

    const finalRate = rateUSDTo / rateUSDFrom;
    // console.log(`Rate ${fromCurrency} -> ${toCurrency}: ${finalRate}`);

    return finalRate;
};

module.exports = { getExchangeRate };
