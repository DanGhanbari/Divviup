const jwt = require('jsonwebtoken');

const passiveAuthMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = (authHeader && authHeader.split(' ')[1]) || req.cookies.token;

    if (!token) {
        // No token? No problem. Just continue without req.user.
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
    } catch (err) {
        // Invalid token? Ignore it and treat as guest.
        // We do NOT return 400/401 here.
    }
    next();
};

module.exports = passiveAuthMiddleware;
