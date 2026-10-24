import { v4 as uuidv4 } from 'uuid';
import { db } from './db/index.js';
import { hashPassword } from './utils/crypto.js';
export async function seedDatabase() {
    console.log('[Seed] Checking database seeding...');
    const users = db.getUsers();
    // 1. Seed Admin
    const adminEmail = 'admin@aistudymanager.com';
    let admin = db.getUserByEmail(adminEmail);
    if (!admin) {
        const passwordHash = hashPassword('AdminSecure123!');
        admin = {
            id: uuidv4(),
            name: 'System Administrator',
            email: adminEmail,
            passwordHash,
            role: 'admin',
            status: 'active',
            createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
            lastLoginAt: new Date().toISOString(),
            weeklyGoalHours: 0,
            notificationPreferences: {
                browserEnabled: true,
                inAppEnabled: true,
                reminderMinutesBefore: 15
            }
        };
        db.addUser(admin);
        console.log('[Seed] Created default Administrator: admin@aistudymanager.com / AdminSecure123!');
    }
    // 2. Seed Student
    const studentEmail = 'student@example.com';
    let student = db.getUserByEmail(studentEmail);
    if (!student) {
        const passwordHash = hashPassword('StudentPass123!');
        student = {
            id: uuidv4(),
            name: 'Alex Rivera',
            email: studentEmail,
            passwordHash,
            role: 'student',
            status: 'active',
            createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
            lastLoginAt: new Date().toISOString(),
            weeklyGoalHours: 18,
            gradeLevel: 'Undergraduate Computer Science & Mathematics',
            timezone: 'America/New_York',
            notificationPreferences: {
                browserEnabled: true,
                inAppEnabled: true,
                reminderMinutesBefore: 15
            }
        };
        db.addUser(student);
        console.log('[Seed] Created default Student: student@example.com / StudentPass123!');
        const studentId = student.id;
        // Seed Subjects
        const subjects = [
            {
                id: uuidv4(),
                userId: studentId,
                name: 'Calculus III',
                code: 'MATH-201',
                color: '#F97316', // Orange
                targetHoursPerWeek: 5,
                topics: ['Multivariable Limits', 'Partial Derivatives', 'Double & Triple Integrals', 'Green\'s Theorem'],
                createdAt: new Date().toISOString()
            },
            {
                id: uuidv4(),
                userId: studentId,
                name: 'Data Structures & Algorithms',
                code: 'CS-210',
                color: '#EA580C', // Deep Orange
                targetHoursPerWeek: 6,
                topics: ['Binary Search Trees', 'Graph Traversal (BFS/DFS)', 'Dynamic Programming', 'Dijkstra Algorithm'],
                createdAt: new Date().toISOString()
            },
            {
                id: uuidv4(),
                userId: studentId,
                name: 'University Physics II',
                code: 'PHYS-150',
                color: '#C2410C', // Dark Orange
                targetHoursPerWeek: 4,
                topics: ['Electric Fields', 'Gauss\'s Law', 'Capacitance & Dielectrics', 'Magnetic Induction'],
                createdAt: new Date().toISOString()
            },
            {
                id: uuidv4(),
                userId: studentId,
                name: 'Modern World History',
                code: 'HIST-105',
                color: '#78716C', // Stone Neutral
                targetHoursPerWeek: 3,
                topics: ['Industrial Revolution', 'World War I Alliances', 'The Cold War Era'],
                createdAt: new Date().toISOString()
            }
        ];
        subjects.forEach(s => db.addSubject(s));
        // Seed Study Sessions
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const twoDaysAgo = new Date(now);
        twoDaysAgo.setDate(now.getDate() - 2);
        const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        const sessions = [
            {
                id: uuidv4(),
                userId: studentId,
                subjectId: subjects[0].id,
                subjectName: subjects[0].name,
                topic: 'Partial Derivatives & Chain Rule',
                date: twoDaysAgoStr,
                startTime: '10:00',
                endTime: '11:30',
                durationMinutes: 90,
                actualMinutesCompleted: 90,
                priority: 'high',
                status: 'completed',
                completedAt: `${twoDaysAgoStr}T11:30:00Z`,
                createdAt: new Date().toISOString()
            },
            {
                id: uuidv4(),
                userId: studentId,
                subjectId: subjects[1].id,
                subjectName: subjects[1].name,
                topic: 'Graph BFS and DFS Implementation',
                date: yesterdayStr,
                startTime: '14:00',
                endTime: '15:30',
                durationMinutes: 90,
                actualMinutesCompleted: 90,
                priority: 'urgent',
                status: 'completed',
                completedAt: `${yesterdayStr}T15:30:00Z`,
                createdAt: new Date().toISOString()
            },
            {
                id: uuidv4(),
                userId: studentId,
                subjectId: subjects[0].id,
                subjectName: subjects[0].name,
                topic: 'Double Integrals in Polar Coordinates',
                date: todayStr,
                startTime: '09:00',
                endTime: '10:30',
                durationMinutes: 90,
                actualMinutesCompleted: 90,
                priority: 'high',
                status: 'completed',
                completedAt: `${todayStr}T10:30:00Z`,
                createdAt: new Date().toISOString()
            },
            {
                id: uuidv4(),
                userId: studentId,
                subjectId: subjects[2].id,
                subjectName: subjects[2].name,
                topic: 'Electric Potential & Gauss Law Problem Sets',
                date: todayStr,
                startTime: '16:00',
                endTime: '17:30',
                durationMinutes: 90,
                actualMinutesCompleted: 0,
                priority: 'medium',
                status: 'scheduled',
                createdAt: new Date().toISOString()
            },
            {
                id: uuidv4(),
                userId: studentId,
                subjectId: subjects[1].id,
                subjectName: subjects[1].name,
                topic: 'Dijkstra Shortest Path Algorithm',
                date: tomorrowStr,
                startTime: '11:00',
                endTime: '12:30',
                durationMinutes: 90,
                actualMinutesCompleted: 0,
                priority: 'high',
                status: 'scheduled',
                createdAt: new Date().toISOString()
            }
        ];
        sessions.forEach(s => db.addStudySession(s));
        // Seed Assignments
        const inThreeDays = new Date(now);
        inThreeDays.setDate(now.getDate() + 3);
        const inThreeDaysStr = inThreeDays.toISOString().split('T')[0];
        const inFiveDays = new Date(now);
        inFiveDays.setDate(now.getDate() + 5);
        const inFiveDaysStr = inFiveDays.toISOString().split('T')[0];
        const assignments = [
            {
                id: uuidv4(),
                userId: studentId,
                subjectId: subjects[0].id,
                subjectName: subjects[0].name,
                title: 'Problem Set 4: Multivariable Integrals',
                description: 'Complete textbook exercises 14.1 through 14.4. Show all integration step derivations.',
                dueDate: inThreeDaysStr,
                dueTime: '23:59',
                priority: 'urgent',
                status: 'in_progress',
                notes: 'Need to review polar coordinate transformations first.',
                createdAt: new Date().toISOString()
            },
            {
                id: uuidv4(),
                userId: studentId,
                subjectId: subjects[1].id,
                subjectName: subjects[1].name,
                title: 'Programming Assignment 2: Graph Pathfinding',
                description: 'Implement A* search and Dijkstra algorithm on a city grid. Submit via GitHub repository.',
                dueDate: inFiveDaysStr,
                dueTime: '17:00',
                priority: 'high',
                status: 'not_started',
                links: ['https://cs-portal.university.edu/assignments/2'],
                createdAt: new Date().toISOString()
            },
            {
                id: uuidv4(),
                userId: studentId,
                subjectId: subjects[3].id,
                subjectName: subjects[3].name,
                title: 'Cold War Primary Source Analysis Essay',
                description: '1,500 word critical essay comparing diplomatic memos from the 1962 missile crisis.',
                dueDate: twoDaysAgoStr,
                dueTime: '23:59',
                priority: 'medium',
                status: 'completed',
                completedAt: `${twoDaysAgoStr}T21:00:00Z`,
                createdAt: new Date().toISOString()
            }
        ];
        assignments.forEach(a => db.addAssignment(a));
        // Seed Goals
        const goals = [
            {
                id: uuidv4(),
                userId: studentId,
                title: 'Achieve Grade A in Calculus III Midterm',
                subjectId: subjects[0].id,
                subjectName: subjects[0].name,
                targetDate: inFiveDaysStr,
                category: 'grade',
                targetValue: 95,
                currentValue: 88,
                unit: '%',
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: uuidv4(),
                userId: studentId,
                title: 'Complete 50 LeetCode Medium Graph Problems',
                subjectId: subjects[1].id,
                subjectName: subjects[1].name,
                targetDate: inFiveDaysStr,
                category: 'milestone',
                targetValue: 50,
                currentValue: 32,
                unit: 'problems',
                completed: false,
                createdAt: new Date().toISOString()
            }
        ];
        goals.forEach(g => db.addGoal(g));
        // Seed Reminders
        const reminders = [
            {
                id: uuidv4(),
                userId: studentId,
                title: 'Review Calculus Formula Sheet for Quiz',
                dateTime: `${todayStr}T18:00:00`,
                type: 'revision',
                isCompleted: false,
                isDismissed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: uuidv4(),
                userId: studentId,
                title: 'Submit Lab Report for Physics II',
                dateTime: `${tomorrowStr}T14:00:00`,
                type: 'assignment',
                isCompleted: false,
                isDismissed: false,
                createdAt: new Date().toISOString()
            }
        ];
        reminders.forEach(r => db.addReminder(r));
        // Seed Notifications
        const notifications = [
            {
                id: uuidv4(),
                userId: studentId,
                title: 'Welcome to AI Study Manager!',
                message: 'Your personal academic workspace is ready. Explore your timetable, track assignments, and ask the AI Tutor any subject question.',
                type: 'info',
                isRead: false,
                createdAt: new Date().toISOString()
            },
            {
                id: uuidv4(),
                userId: studentId,
                title: 'Upcoming Assignment Deadline',
                message: 'Problem Set 4: Multivariable Integrals is due in 3 days.',
                type: 'warning',
                link: '/assignments',
                isRead: false,
                createdAt: new Date().toISOString()
            }
        ];
        notifications.forEach(n => db.addNotification(n));
        console.log('[Seed] Seeded subjects, sessions, assignments, goals, reminders, and notifications.');
    }
    db.flushSync();
}
// If run directly: `node dist/seed.js` or `tsx seed.ts`
if (process.argv[1] && (process.argv[1].endsWith('seed.ts') || process.argv[1].endsWith('seed.js'))) {
    seedDatabase().then(() => {
        console.log('[Seed] Seeding finished successfully.');
        process.exit(0);
    });
}
