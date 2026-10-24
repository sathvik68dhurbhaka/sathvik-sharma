import jwt from 'jsonwebtoken';
import { db } from '../db/index.js';
export const JWT_SECRET = process.env.JWT_SECRET || 'ai-study-manager-super-secure-jwt-secret-key-2026';
export const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required. Missing or invalid Bearer token.' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // Check if user still exists and is not disabled
        const user = db.getUserById(decoded.userId);
        if (!user) {
            return res.status(401).json({ error: 'User account not found.' });
        }
        if (user.status === 'disabled') {
            return res.status(403).json({ error: 'This account has been disabled by an administrator.' });
        }
        req.user = {
            userId: user.id,
            email: user.email,
            role: user.role,
            name: user.name
        };
        next();
    }
    catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
};
export const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    }
    next();
};
