import dotenv from 'dotenv';
dotenv.config();
export class AiService {
    getGeminiKey() {
        return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    }
    getOpenAiKey() {
        return process.env.OPENAI_API_KEY;
    }
    isConfigured() {
        return Boolean(this.getGeminiKey() || this.getOpenAiKey());
    }
    getStatus() {
        const geminiKey = this.getGeminiKey();
        const openaiKey = this.getOpenAiKey();
        return {
            configured: Boolean(geminiKey || openaiKey),
            primaryProvider: geminiKey ? 'Gemini' : openaiKey ? 'OpenAI-compatible' : 'None',
            geminiConfigured: Boolean(geminiKey),
            openaiConfigured: Boolean(openaiKey),
            model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
        };
    }
    /**
     * Generates response for AI Tutor
     */
    async generateTutorResponse(params) {
        const { history, userPrompt, mode, subjectName, gradeLevel } = params;
        const geminiKey = this.getGeminiKey();
        const openaiKey = this.getOpenAiKey();
        if (!geminiKey && !openaiKey) {
            throw new Error('AI Provider is not configured. Please set GEMINI_API_KEY (or OPENAI_API_KEY) in your .env file to enable live AI tutor interactions.');
        }
        // Build system instruction tailored to academic learning
        let systemInstruction = `You are the AI Academic Tutor in "AI Study Manager".
Your mission is to help students truly master their subjects with clarity, precision, encouragement, and academic rigor.
Target Student Level: ${gradeLevel || 'Secondary / College / University'}.
Subject Focus: ${subjectName || 'General Academic Curriculum'}.
Mode: ${mode}.

Instructions based on mode:
- If mode is "step_by_step": Break down complex mathematical proofs, scientific processes, or historical concepts into numbered, bite-sized steps with clear transitions and "Why this matters" insights.
- If mode is "summary": Create structured, bulleted revision summaries, key definitions, important formulas/dates, and memory mnemonics.
- If mode is "exam_prep": Highlight high-yield exam topics, common traps/mistakes students make, and model exam answers.
- If mode is "quiz": In addition to an encouraging overview, you MUST generate 3 to 5 high-quality multiple choice questions formatted as strict JSON at the very end of your response inside a \`\`\`json\`\`\` block. Format:
{
  "title": "Quiz Title",
  "questions": [
    {
      "id": 1,
      "question": "Question text?",
      "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
      "correctIndex": 0,
      "explanation": "Why option 1 is correct."
    }
  ]
}
- Always remain friendly, supportive, and academically accurate. Never fabricate information.`;
        if (geminiKey) {
            return this.callGemini({
                apiKey: geminiKey,
                systemInstruction,
                history,
                userPrompt,
                mode
            });
        }
        else {
            return this.callOpenAiCompatible({
                apiKey: openaiKey,
                systemInstruction,
                history,
                userPrompt,
                mode
            });
        }
    }
    /**
     * Generates intelligent study plan based on student input
     */
    async generateStudyPlan(params) {
        const geminiKey = this.getGeminiKey();
        const openaiKey = this.getOpenAiKey();
        if (!geminiKey && !openaiKey) {
            throw new Error('AI Provider is not configured. Please set GEMINI_API_KEY (or OPENAI_API_KEY) in your .env file to generate AI study plans.');
        }
        const prompt = `Act as an expert academic scheduler and study planner.
Generate a realistic, balanced, and productive study plan based on the following student parameters:
- Available study hours per day: ${params.availableHoursPerDay} hours
- Date range: ${params.startDate} to ${params.endDate}
- Subjects & Topics: ${JSON.stringify(params.subjects, null, 2)}
- Upcoming Exams: ${JSON.stringify(params.examDates || [], null, 2)}
- Identified Weak Areas: ${JSON.stringify(params.weakAreas || [], null, 2)}
- Preferred Start Time: ${params.dailyStudyPreferences?.preferredStartTime || '09:00'}

CRITICAL RULES:
1. Do not schedule impossible or overlapping sessions.
2. Provide sessions between 45 to 90 minutes with logical subject rotation.
3. Prioritize subjects with upcoming exams or flagged as weak areas.
4. Schedule active recall and revision blocks before exams.
5. Return your answer ONLY as a valid JSON object matching this schema:
{
  "summary": "Brief encouraging overview of the strategic plan",
  "reasoning": "Explanation of how sessions were distributed and prioritized",
  "sessions": [
    {
      "subjectName": "Exact subject name from input",
      "topic": "Specific topic to cover",
      "date": "YYYY-MM-DD",
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "durationMinutes": 60,
      "priority": "low" | "medium" | "high" | "urgent",
      "reasoning": "Why this session is placed here"
    }
  ]
}`;
        let rawResponse = '';
        if (geminiKey) {
            const res = await this.callGemini({
                apiKey: geminiKey,
                systemInstruction: 'You are an expert AI academic schedule planner. Respond in strict JSON format.',
                history: [],
                userPrompt: prompt,
                mode: 'general'
            });
            rawResponse = res.content;
        }
        else {
            const res = await this.callOpenAiCompatible({
                apiKey: openaiKey,
                systemInstruction: 'You are an expert AI academic schedule planner. Respond in strict JSON format.',
                history: [],
                userPrompt: prompt,
                mode: 'general'
            });
            rawResponse = res.content;
        }
        // Parse JSON
        try {
            const jsonMatch = rawResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, rawResponse];
            const parsed = JSON.parse(jsonMatch[1] || rawResponse);
            return {
                summary: parsed.summary || 'AI-generated personalized academic timetable',
                reasoning: parsed.reasoning || 'Sessions balanced across key subjects and examination milestones.',
                plan: Array.isArray(parsed.sessions) ? parsed.sessions : []
            };
        }
        catch (e) {
            console.error('[AI Plan] JSON parse error from raw response:', rawResponse);
            throw new Error('AI returned an invalid plan structure. Please try generating again.');
        }
    }
    /**
     * Gemini API Call using modern fetch to Google Gemini REST endpoints
     */
    async callGemini(options) {
        const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${options.apiKey}`;
        const contents = [];
        // Add conversation history
        for (const msg of options.history.slice(-8)) {
            contents.push({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            });
        }
        // Add current user prompt
        contents.push({
            role: 'user',
            parts: [{ text: options.userPrompt }]
        });
        const body = {
            system_instruction: {
                parts: [{ text: options.systemInstruction }]
            },
            contents,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048,
            }
        };
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `Gemini API returned status ${response.status}`;
            try {
                const errObj = JSON.parse(errorText);
                if (errObj.error?.message) {
                    errorMessage = errObj.error.message;
                }
            }
            catch (_) { }
            throw new Error(`Gemini API Error: ${errorMessage}`);
        }
        const data = (await response.json());
        const candidate = data.candidates?.[0];
        const rawText = candidate?.content?.parts?.[0]?.text || '';
        // Extract quiz if mode is quiz
        let quizData = undefined;
        let cleanContent = rawText;
        if (options.mode === 'quiz' || rawText.includes('"questions"')) {
            const jsonBlock = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (jsonBlock) {
                try {
                    const parsed = JSON.parse(jsonBlock[1]);
                    if (parsed && Array.isArray(parsed.questions)) {
                        quizData = parsed;
                        cleanContent = rawText.replace(jsonBlock[0], '').trim();
                    }
                }
                catch (_) { }
            }
        }
        return {
            content: cleanContent || rawText,
            quizData,
            provider: 'gemini',
            modelUsed: model
        };
    }
    /**
     * OpenAI Compatible API Call
     */
    async callOpenAiCompatible(options) {
        const baseUrl = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';
        const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
        const messages = [
            { role: 'system', content: options.systemInstruction },
            ...options.history.slice(-8).map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: options.userPrompt }
        ];
        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${options.apiKey}`
            },
            body: JSON.stringify({
                model,
                messages,
                temperature: 0.7,
                max_tokens: 2048
            })
        });
        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `OpenAI API returned status ${response.status}`;
            try {
                const errObj = JSON.parse(errorText);
                if (errObj.error?.message) {
                    errorMessage = errObj.error.message;
                }
            }
            catch (_) { }
            throw new Error(`OpenAI API Error: ${errorMessage}`);
        }
        const data = (await response.json());
        const rawText = data.choices?.[0]?.message?.content || '';
        let quizData = undefined;
        let cleanContent = rawText;
        if (options.mode === 'quiz' || rawText.includes('"questions"')) {
            const jsonBlock = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (jsonBlock) {
                try {
                    const parsed = JSON.parse(jsonBlock[1]);
                    if (parsed && Array.isArray(parsed.questions)) {
                        quizData = parsed;
                        cleanContent = rawText.replace(jsonBlock[0], '').trim();
                    }
                }
                catch (_) { }
            }
        }
        return {
            content: cleanContent || rawText,
            quizData,
            provider: 'openai',
            modelUsed: model
        };
    }
    /**
     * Generates comprehensive Academic & Exam Success Predictions
     */
    async generatePredictions(params) {
        const { subjects, sessions, assignments, goals, currentStreak, weeklyGoalHours, simulationOverrides } = params;
        const completedSessions = sessions.filter(s => s.status === 'completed');
        const totalMinutesStudied = completedSessions.reduce((acc, s) => acc + (s.actualMinutesCompleted || s.durationMinutes || 0), 0);
        const totalHoursStudied = totalMinutesStudied / 60;
        const completedAssignments = assignments.filter(a => a.status === 'completed').length;
        const totalAssignments = assignments.length;
        const assignmentRate = totalAssignments > 0 ? (completedAssignments / totalAssignments) : 0.8;
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const overdueAssignments = assignments.filter(a => a.status !== 'completed' && a.dueDate < todayStr).length;
        // Simulation adjustments
        const addedWeeklyHours = Number(simulationOverrides?.addedHoursPerWeek) || 0;
        const targetedSubjectId = simulationOverrides?.targetedSubjectId;
        const assignmentBoost = simulationOverrides?.assignmentEarlyBoost ? 0.1 : 0;
        // Per-subject calculations
        const subjectPredictions = subjects.map(sub => {
            const subSessions = completedSessions.filter(s => (s.subjectName || '').toLowerCase() === sub.name.toLowerCase());
            const subMinutes = subSessions.reduce((acc, s) => acc + (s.actualMinutesCompleted || s.durationMinutes || 0), 0);
            let actualHours = Math.round((subMinutes / 60) * 10) / 10;
            if (targetedSubjectId && targetedSubjectId === sub.id) {
                actualHours += addedWeeklyHours;
            }
            else if (!targetedSubjectId && addedWeeklyHours > 0) {
                actualHours += Math.round((addedWeeklyHours / Math.max(1, subjects.length)) * 10) / 10;
            }
            const targetHours = sub.targetHoursPerWeek || 3;
            const hoursRatio = targetHours > 0 ? (actualHours / targetHours) : 1;
            const subAssignments = assignments.filter(a => (a.subjectName || '').toLowerCase() === sub.name.toLowerCase());
            const subCompletedAssig = subAssignments.filter(a => a.status === 'completed').length;
            const subAssigRate = subAssignments.length > 0 ? (subCompletedAssig / subAssignments.length) : assignmentRate;
            // Base 72 + study bonus + assignment bonus + simulated early boost
            let rawScore = 72 + (Math.min(hoursRatio, 1.6) - 1.0) * 22 + (subAssigRate - 0.5) * 18 + (assignmentBoost * 30);
            if (hoursRatio < 0.5)
                rawScore -= 12;
            if (actualHours >= targetHours)
                rawScore += 4;
            const predictedScore = Math.min(98, Math.max(52, Math.round(rawScore)));
            let letterGrade = 'B';
            if (predictedScore >= 90)
                letterGrade = 'A';
            else if (predictedScore >= 80)
                letterGrade = 'B';
            else if (predictedScore >= 70)
                letterGrade = 'C';
            else if (predictedScore >= 60)
                letterGrade = 'D';
            else
                letterGrade = 'F';
            let riskStatus = 'low_risk';
            if (predictedScore < 70 || hoursRatio < 0.6)
                riskStatus = 'high_risk';
            else if (predictedScore < 82 || hoursRatio < 0.9)
                riskStatus = 'moderate_risk';
            const gapHours = Math.max(0, Math.round((targetHours - actualHours) * 10) / 10);
            let recommendation = `On track with ${actualHours}h logged. Maintain revision sessions.`;
            if (gapHours > 0) {
                recommendation = `Increase study by ${gapHours}h this week to elevate predicted score by +${Math.min(12, Math.round(gapHours * 3.5))}%.`;
            }
            else if (predictedScore >= 90) {
                recommendation = `High mastery (${predictedScore}%). Recommended for advanced practice & mock tests.`;
            }
            return {
                subjectId: sub.id,
                subjectName: sub.name,
                color: sub.color || '#F97316',
                predictedScore,
                letterGrade,
                masteryPercentage: Math.min(99, Math.max(45, predictedScore - 2)),
                riskStatus,
                actualHoursSpent: actualHours,
                targetHours,
                gapHours,
                recommendation
            };
        });
        // Overall readiness score (weighted average)
        const avgSubjectScore = subjectPredictions.length > 0
            ? subjectPredictions.reduce((acc, s) => acc + s.predictedScore, 0) / subjectPredictions.length
            : 78;
        const streakBonus = Math.min(6, currentStreak * 1.5);
        const overduePenalty = overdueAssignments * 4;
        const overallReadinessPercentage = Math.min(99, Math.max(40, Math.round(avgSubjectScore * 0.7 + (assignmentRate + assignmentBoost) * 20 + streakBonus - overduePenalty)));
        let examReadinessStatus = 'On Track';
        if (overallReadinessPercentage >= 88)
            examReadinessStatus = 'Exam Ready';
        else if (overallReadinessPercentage >= 78)
            examReadinessStatus = 'On Track';
        else if (overallReadinessPercentage >= 65)
            examReadinessStatus = 'Needs Attention';
        else
            examReadinessStatus = 'Critical Intervention';
        let projectedGpaEquivalent = '3.5 / 4.0 (Honor Roll Track)';
        if (overallReadinessPercentage >= 92)
            projectedGpaEquivalent = '3.9 / 4.0 (Summa Cum Laude)';
        else if (overallReadinessPercentage >= 85)
            projectedGpaEquivalent = '3.7 / 4.0 (Magna Cum Laude)';
        else if (overallReadinessPercentage >= 75)
            projectedGpaEquivalent = '3.2 / 4.0 (Solid Passing)';
        else
            projectedGpaEquivalent = '2.6 / 4.0 (Academic Warning)';
        const onTimeAssignmentProbability = Math.min(99, Math.max(35, Math.round((assignmentRate + assignmentBoost) * 100 - overdueAssignments * 8)));
        const studyConsistencyScore = Math.min(98, Math.max(40, Math.round(55 + Math.min(30, currentStreak * 8) + (totalHoursStudied >= weeklyGoalHours ? 15 : 0))));
        const weeklyHours = totalHoursStudied + addedWeeklyHours;
        let burnoutRiskPercentage = 18;
        let burnoutStatus = 'Optimal';
        if (weeklyHours > 30) {
            burnoutRiskPercentage = 78;
            burnoutStatus = 'High Risk';
        }
        else if (weeklyHours > 20) {
            burnoutRiskPercentage = 44;
            burnoutStatus = 'Mild Fatigue';
        }
        // Strategic Insights
        const insights = [];
        const weakestSubject = [...subjectPredictions].sort((a, b) => a.predictedScore - b.predictedScore)[0];
        if (weakestSubject && weakestSubject.predictedScore < 85) {
            insights.push({
                id: 'weakest_area',
                type: 'warning',
                title: `${weakestSubject.subjectName} Requires Targeted Focus`,
                description: `Current predicted performance is ${weakestSubject.predictedScore}% (${weakestSubject.letterGrade}). Closing the ${weakestSubject.gapHours}h gap will push this subject into the A/B range.`,
                impactScorePercent: Math.min(14, Math.round(weakestSubject.gapHours * 3 + 4)),
                actionableStep: `Schedule an extra ${Math.max(1, weakestSubject.gapHours)} hour study block for ${weakestSubject.subjectName} before the weekend.`
            });
        }
        if (currentStreak >= 3) {
            insights.push({
                id: 'streak_momentum',
                type: 'achievement',
                title: `Positive Momentum: ${currentStreak}-Day Study Streak`,
                description: `Your consistency is accelerating knowledge retention by an estimated +8% compared to sporadic study habits.`,
                impactScorePercent: 8,
                actionableStep: `Complete at least one 30-minute session tomorrow to maintain compounding memory gains.`
            });
        }
        if (overdueAssignments > 0) {
            insights.push({
                id: 'overdue_alert',
                type: 'warning',
                title: `${overdueAssignments} Overdue Task${overdueAssignments > 1 ? 's' : ''} Lowering Readiness`,
                description: `Overdue submissions create academic debt and reduce overall exam confidence by ~${overdueAssignments * 5}%.`,
                impactScorePercent: -Math.min(15, overdueAssignments * 5),
                actionableStep: `Clear overdue assignments first before starting new study modules.`
            });
        }
        else {
            insights.push({
                id: 'assignment_health',
                type: 'opportunity',
                title: 'Zero Overdue Assignments: Prime Revision Window',
                description: `With all coursework up to date, you have 100% capacity to direct energy into active recall and practice testing.`,
                impactScorePercent: 6,
                actionableStep: 'Dedicate 45 minutes to self-quizzing or flashcard review.'
            });
        }
        return {
            overallReadinessPercentage,
            projectedGpaEquivalent,
            examReadinessStatus,
            onTimeAssignmentProbability,
            studyConsistencyScore,
            burnoutRiskPercentage,
            burnoutStatus,
            subjectPredictions,
            insights,
            projectedVelocity: {
                currentHoursPerWeek: totalHoursStudied,
                recommendedHoursPerWeek: Math.max(weeklyGoalHours, totalHoursStudied + 2),
                completionVelocityTrend: currentStreak >= 3 ? 'accelerating' : 'steady'
            },
            generatedAt: new Date().toISOString()
        };
    }
}
export const aiService = new AiService();
