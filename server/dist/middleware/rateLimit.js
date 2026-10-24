export function createRateLimiter(options) {
    const store = new Map();
    // Cleanup old entries every 5 minutes
    setInterval(() => {
        const now = Date.now();
        for (const [key, val] of store.entries()) {
            if (now > val.resetTime) {
                store.delete(key);
            }
        }
    }, 5 * 60 * 1000);
    return (req, res, next) => {
        const key = req.ip || req.socket.remoteAddress || 'unknown';
        const now = Date.now();
        const record = store.get(key);
        if (!record || now > record.resetTime) {
            store.set(key, {
                count: 1,
                resetTime: now + options.windowMs
            });
            res.setHeader('X-RateLimit-Limit', options.max);
            res.setHeader('X-RateLimit-Remaining', options.max - 1);
            return next();
        }
        if (record.count >= options.max) {
            const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
            res.setHeader('Retry-After', retryAfterSeconds);
            res.setHeader('X-RateLimit-Limit', options.max);
            res.setHeader('X-RateLimit-Remaining', 0);
            return res.status(429).json(options.message);
        }
        record.count++;
        res.setHeader('X-RateLimit-Limit', options.max);
        res.setHeader('X-RateLimit-Remaining', options.max - record.count);
        return next();
    };
}
