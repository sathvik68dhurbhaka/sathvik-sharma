import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { authenticate, JWT_SECRET } from '../middleware/auth.js';
import { hashPassword, comparePassword } from '../utils/crypto.js';
const router = Router();
// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || typeof name !== 'string' || name.trim().length < 2) {
            return res.status(400).json({ error: 'Name must be at least 2 characters.' });
        }
        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return res.status(400).json({ error: 'Please enter a valid email address.' });
        }
        if (!password || typeof password !== 'string' || password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        }
        const normalizedEmail = email.toLowerCase().trim();
        const existing = db.getUserByEmail(normalizedEmail);
        if (existing) {
            return res.status(400).json({ error: 'An account with this email already exists.' });
        }
        const passwordHash = hashPassword(password);
        const newUser = {
            id: uuidv4(),
            name: name.trim(),
            email: normalizedEmail,
            passwordHash,
            role: 'student', // Never trust client-supplied role
            status: 'active',
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            weeklyGoalHours: 15,
            notificationPreferences: {
                browserEnabled: false,
                inAppEnabled: true,
                reminderMinutesBefore: 15
            }
        };
        db.addUser(newUser);
        // Record audit log
        db.addAuthAuditLog({
            id: uuidv4(),
            userId: newUser.id,
            email: normalizedEmail,
            eventType: 'register',
            status: 'success',
            ip: req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent'] || 'unknown',
            description: 'Student account registered successfully',
            timestamp: new Date().toISOString()
        });
        const token = jwt.sign({
            userId: newUser.id,
            email: newUser.email,
            role: newUser.role,
            name: newUser.name
        }, JWT_SECRET, { expiresIn: '7d' });
        const { passwordHash: _, ...userSafe } = newUser;
        return res.status(201).json({
            message: 'Registration successful',
            token,
            user: userSafe
        });
    }
    catch (error) {
        console.error('[Auth] Register error:', error);
        return res.status(500).json({ error: 'Internal server error during registration.' });
    }
});
// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }
        const normalizedEmail = email.toLowerCase().trim();
        const user = db.getUserByEmail(normalizedEmail);
        if (!user || !user.passwordHash) {
            db.addAuthAuditLog({
                id: uuidv4(),
                email: normalizedEmail,
                eventType: 'login_failure',
                status: 'failure',
                ip: req.ip || req.socket.remoteAddress,
                userAgent: req.headers['user-agent'] || 'unknown',
                description: 'Failed login attempt: Account does not exist or invalid credentials',
                timestamp: new Date().toISOString()
            });
            return res.status(401).json({ error: 'Invalid email or password.' });
        }
        if (user.status === 'disabled') {
            db.addAuthAuditLog({
                id: uuidv4(),
                userId: user.id,
                email: normalizedEmail,
                eventType: 'login_failure',
                status: 'failure',
                ip: req.ip || req.socket.remoteAddress,
                userAgent: req.headers['user-agent'] || 'unknown',
                description: 'Failed login attempt: Account has been disabled',
                timestamp: new Date().toISOString()
            });
            return res.status(403).json({ error: 'Your account has been disabled. Please contact the administrator.' });
        }
        const isMatch = comparePassword(password, user.passwordHash);
        if (!isMatch) {
            db.addAuthAuditLog({
                id: uuidv4(),
                userId: user.id,
                email: normalizedEmail,
                eventType: 'login_failure',
                status: 'failure',
                ip: req.ip || req.socket.remoteAddress,
                userAgent: req.headers['user-agent'] || 'unknown',
                description: 'Failed login attempt: Incorrect password',
                timestamp: new Date().toISOString()
            });
            return res.status(401).json({ error: 'Invalid email or password.' });
        }
        // Success
        const now = new Date().toISOString();
        db.updateUser(user.id, { lastLoginAt: now });
        db.addAuthAuditLog({
            id: uuidv4(),
            userId: user.id,
            email: normalizedEmail,
            eventType: 'login_success',
            status: 'success',
            ip: req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent'] || 'unknown',
            description: `Successful login as ${user.role}`,
            timestamp: now
        });
        const token = jwt.sign({
            userId: user.id,
            email: user.email,
            role: user.role,
            name: user.name
        }, JWT_SECRET, { expiresIn: '7d' });
        const { passwordHash: _, ...userSafe } = user;
        return res.json({
            message: 'Login successful',
            token,
            user: userSafe
        });
    }
    catch (error) {
        console.error('[Auth] Login error:', error);
        return res.status(500).json({ error: 'Internal server error during login.' });
    }
});
// POST /api/auth/logout
router.post('/logout', authenticate, (req, res) => {
    if (req.user) {
        db.addAuthAuditLog({
            id: uuidv4(),
            userId: req.user.userId,
            email: req.user.email,
            eventType: 'logout',
            status: 'success',
            ip: req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent'] || 'unknown',
            description: 'User logged out',
            timestamp: new Date().toISOString()
        });
    }
    return res.json({ message: 'Logged out successfully.' });
});
// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required.' });
        }
        const normalizedEmail = email.toLowerCase().trim();
        const user = db.getUserByEmail(normalizedEmail);
        if (user) {
            const resetToken = uuidv4();
            const expires = new Date(Date.now() + 3600000).toISOString(); // 1 hour
            db.updateUser(user.id, {
                resetPasswordToken: resetToken,
                resetPasswordExpires: expires
            });
            db.addAuthAuditLog({
                id: uuidv4(),
                userId: user.id,
                email: normalizedEmail,
                eventType: 'password_reset_request',
                status: 'success',
                ip: req.ip || req.socket.remoteAddress,
                userAgent: req.headers['user-agent'] || 'unknown',
                description: 'Password reset token requested',
                timestamp: new Date().toISOString()
            });
            // In production with email service, an email would be dispatched.
            // We return the reset token safely for verification in dev/demo environments.
            return res.json({
                message: 'Password reset instructions have been generated.',
                resetToken: process.env.NODE_ENV === 'production' ? undefined : resetToken
            });
        }
        return res.json({ message: 'If an account exists with this email, instructions have been sent.' });
    }
    catch (error) {
        return res.status(500).json({ error: 'Failed to process password reset request.' });
    }
});
// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'Valid token and new password (min 6 chars) are required.' });
        }
        const user = db.getUsers().find(u => u.resetPasswordToken === token && u.resetPasswordExpires && new Date(u.resetPasswordExpires) > new Date());
        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired password reset token.' });
        }
        const passwordHash = hashPassword(newPassword);
        db.updateUser(user.id, {
            passwordHash,
            resetPasswordToken: undefined,
            resetPasswordExpires: undefined
        });
        db.addAuthAuditLog({
            id: uuidv4(),
            userId: user.id,
            email: user.email,
            eventType: 'password_reset_success',
            status: 'success',
            ip: req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent'] || 'unknown',
            description: 'Password reset completed successfully',
            timestamp: new Date().toISOString()
        });
        return res.json({ message: 'Password has been reset successfully. You can now log in.' });
    }
    catch (error) {
        return res.status(500).json({ error: 'Failed to reset password.' });
    }
});
// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
    if (!req.user)
        return res.status(401).json({ error: 'Not authenticated' });
    const user = db.getUserById(req.user.userId);
    if (!user)
        return res.status(404).json({ error: 'User not found' });
    const { passwordHash: _, ...safeUser } = user;
    return res.json({ user: safeUser });
});
// PUT /api/auth/profile
router.put('/profile', authenticate, (req, res) => {
    if (!req.user)
        return res.status(401).json({ error: 'Not authenticated' });
    const { name, weeklyGoalHours, gradeLevel, timezone, notificationPreferences } = req.body;
    const updates = {};
    if (name && typeof name === 'string')
        updates.name = name.trim();
    if (weeklyGoalHours && typeof weeklyGoalHours === 'number')
        updates.weeklyGoalHours = weeklyGoalHours;
    if (gradeLevel)
        updates.gradeLevel = gradeLevel;
    if (timezone)
        updates.timezone = timezone;
    if (notificationPreferences)
        updates.notificationPreferences = notificationPreferences;
    const updated = db.updateUser(req.user.userId, updates);
    if (!updated)
        return res.status(404).json({ error: 'User not found' });
    const { passwordHash: _, ...safeUser } = updated;
    return res.json({ message: 'Profile updated successfully', user: safeUser });
});
export default router;
