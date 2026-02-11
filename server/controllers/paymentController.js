const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../db');

exports.createCheckoutSession = async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: req.user.email,
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'DivviUp Premium',
                            description: 'Unlimited groups and members',
                        },
                        unit_amount: 500, // $5.00
                        recurring: {
                            interval: 'month',
                        },
                    },
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.CLIENT_URL}/dashboard?success=true`,
            cancel_url: `${process.env.CLIENT_URL}/dashboard?canceled=true`,
            metadata: {
                userId: req.user.id
            }
        });

        res.json({ url: session.url });
    } catch (err) {
        console.error('Error creating checkout session:', err);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
};

exports.webhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            const userId = session.metadata.userId;
            const subscriptionId = session.subscription;
            const customerId = session.customer;

            console.log(`Checkout completed for user ${userId}`);

            try {
                // Fetch full subscription to get current_period_end
                const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

                await db.query(
                    'UPDATE users SET plan = $1, stripe_customer_id = $2, stripe_subscription_id = $3, subscription_status = $4, current_period_end = $5 WHERE id = $6',
                    ['premium', customerId, subscriptionId, 'active', currentPeriodEnd, userId]
                );
            } catch (err) {
                console.error('Database update failed:', err);
            }
            break;

        case 'customer.subscription.updated':
            const subUpdated = event.data.object;
            console.log(`Subscription updated: ${subUpdated.id}`);

            try {
                // Check if canceled at period end
                const status = subUpdated.cancel_at_period_end ? 'canceled' : subUpdated.status;
                const currentPeriodEnd = new Date(subUpdated.current_period_end * 1000);

                await db.query(
                    'UPDATE users SET subscription_status = $1, current_period_end = $2 WHERE stripe_subscription_id = $3',
                    [status, currentPeriodEnd, subUpdated.id]
                );
            } catch (err) {
                console.error('Database update failed:', err);
            }
            break;

        case 'customer.subscription.deleted':
            const subscriptionParams = event.data.object;
            console.log(`Subscription deleted: ${subscriptionParams.id}`);
            try {
                await db.query(
                    'UPDATE users SET plan = $1, subscription_status = $2 WHERE stripe_subscription_id = $3',
                    ['free', 'expired', subscriptionParams.id]
                );
            } catch (err) {
                console.error('Database update failed:', err);
            }
            break;

        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.send();
};

exports.cancelSubscription = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get subscription ID from DB
        const userRes = await db.query('SELECT stripe_subscription_id FROM users WHERE id = $1', [userId]);

        if (userRes.rows.length === 0 || !userRes.rows[0].stripe_subscription_id) {
            return res.status(400).json({ error: 'No active subscription found' });
        }

        const subscriptionId = userRes.rows[0].stripe_subscription_id;

        // Cancel at period end
        const subscription = await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true
        });

        res.json({
            message: 'Subscription canceled successfully',
            status: 'canceled',
            current_period_end: new Date(subscription.current_period_end * 1000)
        });

    } catch (err) {
        console.error('Error canceling subscription:', err);
        res.status(500).json({ error: 'Failed to cancel subscription' });
    }
};
