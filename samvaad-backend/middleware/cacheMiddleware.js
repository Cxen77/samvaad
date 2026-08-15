import NodeCache from 'node-cache';

const cache = new NodeCache();

/**
 * Cache Middleware
 * @param {number} duration - Cache duration in seconds
 * @returns {function} Express middleware
 */
export const cacheMiddleware = (duration) => (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
        return next();
    }

    // Generate a unique key based on URL and query params
    // Include user ID in key if the data is user-specific (optional, based on requirement)
    // For public feeds (Events/Forums), URL is sufficient. 
    // For personalized feeds ("Following"), we might need to append userId, but user claims "non-real-time data".
    // Let's stick to URL-based for now, assuming public visibility or standard feeds.

    // NOTE: For "Following" feed in posts, the URL contains "?filter=following". 
    // If different users see different things on the same URL, we MUST include userId in the key.
    const key = req.originalUrl + (req.user ? `_${req.user._id}` : '');

    const cachedResponse = cache.get(key);

    if (cachedResponse) {
        // console.log(`[Cache Hit] ${key}`);
        res.setHeader('Content-Type', 'application/json');
        return res.send(cachedResponse);
    }

    // console.log(`[Cache Miss] ${key}`);
    const originalSend = res.send.bind(res); // Bind to preserve context
    res.send = (body) => {
        originalSend(body);
        cache.set(key, body, duration);
    };
    next();
};

export const clearCache = (pattern) => {
    // Helper to clear cache if needed (e.g. after posting)
    const keys = cache.keys();
    keys.forEach(key => {
        if (key.includes(pattern)) {
            cache.del(key);
        }
    });
};
