import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api.js';
import {
  TutorConversation,
  TutorMessage,
  TutorMode,
  Subject,
  QuizQuestion
} from '../../types/index.js';
import {
  Sparkles,
  Send,
  Plus,
  Trash2,
  BookOpen,
  MessageSquare,
  HelpCircle,
  FileText,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Lightbulb,
  KeyRound,
  RotateCw
} from 'lucide-react';

export const AiTutor: React.FC = () => {
  const [conversations, setConversations] = useState<TutorConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [currentConversation, setCurrentConversation] = useState<TutorConversation | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [mode, setMode] = useState<TutorMode>('general');

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<any>(null);

  // Interactive Quiz state: map questionId -> selectedOptionIndex
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadInitialData = async () => {
    try {
      const [convData, subjectsData, statusData] = await Promise.all([
        api.getConversations(),
        api.getSubjects(),
        api.getAiStatus()
      ]);
      setConversations(convData.conversations);
      setSubjects(subjectsData.subjects);
      setAiStatus(statusData.status);

      if (convData.conversations.length > 0) {
        loadConversation(convData.conversations[0].id);
      }
    } catch (err) {
      console.error('[AI Tutor] Init error:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadConversation = async (id: string) => {
    setActiveConversationId(id);
    try {
      const data = await api.getConversation(id);
      setCurrentConversation(data.conversation);
      if (data.conversation.mode) setMode(data.conversation.mode);
      if (data.conversation.subjectName) setSelectedSubject(data.conversation.subjectName);
    } catch (_) {}
  };

  const handleStartNewChat = () => {
    setActiveConversationId(null);
    setCurrentConversation(null);
    setInputMessage('');
    setError(null);
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation history?')) return;
    try {
      await api.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConversationId === id) {
        handleStartNewChat();
      }
    } catch (_) {}
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userText = inputMessage.trim();
    setInputMessage('');
    setError(null);
    setLoading(true);

    // Optimistic user message
    const tempUserMsg: TutorMessage = {
      id: 'temp-' + Date.now(),
      conversationId: activeConversationId || 'new',
      role: 'user',
      content: userText,
      createdAt: new Date().toISOString()
    };

    if (currentConversation) {
      setCurrentConversation({
        ...currentConversation,
        messages: [...(currentConversation.messages || []), tempUserMsg]
      });
    }

    try {
      const res = await api.sendTutorMessage({
        conversationId: activeConversationId || undefined,
        message: userText,
        mode,
        subjectName: selectedSubject || undefined
      });

      setActiveConversationId(res.conversationId);
      const convData = await api.getConversation(res.conversationId);
      setCurrentConversation(convData.conversation);

      // Refresh conversations list
      const updatedList = await api.getConversations();
      setConversations(updatedList.conversations);
    } catch (err: any) {
      setError(err.message || 'Failed to send message to AI Tutor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages, loading]);

  const handleSelectQuizAnswer = (qId: number, optionIdx: number) => {
    setQuizAnswers(prev => ({ ...prev, [qId]: optionIdx }));
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6">
      {/* Left Sidebar: Conversations & Mode selector */}
      <div className="w-full md:w-72 bg-white border border-gray-200 rounded-3xl p-4 flex flex-col justify-between shadow-card shrink-0">
        <div className="space-y-4">
          <button
            onClick={handleStartNewChat}
            className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Conversation</span>
          </button>

          {/* Mode Selector */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Tutor Mode
            </label>
            <div className="space-y-1">
              {[
                { id: 'general', label: 'General Q&A', icon: MessageSquare },
                { id: 'step_by_step', label: 'Step-by-Step Breakdown', icon: Lightbulb },
                { id: 'summary', label: 'Revision Summary', icon: FileText },
                { id: 'quiz', label: 'Generate Practice Quiz', icon: HelpCircle },
                { id: 'exam_prep', label: 'Exam High-Yield Prep', icon: GraduationCap },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setMode(item.id as TutorMode)}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
                      mode === item.id
                        ? 'bg-orange-50 text-orange-600 font-semibold border border-orange-200'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subject Focus Selector */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Subject Focus
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full text-xs p-2 bg-white border border-gray-300 rounded-xl text-gray-700"
            >
              <option value="">General Curriculum</option>
              {subjects.map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* History */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Past Chats ({conversations.length})
            </label>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {conversations.length === 0 ? (
                <p className="text-[11px] text-gray-400 py-3 text-center">No past chats</p>
              ) : (
                conversations.map(conv => (
                  <div
                    key={conv.id}
                    onClick={() => loadConversation(conv.id)}
                    className={`group px-3 py-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      activeConversationId === conv.id
                        ? 'bg-gray-100 font-bold text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="truncate flex-1 pr-2">{conv.title}</span>
                    <button
                      onClick={(e) => handleDeleteConversation(conv.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* AI Provider Status Box */}
        <div className="pt-3 border-t border-gray-100 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Provider:</span>
            <span className="font-semibold text-gray-800">{aiStatus?.primaryProvider || 'Gemini'}</span>
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-gray-500">Model:</span>
            <span className="font-mono text-gray-600 text-[10px]">{aiStatus?.model || 'gemini-1.5-flash'}</span>
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 bg-white border border-gray-200 rounded-3xl flex flex-col shadow-card overflow-hidden">
        {/* Top Header of Chat */}
        <div className="px-6 py-3.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-xl bg-orange-500 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-gray-900">
                {currentConversation?.title || 'Academic Tutor Session'}
              </h2>
              <p className="text-[10px] text-gray-500">
                Active Mode: <span className="capitalize font-semibold text-orange-600">{mode.replace('_', ' ')}</span>
                {selectedSubject && ` • Focus: ${selectedSubject}`}
              </p>
            </div>
          </div>
        </div>

        {/* Missing API Key Guidance Banner if not configured */}
        {aiStatus && !aiStatus.configured && (
          <div className="p-3.5 bg-orange-50 border-b border-orange-200 flex items-center justify-between text-xs text-orange-800">
            <div className="flex items-center space-x-2">
              <KeyRound className="w-4 h-4 text-orange-600 shrink-0" />
              <span>
                <strong>Gemini API Key missing:</strong> Add <code className="font-mono bg-orange-100 px-1 py-0.5 rounded text-[11px]">GEMINI_API_KEY=your_key</code> in your <code className="font-mono">.env</code> file to enable live AI responses.
              </span>
            </div>
          </div>
        )}

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!currentConversation || !currentConversation.messages || currentConversation.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
              <div className="w-14 h-14 rounded-3xl bg-orange-50 text-orange-500 flex items-center justify-center mb-3 border border-orange-100 shadow-sm">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">How can I help you study today?</h3>
              <p className="text-xs text-gray-500 max-w-sm mt-1">
                Ask a calculus proof, scientific concept, exam question, or request a customized quiz.
              </p>

              {/* Quick Prompt Starters */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full text-left">
                {[
                  'Explain Green\'s Theorem with an intuitive physical example.',
                  'Create a 3-question practice quiz on Dijkstra algorithm.',
                  'Summarize the core causes of the 1962 Cuban Missile Crisis.',
                  'Step-by-step derivation of Gauss\'s Law for a spherical shell.'
                ].map((starter, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputMessage(starter);
                    }}
                    className="p-3 text-xs bg-gray-50 hover:bg-orange-50 hover:border-orange-200 border border-gray-200 rounded-2xl text-gray-700 transition-colors text-left"
                  >
                    "{starter}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            currentConversation.messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${
                      isUser
                        ? 'bg-gray-900 text-white'
                        : 'bg-orange-500 text-white'
                    }`}
                  >
                    {isUser ? 'You' : <Sparkles className="w-4 h-4" />}
                  </div>

                  <div
                    className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-50 border border-gray-200 text-gray-800'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {/* Interactive Quiz Renderer */}
                    {msg.quizData && msg.quizData.questions && (
                      <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                        <div className="flex items-center space-x-1.5 text-orange-700 font-bold text-xs">
                          <HelpCircle className="w-4 h-4" />
                          <span>{msg.quizData.title || 'Interactive Practice Quiz'}</span>
                        </div>

                        {msg.quizData.questions.map((q: QuizQuestion) => {
                          const selectedIdx = quizAnswers[q.id];
                          const hasAnswered = selectedIdx !== undefined;
                          const isCorrect = selectedIdx === q.correctIndex;

                          return (
                            <div key={q.id} className="p-3.5 bg-white border border-gray-200 rounded-xl space-y-2">
                              <p className="font-semibold text-gray-900">
                                {q.id}. {q.question}
                              </p>

                              <div className="space-y-1.5">
                                {q.options.map((opt, optIdx) => {
                                  let btnStyle = 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-800';
                                  if (hasAnswered) {
                                    if (optIdx === q.correctIndex) {
                                      btnStyle = 'bg-green-50 border-green-300 text-green-800 font-bold';
                                    } else if (optIdx === selectedIdx) {
                                      btnStyle = 'bg-red-50 border-red-300 text-red-800 font-bold';
                                    }
                                  }

                                  return (
                                    <button
                                      key={optIdx}
                                      onClick={() => handleSelectQuizAnswer(q.id, optIdx)}
                                      disabled={hasAnswered}
                                      className={`w-full text-left p-2 rounded-lg border text-xs transition-colors ${btnStyle}`}
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>

                              {hasAnswered && (
                                <div className={`p-2.5 rounded-lg text-[11px] ${isCorrect ? 'bg-green-50 text-green-800' : 'bg-orange-50 text-orange-800'}`}>
                                  <p className="font-semibold">
                                    {isCorrect ? '✓ Correct!' : '✗ Explanation:'}
                                  </p>
                                  <p className="mt-0.5">{q.explanation}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {loading && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs text-gray-500 flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-bounce [animation-delay:0.4s]"></div>
                <span className="ml-2 font-medium">Tutor is analyzing and preparing answer...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Unable to complete request</p>
                <p className="text-[11px] mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-4 bg-gray-50 border-t border-gray-200 flex items-center space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={`Ask a question in ${mode.replace('_', ' ')} mode...`}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-2xl text-xs focus:border-orange-500 focus:ring-1 focus:ring-orange-500 placeholder-gray-400"
          />
          <button
            type="submit"
            disabled={loading || !inputMessage.trim()}
            className="p-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl shadow-xs transition-colors disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
