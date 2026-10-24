import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
const router = Router();
// Protect ALL admin routes with authenticate AND requireAdmin
router.use(authenticate);
router.use(requireAdmin);
// GET /api/admin/overview
router.get('/overview', (req, res) => {
    const allUsers = db.getUsers();
    const totalUsers = allUsers.length;
    const totalStudents = allUsers.filter(u => u.role === 'student').length;
    const totalAdmins = allUsers.filter(u => u.role === 'admin').length;
    const activeAccounts = allUsers.filter(u => u.status === 'active').length;
    const disabledAccounts = allUsers.filter(u => u.status === 'disabled').length;
    // Active users in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const activeInLast7Days = allUsers.filter(u => u.lastLoginAt && u.lastLoginAt >= sevenDaysAgo).length;
    // Auth audit stats
    const authLogsResult = db.getAuthAuditLogs({ limit: 100 });
    const recentLogs = authLogsResult.logs.slice(0, 10);
    const recentFailedLogins = authLogsResult.logs
        .filter(l => l.eventType === 'login_failure')
        .slice(0, 10);
    const recentSuccessfulLogins = authLogsResult.logs
        .filter(l => l.eventType === 'login_success')
        .slice(0, 10);
    // Admin audit stats
    const adminLogsResult = db.getAdminAuditLogs(10);
    // Registration timeline (last 7 days)
    const registrationTrend = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        const dateStr = d.toISOString().split('T')[0];
        const count = allUsers.filter(u => u.createdAt.startsWith(dateStr)).length;
        registrationTrend.push({ date: dateStr, count });
    }
    return res.json({
        metrics: {
            totalUsers,
            totalStudents,
            totalAdmins,
            activeAccounts,
            disabledAccounts,
            activeInLast7Days,
            totalLoginsRecorded: authLogsResult.total
        },
        registrationTrend,
        recentSuccessfulLogins,
        recentFailedLogins,
        recentActivity: recentLogs,
        latestAdminActions: adminLogsResult.logs
    });
});
// GET /api/admin/users
router.get('/users', (req, res) => {
    const { search, role, status, page = '1', limit = '10', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    let users = db.getUsers().map(u => {
        const { passwordHash: _, ...safe } = u;
        return safe;
    });
    // Filter: search
    if (search && typeof search === 'string') {
        const q = search.toLowerCase().trim();
        users = users.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    // Filter: role
    if (role && (role === 'student' || role === 'admin')) {
        users = users.filter(u => u.role === role);
    }
    // Filter: status
    if (status && (status === 'active' || status === 'disabled')) {
        users = users.filter(u => u.status === status);
    }
    // Sort
    users.sort((a, b) => {
        const fieldA = a[sortBy] || '';
        const fieldB = b[sortBy] || '';
        if (sortOrder === 'asc') {
            return fieldA > fieldB ? 1 : -1;
        }
        return fieldA < fieldB ? 1 : -1;
    });
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const total = users.length;
    const paginated = users.slice((pageNum - 1) * limitNum, pageNum * limitNum);
    return res.json({
        users: paginated,
        pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum)
        }
    });
});
// GET /api/admin/users/:id
router.get('/users/:id', (req, res) => {
    const user = db.getUserById(req.params.id);
    if (!user) {
        return res.status(404).json({ error: 'User not found.' });
    }
    const { passwordHash: _, ...safeUser } = user;
    const sessions = db.getStudySessions(user.id);
    const assignments = db.getAssignments(user.id);
    const subjects = db.getSubjects(user.id);
    return res.json({
        user: safeUser,
        stats: {
            totalSessions: sessions.length,
            completedSessions: sessions.filter(s => s.status === 'completed').length,
            totalAssignments: assignments.length,
            completedAssignments: assignments.filter(a => a.status === 'completed').length,
            subjectsCount: subjects.length
        }
    });
});
// PUT /api/admin/users/:id/status
router.put('/users/:id/status', (req, res) => {
    const targetId = req.params.id;
    const { status } = req.body;
    const adminUser = req.user;
    if (status !== 'active' && status !== 'disabled') {
        return res.status(400).json({ error: 'Status must be either "active" or "disabled".' });
    }
    // Prevent admin from disabling themselves
    if (targetId === adminUser.userId) {
        return res.status(400).json({ error: 'You cannot disable your own administrator account.' });
    }
    const existing = db.getUserById(targetId);
    if (!existing) {
        return res.status(404).json({ error: 'User not found.' });
    }
    const updated = db.updateUser(targetId, { status });
    // Record Admin Audit Log
    db.addAdminAuditLog({
        id: uuidv4(),
        adminId: adminUser.userId,
        adminEmail: adminUser.email,
        action: 'update_user_status',
        targetUserId: targetId,
        targetUserEmail: existing.email,
        details: `Updated status of user ${existing.email} from ${existing.status} to ${status}`,
        timestamp: new Date().toISOString()
    });
    const { passwordHash: _, ...safeUser } = updated;
    return res.json({ message: `User account is now ${status}.`, user: safeUser });
});
// PUT /api/admin/users/:id/role
router.put('/users/:id/role', (req, res) => {
    const targetId = req.params.id;
    const { role } = req.body;
    const adminUser = req.user;
    if (role !== 'student' && role !== 'admin') {
        return res.status(400).json({ error: 'Role must be either "student" or "admin".' });
    }
    // Prevent admin from demoting themselves
    if (targetId === adminUser.userId && role !== 'admin') {
        return res.status(400).json({ error: 'You cannot remove admin privileges from yourself.' });
    }
    const existing = db.getUserById(targetId);
    if (!existing) {
        return res.status(404).json({ error: 'User not found.' });
    }
    const updated = db.updateUser(targetId, { role });
    // Record Admin Audit Log
    db.addAdminAuditLog({
        id: uuidv4(),
        adminId: adminUser.userId,
        adminEmail: adminUser.email,
        action: 'update_user_role',
        targetUserId: targetId,
        targetUserEmail: existing.email,
        details: `Changed role of user ${existing.email} from ${existing.role} to ${role}`,
        timestamp: new Date().toISOString()
    });
    const { passwordHash: _, ...safeUser } = updated;
    return res.json({ message: `User role updated to ${role}.`, user: safeUser });
});
// GET /api/admin/audit-logs
router.get('/audit-logs', (req, res) => {
    const { type = 'auth', email, eventType, status, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;
    if (type === 'admin') {
        const result = db.getAdminAuditLogs(limitNum, offset);
        return res.json({
            logs: result.logs,
            pagination: {
                total: result.total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(result.total / limitNum)
            }
        });
    }
    // Default to Auth Audit Logs
    const result = db.getAuthAuditLogs({
        email: email,
        eventType: eventType,
        status: status,
        limit: limitNum,
        offset
    });
    return res.json({
        logs: result.logs,
        pagination: {
            total: result.total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(result.total / limitNum)
        }
    });
});
// GET /api/admin/export-users
router.get('/export-users', (req, res) => {
    const adminUser = req.user;
    const users = db.getUsers();
    // Audit this export action
    db.addAdminAuditLog({
        id: uuidv4(),
        adminId: adminUser.userId,
        adminEmail: adminUser.email,
        action: 'export_users',
        details: `Exported ${users.length} registered users to CSV`,
        timestamp: new Date().toISOString()
    });
    const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Created At', 'Last Login At', 'Weekly Goal Hours'];
    const rows = users.map(u => [
        `"${u.id}"`,
        `"${u.name.replace(/"/g, '""')}"`,
        `"${u.email.replace(/"/g, '""')}"`,
        `"${u.role}"`,
        `"${u.status}"`,
        `"${u.createdAt}"`,
        `"${u.lastLoginAt || ''}"`,
        `"${u.weeklyGoalHours || 15}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="registered_users_export.csv"');
    return res.send(csvContent);
});
export default router;
