import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';
import { aiService } from '../services/aiService.js';
const router = Router();
// Apply authentication to AI endpoints
router.use(authenticate);
// GET /api/ai/status
router.get('/status', (req, res) => {
    const status = aiService.getStatus();
    return res.json({ status });
});
// GET /api/ai/predictions - Academic & Exam Readiness Predictions
router.get('/predictions', async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = db.getUserById(userId);
        const subjects = db.getSubjects(userId);
        const sessions = db.getStudySessions(userId);
        const assignments = db.getAssignments(userId);
        const goals = db.getGoals(userId);
        // Calculate current streak
        const completedDates = new Set(sessions.filter(s => s.status === 'completed').map(s => s.date));
        let currentStreak = 0;
        let checkDate = new Date();
        const todayKey = checkDate.toISOString().split('T')[0];
        if (!completedDates.has(todayKey)) {
            checkDate.setDate(checkDate.getDate() - 1);
        }
        while (true) {
            const key = checkDate.toISOString().split('T')[0];
            if (completedDates.has(key)) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            }
            else {
                break;
            }
        }
        const report = await aiService.generatePredictions({
            studentName: user?.name || 'Student',
            weeklyGoalHours: user?.weeklyGoalHours || 18,
            subjects: subjects.map(s => ({
                id: s.id,
                name: s.name,
                color: s.color,
                targetHoursPerWeek: s.targetHoursPerWeek
            })),
            sessions: sessions.map(s => ({
                subjectName: s.subjectName,
                date: s.date,
                status: s.status,
                durationMinutes: s.durationMinutes,
                actualMinutesCompleted: s.actualMinutesCompleted
            })),
            assignments: assignments.map(a => ({
                subjectName: a.subjectName,
                status: a.status,
                dueDate: a.dueDate
            })),
            goals: goals.map(g => ({ isCompleted: g.completed })),
            currentStreak
        });
        return res.json({ report });
    }
    catch (error) {
        console.error('[AI Predictions] Error:', error);
        return res.status(500).json({ error: 'Failed to generate predictions.' });
    }
});
// POST /api/ai/predict-simulation - "What-If" Predictive Scenario Simulator
router.post('/predict-simulation', async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = db.getUserById(userId);
        const { addedHoursPerWeek, targetedSubjectId, assignmentEarlyBoost } = req.body;
        const subjects = db.getSubjects(userId);
        const sessions = db.getStudySessions(userId);
        const assignments = db.getAssignments(userId);
        const goals = db.getGoals(userId);
        const completedDates = new Set(sessions.filter(s => s.status === 'completed').map(s => s.date));
        let currentStreak = 0;
        let checkDate = new Date();
        const todayKey = checkDate.toISOString().split('T')[0];
        if (!completedDates.has(todayKey)) {
            checkDate.setDate(checkDate.getDate() - 1);
        }
        while (true) {
            const key = checkDate.toISOString().split('T')[0];
            if (completedDates.has(key)) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            }
            else {
                break;
            }
        }
        const report = await aiService.generatePredictions({
            studentName: user?.name || 'Student',
            weeklyGoalHours: user?.weeklyGoalHours || 18,
            subjects: subjects.map(s => ({
                id: s.id,
                name: s.name,
                color: s.color,
                targetHoursPerWeek: s.targetHoursPerWeek
            })),
            sessions: sessions.map(s => ({
                subjectName: s.subjectName,
                date: s.date,
                status: s.status,
                durationMinutes: s.durationMinutes,
                actualMinutesCompleted: s.actualMinutesCompleted
            })),
            assignments: assignments.map(a => ({
                subjectName: a.subjectName,
                status: a.status,
                dueDate: a.dueDate
            })),
            goals: goals.map(g => ({ isCompleted: g.completed })),
            currentStreak,
            simulationOverrides: {
                addedHoursPerWeek: Number(addedHoursPerWeek) || 0,
                targetedSubjectId,
                assignmentEarlyBoost: Boolean(assignmentEarlyBoost)
            }
        });
        return res.json({ report });
    }
    catch (error) {
        console.error('[AI Simulation] Error:', error);
        return res.status(500).json({ error: 'Failed to run prediction simulation.' });
    }
});
// GET /api/ai/conversations
router.get('/conversations', (req, res) => {
    const userId = req.user.userId;
    const conversations = db.getConversations(userId);
    return res.json({ conversations });
});
// GET /api/ai/conversations/:id
router.get('/conversations/:id', (req, res) => {
    const userId = req.user.userId;
    const conv = db.getConversationById(req.params.id);
    if (!conv || conv.userId !== userId) {
        return res.status(404).json({ error: 'Conversation not found.' });
    }
    return res.json({ conversation: conv });
});
// DELETE /api/ai/conversations/:id
router.delete('/conversations/:id', (req, res) => {
    const userId = req.user.userId;
    const conv = db.getConversationById(req.params.id);
    if (!conv || conv.userId !== userId) {
        return res.status(404).json({ error: 'Conversation not found.' });
    }
    db.deleteConversation(req.params.id);
    return res.json({ message: 'Conversation deleted.' });
});
// POST /api/ai/tutor
router.post('/tutor', async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = db.getUserById(userId);
        const { conversationId, message, mode = 'general', subjectId, subjectName } = req.body;
        if (!message || typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({ error: 'Message cannot be empty.' });
        }
        let activeConversationId = conversationId;
        let conv = null;
        if (activeConversationId) {
            conv = db.getConversationById(activeConversationId);
            if (!conv || conv.userId !== userId) {
                return res.status(404).json({ error: 'Conversation not found.' });
            }
        }
        else {
            // Create new conversation
            const summaryTitle = message.trim().slice(0, 36) + (message.length > 36 ? '...' : '');
            const newConv = {
                id: uuidv4(),
                userId,
                title: summaryTitle,
                subjectId,
                subjectName,
                mode,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            db.addConversation(newConv);
            activeConversationId = newConv.id;
            conv = newConv;
        }
        // Save user message
        const userMsg = {
            id: uuidv4(),
            conversationId: activeConversationId,
            role: 'user',
            content: message.trim(),
            createdAt: new Date().toISOString()
        };
        db.addMessage(userMsg);
        // Prepare history for AI context
        const fullConv = db.getConversationById(activeConversationId);
        const history = (fullConv?.messages || []).map(m => ({
            role: m.role,
            content: m.content
        }));
        // Call real AI service
        const aiResult = await aiService.generateTutorResponse({
            history,
            userPrompt: message.trim(),
            mode,
            subjectName: subjectName || conv?.subjectName,
            gradeLevel: user?.gradeLevel
        });
        // Save assistant message
        const assistantMsg = {
            id: uuidv4(),
            conversationId: activeConversationId,
            role: 'assistant',
            content: aiResult.content,
            quizData: aiResult.quizData,
            createdAt: new Date().toISOString()
        };
        db.addMessage(assistantMsg);
        return res.json({
            conversationId: activeConversationId,
            message: assistantMsg,
            provider: aiResult.provider,
            modelUsed: aiResult.modelUsed
        });
    }
    catch (error) {
        console.error('[AI Tutor] Error:', error);
        return res.status(500).json({
            error: error.message || 'Failed to generate tutor response.'
        });
    }
});
// POST /api/ai/generate-plan
router.post('/generate-plan', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { availableHoursPerDay, startDate, endDate, examDates, weakAreas, preferredStartTime } = req.body;
        const subjects = db.getSubjects(userId);
        if (subjects.length === 0) {
            return res.status(400).json({
                error: 'Please add at least one subject before generating a study plan.'
            });
        }
        const planResult = await aiService.generateStudyPlan({
            subjects: subjects.map(s => ({
                name: s.name,
                priority: 'medium',
                targetHoursPerWeek: s.targetHoursPerWeek,
                topics: s.topics
            })),
            availableHoursPerDay: Number(availableHoursPerDay) || 3,
            startDate: startDate || new Date().toISOString().split('T')[0],
            endDate: endDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
            examDates,
            weakAreas,
            dailyStudyPreferences: { preferredStartTime }
        });
        return res.json(planResult);
    }
    catch (error) {
        console.error('[AI Plan] Error:', error);
        return res.status(500).json({
            error: error.message || 'Failed to generate study plan.'
        });
    }
});
// POST /api/ai/apply-plan
router.post('/apply-plan', (req, res) => {
    try {
        const userId = req.user.userId;
        const { sessions } = req.body;
        if (!Array.isArray(sessions) || sessions.length === 0) {
            return res.status(400).json({ error: 'No sessions provided to apply.' });
        }
        const createdSessions = [];
        const subjects = db.getSubjects(userId);
        for (const item of sessions) {
            const matchedSubject = subjects.find(s => s.name.toLowerCase() === (item.subjectName || '').toLowerCase());
            const newSession = {
                id: uuidv4(),
                userId,
                subjectId: matchedSubject?.id || 'general',
                subjectName: item.subjectName || 'Study Session',
                topic: item.topic || 'General Topic',
                date: item.date,
                startTime: item.startTime,
                endTime: item.endTime,
                durationMinutes: Number(item.durationMinutes) || 60,
                actualMinutesCompleted: 0,
                priority: item.priority || 'medium',
                status: 'scheduled',
                notes: item.reasoning || 'AI-scheduled session',
                createdAt: new Date().toISOString()
            };
            db.addStudySession(newSession);
            createdSessions.push(newSession);
        }
        // Add in-app notification
        db.addNotification({
            id: uuidv4(),
            userId,
            title: 'Study Plan Saved',
            message: `Successfully scheduled ${createdSessions.length} new study sessions on your timetable.`,
            type: 'success',
            isRead: false,
            createdAt: new Date().toISOString()
        });
        return res.status(201).json({
            message: `Successfully applied ${createdSessions.length} sessions to your timetable.`,
            sessions: createdSessions
        });
    }
    catch (error) {
        return res.status(500).json({ error: 'Failed to apply plan sessions.' });
    }
});
export default router;
