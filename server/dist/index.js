import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createRateLimiter } from './middleware/rateLimit.js';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import authRouter from './routes/auth.js';
import academicRouter from './routes/academic.js';
import aiRouter from './routes/ai.js';
import adminRouter from './routes/admin.js';
import { notificationScheduler } from './services/notificationScheduler.js';
import { seedDatabase } from './seed.js';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
// Security & Middlewares
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Rate Limiting for sensitive endpoints
const authLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // max 100 requests per window
    message: { error: 'Too many authentication attempts from this IP. Please try again after 15 minutes.' }
});
const aiLimiter = createRateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // max 30 AI requests per minute
    message: { error: 'Too many AI requests. Please slow down.' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/ai', aiLimiter);
// Health Check
app.get(['/api/health', '/health'], (req, res) => {
    res.json({
        status: 'ok',
        service: 'AI Study Manager API',
        timestamp: new Date().toISOString()
    });
});
// API Routes
app.use('/api/auth', authRouter);
app.use('/auth', authRouter);
app.use('/api/ai', aiRouter);
app.use('/ai', aiRouter);
app.use('/api/admin', adminRouter);
app.use('/admin', adminRouter);
app.use('/api', academicRouter);
app.use('/', academicRouter);
// Serve static frontend assets
const clientDist = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDist));
// SPA Fallback for client-side routing
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
        return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
});
// Global Error Handler
app.use((err, req, res, next) => {
    console.error('[Server Error]', err);
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    res.status(status).json({
        error: message,
        code: err.code || 'SERVER_ERROR'
    });
});
// Start Server
async function start() {
    await seedDatabase();
    notificationScheduler.start(60000); // Check every minute
    app.listen(PORT, () => {
        console.log(`===============================================`);
        console.log(` AI Study Manager Server running on port ${PORT}`);
        console.log(` Health: http://localhost:${PORT}/api/health`);
        console.log(`===============================================`);
    });
}
if (!process.env.VERCEL) {
    start().catch(err => {
        console.error('Fatal initialization error:', err);
    });
}
else {
    seedDatabase().catch(() => { });
}
export default app;
export { app };
