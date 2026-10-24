import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { AcademicPredictionReport, SubjectPrediction } from '../../types/index.js';
import {
  Sparkles,
  TrendingUp,
  Target,
  AlertCircle,
  CheckCircle2,
  Clock,
  BookOpen,
  RefreshCw,
  Sliders,
  Award,
  ChevronRight,
  Flame,
  ArrowUpRight
} from '../../icons.js';

export const AiPredictor: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<AcademicPredictionReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Simulation controls state
  const [simulatedHours, setSimulatedHours] = useState<number>(0);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [earlyAssignmentBoost, setEarlyAssignmentBoost] = useState<boolean>(false);
  const [simulating, setSimulating] = useState(false);
  const [baselineReadiness, setBaselineReadiness] = useState<number | null>(null);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAiPredictions();
      setReport(res.report);
      if (baselineReadiness === null) {
        setBaselineReadiness(res.report.overallReadinessPercentage);
      }
    } catch (err: any) {
      console.error('[AiPredictor] Fetch error:', err);
      setError(err.message || 'Failed to load predictive model.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  const handleRunSimulation = async () => {
    try {
      setSimulating(true);
      setError(null);
      const res = await api.runPredictionSimulation({
        addedHoursPerWeek: simulatedHours,
        targetedSubjectId: selectedSubjectId === 'all' ? undefined : selectedSubjectId,
        assignmentEarlyBoost: earlyAssignmentBoost
      });
      setReport(res.report);
    } catch (err: any) {
      console.error('[AiPredictor] Simulation error:', err);
      setError('Failed to run simulation. Please retry.');
    } finally {
      setSimulating(false);
    }
  };

  const handleResetSimulation = () => {
    setSimulatedHours(0);
    setSelectedSubjectId('all');
    setEarlyAssignmentBoost(false);
    fetchPredictions();
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8">
        <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-medium text-gray-700">Running AI academic predictive engine...</p>
        <p className="text-xs text-gray-400 mt-1">Analyzing historical velocity, session depth, and syllabus coverage</p>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center">
        <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-3">
          <AlertCircle size={24} />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Predictive Engine Unavailable</h2>
        <p className="text-sm text-gray-600 mt-1 mb-4">{error}</p>
        <button
          onClick={fetchPredictions}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm rounded-lg shadow-sm transition"
        >
          Retry Calculation
        </button>
      </div>
    );
  }

  const overallScore = report?.overallReadinessPercentage || 0;
  const delta = baselineReadiness !== null ? overallScore - baselineReadiness : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-orange-100 text-orange-800 rounded-full">
              AI Predictive Engine
            </span>
            <span className="text-xs text-gray-500">Live Data Synchronized</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Academic & Exam Success Predictor</h1>
          <p className="text-sm text-gray-600 mt-0.5">
            Statistical forecasting predicting your final exam scores, mastery probability, and assignment completion velocity.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchPredictions}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Recalculate Baseline</span>
          </button>
        </div>
      </div>

      {/* Main KPI Scorecards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Overall Readiness */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Exam Preparedness</span>
            <span className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <Award size={18} />
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-extrabold text-gray-900">{overallScore}%</span>
            {delta !== 0 && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${delta > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {delta > 0 ? `+${delta}%` : `${delta}%`}
              </span>
            )}
          </div>
          <div className="mt-3">
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${overallScore}%` }}
              ></div>
            </div>
          </div>
          <p className="text-xs font-medium text-gray-600 mt-2.5 flex items-center justify-between">
            <span>Projection:</span>
            <span className="font-bold text-gray-900">{report?.projectedGpaEquivalent}</span>
          </p>
        </div>

        {/* Card 2: Readiness Status */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Readiness Status</span>
            <span className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <Target size={18} />
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {report?.examReadinessStatus}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {report?.examReadinessStatus === 'Exam Ready'
              ? 'Excellent performance trajectory across all subjects.'
              : report?.examReadinessStatus === 'On Track'
              ? 'Steady progress. Maintaining study rhythm ensures target grades.'
              : 'Targeted study interventions recommended to avoid score dips.'}
          </p>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-gray-500">Trajectory:</span>
            <span className="font-semibold text-orange-600 capitalize">
              {report?.projectedVelocity?.completionVelocityTrend || 'Steady'}
            </span>
          </div>
        </div>

        {/* Card 3: On-Time Likelihood */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">On-Time Submissions</span>
            <span className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <CheckCircle2 size={18} />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-gray-900">
            {report?.onTimeAssignmentProbability}%
          </div>
          <div className="mt-3">
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${report?.onTimeAssignmentProbability || 0}%` }}
              ></div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2.5">
            Probability of submitting upcoming deadlines without late penalties.
          </p>
        </div>

        {/* Card 4: Study Consistency & Fatigue Index */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Consistency & Fatigue</span>
            <span className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <Flame size={18} />
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-gray-900">{report?.studyConsistencyScore}% Consistency</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-gray-500">Fatigue Index:</span>
            <span className="font-semibold text-gray-800">{report?.burnoutRiskPercentage}% ({report?.burnoutStatus})</span>
          </div>
          <div className="mt-2 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full ${
                (report?.burnoutRiskPercentage || 0) > 60 ? 'bg-red-500' : (report?.burnoutRiskPercentage || 0) > 35 ? 'bg-orange-400' : 'bg-green-500'
              }`}
              style={{ width: `${report?.burnoutRiskPercentage || 0}%` }}
            ></div>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Pacing is optimized for long-term retention.</p>
        </div>
      </div>

      {/* Interactive "What-If" Predictive Simulator */}
      <div className="bg-gradient-to-br from-orange-500/5 via-white to-orange-500/10 p-6 rounded-2xl border border-orange-200/80 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shadow-sm">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">"What-If" Predictive Scenario Simulator</h2>
              <p className="text-xs text-gray-600">
                Adjust simulated study hours or focus areas to see how your predicted exam grades dynamically respond.
              </p>
            </div>
          </div>
          {(simulatedHours > 0 || selectedSubjectId !== 'all' || earlyAssignmentBoost) && (
            <button
              onClick={handleResetSimulation}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 underline"
            >
              Reset to Actuals
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          {/* Slider: Extra Weekly Study Hours */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-2">
              <span>Extra Study Hours / Week</span>
              <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded font-bold">
                +{simulatedHours} hrs/wk
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="12"
              step="1"
              value={simulatedHours}
              onChange={(e) => setSimulatedHours(Number(e.target.value))}
              className="w-full accent-orange-500 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-gray-400 mt-1">
              <span>Current</span>
              <span>+6 hrs</span>
              <span>+12 hrs</span>
            </div>
          </div>

          {/* Select: Targeted Focus Subject */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Targeted Focus Subject
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full text-xs font-medium border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            >
              <option value="all">Distribute across all subjects</option>
              {report?.subjectPredictions.map((s) => (
                <option key={s.subjectId} value={s.subjectId}>
                  {s.subjectName} (Currently {s.predictedScore}%)
                </option>
              ))}
            </select>
            <p className="text-[11px] text-gray-400 mt-1.5">Focus simulated hours into your highest-priority syllabus.</p>
          </div>

          {/* Toggle: Assignment Completion Boost */}
          <div className="flex flex-col justify-between">
            <span className="block text-xs font-semibold text-gray-700 mb-2">
              Coursework Acceleration
            </span>
            <label className="flex items-center space-x-2.5 cursor-pointer p-2 rounded-lg hover:bg-gray-50 border border-gray-100">
              <input
                type="checkbox"
                checked={earlyAssignmentBoost}
                onChange={(e) => setEarlyAssignmentBoost(e.target.checked)}
                className="w-4 h-4 accent-orange-500 rounded text-orange-500 focus:ring-orange-400"
              />
              <span className="text-xs text-gray-700 font-medium">
                Simulate completing assignments 48h early
              </span>
            </label>
            <button
              onClick={handleRunSimulation}
              disabled={simulating}
              className="mt-2 w-full py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-sm transition flex items-center justify-center space-x-1.5"
            >
              {simulating ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Simulating...</span>
                </>
              ) : (
                <>
                  <Sparkles size={13} />
                  <span>Apply Simulation</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Per-Subject Predictions Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Predicted Subject Grades & Mastery</h2>
            <p className="text-xs text-gray-500">
              Forecasted grades based on syllabus hours logged, assignment track record, and review frequency.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {report?.subjectPredictions.map((sub) => {
            const isHighRisk = sub.riskStatus === 'high_risk';
            const isModerate = sub.riskStatus === 'moderate_risk';

            return (
              <div
                key={sub.subjectId}
                className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-orange-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: sub.color }}
                        ></span>
                        <h3 className="text-sm font-bold text-gray-900">{sub.subjectName}</h3>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Logged: <strong className="text-gray-800">{sub.actualHoursSpent}h</strong> / Target: {sub.targetHours}h/wk
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-2xl font-black text-gray-900">{sub.predictedScore}%</span>
                      <span className="block text-xs font-bold text-orange-600">Grade: {sub.letterGrade}</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs font-medium text-gray-500 mb-1">
                      <span>Concept Mastery</span>
                      <span className="text-gray-900 font-bold">{sub.masteryPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${sub.masteryPercentage}%`,
                          backgroundColor: sub.color || '#F97316'
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Risk Badge */}
                  <div className="mt-3">
                    <span
                      className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        isHighRisk
                          ? 'bg-red-100 text-red-700'
                          : isModerate
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {isHighRisk ? 'Intervention Needed' : isModerate ? 'Moderate Attention' : 'High Mastery Track'}
                    </span>
                  </div>
                </div>

                {/* AI Recommendation */}
                <div className="mt-4 pt-3 border-t border-gray-100 bg-gray-50/70 p-2.5 rounded-lg">
                  <p className="text-xs text-gray-700 leading-relaxed">
                    <span className="font-semibold text-orange-600">AI Advice: </span>
                    {sub.recommendation}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Strategic Insights & Actionable Steps */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <span className="p-1.5 bg-orange-100 text-orange-700 rounded-md">
            <TrendingUp size={18} />
          </span>
          <h2 className="text-base font-bold text-gray-900">AI Strategic Insights & Exam Recommendations</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report?.insights.map((insight) => (
            <div
              key={insight.id}
              className={`p-4 rounded-xl border ${
                insight.type === 'warning'
                  ? 'border-red-200 bg-red-50/40'
                  : insight.type === 'achievement'
                  ? 'border-green-200 bg-green-50/40'
                  : 'border-orange-200 bg-orange-50/30'
              }`}
            >
              <div className="flex items-start justify-between">
                <h3 className="text-xs font-bold text-gray-900">{insight.title}</h3>
                <span
                  className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                    insight.impactScorePercent > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {insight.impactScorePercent > 0 ? `+${insight.impactScorePercent}% Impact` : `${insight.impactScorePercent}% Impact`}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{insight.description}</p>
              <div className="mt-3 pt-2.5 border-t border-gray-200/60 flex items-center space-x-1.5 text-xs font-semibold text-gray-900">
                <span className="text-orange-600 font-bold">Action:</span>
                <span>{insight.actionableStep}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
