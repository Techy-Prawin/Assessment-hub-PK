'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, Trash2, Search, Filter, HelpCircle, CheckCircle2, AlertCircle, X, Check, Edit2, BrainCircuit, RefreshCw, Layers, Award, Tag } from 'lucide-react';

interface Question {
  id: string;
  question: string;
  topic: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  options: string[];
  correctAnswer: string;
  explanation: string | null;
  marks: number;
  createdAt: string;
}

interface GeneratedQ {
  question: string;
  topic: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  options: string[];
  correctAnswer: string;
  explanation: string;
  marks: number;
}

const DEFAULT_TOPICS = [
  'Quantitative Aptitude',
  'Logical Reasoning',
  'Verbal Ability',
  'English',
  'General Knowledge',
  'Programming',
  'Data Interpretation',
];

function QuestionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filters
  const [selectedTopic, setSelectedTopic] = useState<string>('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Manual Question Modal state
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    question: '',
    topic: 'Quantitative Aptitude',
    customTopic: '',
    difficulty: 'MEDIUM' as 'EASY' | 'MEDIUM' | 'HARD',
    options: ['', '', '', ''],
    correctOptionIndex: 0,
    explanation: '',
    marks: 1,
  });
  const [savingManual, setSavingManual] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // AI Question Modal state
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiForm, setAiForm] = useState({
    topic: 'Percentage',
    difficulty: 'MEDIUM' as 'EASY' | 'MEDIUM' | 'HARD',
    count: 3,
  });
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiQuestionsPreview, setAiQuestionsPreview] = useState<GeneratedQ[]>([]);
  const [selectedAiIndices, setSelectedAiIndices] = useState<number[]>([]);
  const [savingAI, setSavingAI] = useState(false);

  // Check action parameter on page load
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'ai') {
      setShowAIModal(true);
    } else if (action === 'new') {
      setFormError(null);
      setShowManualModal(true);
    }
  }, [searchParams]);

  // Load questions from backend API
  const loadQuestions = async (topicOverride?: string, diffOverride?: string, searchOverride?: string) => {
    try {
      setLoading(true);
      const activeTopic = topicOverride !== undefined ? topicOverride : selectedTopic;
      const activeDiff = diffOverride !== undefined ? diffOverride : selectedDifficulty;
      const activeSearch = searchOverride !== undefined ? searchOverride : searchQuery;

      const params = new URLSearchParams();
      if (activeTopic !== 'ALL') params.set('topic', activeTopic);
      if (activeDiff !== 'ALL') params.set('difficulty', activeDiff);
      if (activeSearch.trim()) params.set('search', activeSearch.trim());

      const res = await fetch(`/api/questions?${params.toString()}`);
      if (res.status === 401 || res.status === 403) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load questions');
      setQuestions(data.questions || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTopic, selectedDifficulty]);

  // Handle Manual Question Form Submission
  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // 1. Validate Question Text
    if (!manualForm.question.trim() || manualForm.question.trim().length < 5) {
      setFormError('Please enter a clear question statement (at least 5 characters).');
      return;
    }

    // 2. Validate Topic
    const topicToSave =
      manualForm.topic === 'CUSTOM'
        ? manualForm.customTopic.trim() || 'General Knowledge'
        : manualForm.topic;

    if (!topicToSave) {
      setFormError('Please specify a topic or category for this question.');
      return;
    }

    // 3. Validate Options
    const trimmedOptions = manualForm.options.map((opt) => opt.trim());
    if (trimmedOptions.some((opt) => !opt)) {
      setFormError('Please fill out all 4 answer options (A, B, C, and D).');
      return;
    }

    // Check duplicate options
    const uniqueOptions = new Set(trimmedOptions.map((o) => o.toLowerCase()));
    if (uniqueOptions.size < trimmedOptions.length) {
      setFormError('All 4 answer options should be distinct.');
      return;
    }

    // 4. Validate Correct Answer
    const selectedCorrect = trimmedOptions[manualForm.correctOptionIndex];
    if (!selectedCorrect) {
      setFormError('Please select one of the options as the correct answer.');
      return;
    }

    setSavingManual(true);
    try {
      const payload = {
        question: manualForm.question.trim(),
        topic: topicToSave,
        difficulty: manualForm.difficulty,
        options: trimmedOptions,
        correctAnswer: selectedCorrect,
        explanation: manualForm.explanation.trim() || null,
        marks: Math.max(1, Number(manualForm.marks) || 1),
      };

      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save question to database');
      }

      // Close modal
      setShowManualModal(false);

      // Reset form
      setManualForm({
        question: '',
        topic: 'Quantitative Aptitude',
        customTopic: '',
        difficulty: 'MEDIUM',
        options: ['', '', '', ''],
        correctOptionIndex: 0,
        explanation: '',
        marks: 1,
      });

      // Clear filters so the new question is immediately visible at the top
      setSelectedTopic('ALL');
      setSelectedDifficulty('ALL');
      setSearchQuery('');
      await loadQuestions('ALL', 'ALL', '');

      // Show toast
      setSuccessToast(`Question successfully saved to Question Bank! (+${payload.marks} marks)`);
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err: any) {
      setFormError(err.message || 'Error saving question. Please check server logs.');
    } finally {
      setSavingManual(false);
    }
  };

  // Handle AI generation request
  const handleGenerateAI = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneratingAI(true);
    setAiQuestionsPreview([]);
    setSelectedAiIndices([]);

    try {
      const res = await fetch('/api/questions/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate questions');

      const list: GeneratedQ[] = data.questions || [];
      setAiQuestionsPreview(list);
      setSelectedAiIndices(list.map((_, i) => i));
    } catch (err: any) {
      alert(err.message || 'Error generating questions');
    } finally {
      setGeneratingAI(false);
    }
  };

  // Save selected AI questions to Question Bank
  const handleSaveSelectedAI = async () => {
    if (selectedAiIndices.length === 0) {
      alert('Please select at least one question to save.');
      return;
    }

    setSavingAI(true);
    try {
      const questionsToSave = selectedAiIndices.map((i) => aiQuestionsPreview[i]);

      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionsToSave),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save generated questions');

      setShowAIModal(false);
      setAiQuestionsPreview([]);
      setSelectedAiIndices([]);

      setSelectedTopic('ALL');
      setSelectedDifficulty('ALL');
      setSearchQuery('');
      await loadQuestions('ALL', 'ALL', '');

      setSuccessToast(`Saved ${questionsToSave.length} AI-generated questions to the bank!`);
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Error saving questions');
    } finally {
      setSavingAI(false);
    }
  };

  // Delete question
  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question from the bank?')) return;

    try {
      const res = await fetch(`/api/questions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete question');
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      setSuccessToast('Question removed from library.');
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-emerald-500/90 border border-emerald-400 text-white shadow-2xl flex items-center space-x-3 backdrop-blur-md"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-xs font-bold">{successToast}</span>
            <button onClick={() => setSuccessToast(null)} className="p-1 hover:bg-white/20 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Main Primary Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Question Bank</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Create, manage, and curate aptitude questions manually or generate them using AI.
          </p>
        </div>

        {/* Buttons: + Add Question is clearly visible and primary */}
        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setFormError(null);
              setShowManualModal(true);
            }}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 transition border border-emerald-400/40"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Add Question</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAIModal(true)}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition border border-brand-400/30"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>AI Question Studio</span>
          </motion.button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadQuestions()}
            placeholder="Search questions by text or keyword..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500 placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          {/* Topic Select */}
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="bg-slate-900/90 border border-slate-800 text-slate-300 text-xs font-medium rounded-xl py-2 px-3 focus:outline-hidden"
          >
            <option value="ALL">All Categories</option>
            {DEFAULT_TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Difficulty Select */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="bg-slate-900/90 border border-slate-800 text-slate-300 text-xs font-medium rounded-xl py-2 px-3 focus:outline-hidden"
          >
            <option value="ALL">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>

          <button
            onClick={() => loadQuestions()}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-900/60 border border-slate-800 rounded-3xl" />
          ))}
        </div>
      ) : questions.length === 0 ? (
        <div className="glass-panel border border-slate-800 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto">
            <HelpCircle className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-white text-base">No Questions in Question Bank</h3>
          <p className="text-xs text-slate-400">
            {selectedTopic !== 'ALL' || selectedDifficulty !== 'ALL' || searchQuery
              ? 'No questions match the current filter. Try resetting filters or add a new question.'
              : 'Your question bank is empty. Click "+ Add Question" to manually add your first question!'}
          </p>

          <div className="pt-2 flex justify-center gap-2">
            <button
              onClick={() => {
                setFormError(null);
                setShowManualModal(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg"
            >
              + Add Question Manually
            </button>
            {(selectedTopic !== 'ALL' || selectedDifficulty !== 'ALL' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedTopic('ALL');
                  setSelectedDifficulty('ALL');
                  setSearchQuery('');
                  loadQuestions('ALL', 'ALL', '');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono font-semibold text-slate-400">
            <span>Showing {questions.length} questions in bank</span>
            {(selectedTopic !== 'ALL' || selectedDifficulty !== 'ALL' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedTopic('ALL');
                  setSelectedDifficulty('ALL');
                  setSearchQuery('');
                  loadQuestions('ALL', 'ALL', '');
                }}
                className="text-brand-400 hover:underline"
              >
                Clear Filters (Show All)
              </button>
            )}
          </div>

          {questions.map((q, idx) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.3) }}
              className="glass-panel border border-slate-800 rounded-3xl p-6 shadow-xl hover:border-slate-700 transition space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                      #{idx + 1}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-300 border border-brand-500/20">
                      {q.topic}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        q.difficulty === 'EASY'
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                          : q.difficulty === 'MEDIUM'
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                      }`}
                    >
                      {q.difficulty}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      ({q.marks} {q.marks === 1 ? 'mark' : 'marks'})
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-white pt-1 leading-snug">
                    {q.question}
                  </h3>
                </div>

                <button
                  onClick={() => handleDeleteQuestion(q.id)}
                  className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
                  title="Delete question"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {q.options.map((opt, optIndex) => {
                  const isCorrect = opt === q.correctAnswer;
                  return (
                    <div
                      key={optIndex}
                      className={`p-3 rounded-2xl border flex items-center space-x-2 ${
                        isCorrect
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200 font-bold ring-1 ring-emerald-500/30'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span className="text-[11px] font-mono font-bold text-slate-500">
                        {String.fromCharCode(65 + optIndex)}.
                      </span>
                      <span className="flex-1">{opt}</span>
                      {isCorrect && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              {q.explanation && (
                <div className="text-xs text-slate-300 bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl leading-relaxed">
                  <strong className="text-brand-400">Explanation:</strong> {q.explanation}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Manual Question Creation Modal */}
      <AnimatePresence>
        {showManualModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                    <Plus className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">Create Question Manually</h3>
                    <p className="text-xs text-slate-400">
                      Enter question text, 4 options, marks, and select the correct answer.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* In-Modal Error Banner */}
              {formError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSaveManual} className="space-y-5">
                {/* 1. Question Text */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Question Statement <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    value={manualForm.question}
                    onChange={(e) => setManualForm({ ...manualForm, question: e.target.value })}
                    required
                    rows={3}
                    placeholder="e.g. A train running at 72 km/hr crosses a platform 200m long in 20 seconds. What is the length of the train?"
                    className="w-full p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder:text-slate-600"
                  />
                </div>

                {/* 2. Topic & Difficulty & Marks */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Category / Topic
                    </label>
                    <select
                      value={manualForm.topic}
                      onChange={(e) => setManualForm({ ...manualForm, topic: e.target.value })}
                      className="w-full p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    >
                      {DEFAULT_TOPICS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                      <option value="CUSTOM">Custom Topic...</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Difficulty Level
                    </label>
                    <div className="grid grid-cols-3 gap-1 bg-slate-900/90 p-1 border border-slate-800 rounded-xl text-[11px] font-bold">
                      {(['EASY', 'MEDIUM', 'HARD'] as const).map((diff) => (
                        <button
                          key={diff}
                          type="button"
                          onClick={() => setManualForm({ ...manualForm, difficulty: diff })}
                          className={`py-1.5 rounded-lg transition ${
                            manualForm.difficulty === diff
                              ? diff === 'EASY'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : diff === 'MEDIUM'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {diff === 'EASY' ? 'Easy' : diff === 'MEDIUM' ? 'Med' : 'Hard'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Marks
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={manualForm.marks}
                      onChange={(e) => setManualForm({ ...manualForm, marks: Number(e.target.value) })}
                      className="w-full p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>

                {/* If Custom Topic was selected */}
                {manualForm.topic === 'CUSTOM' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Enter Custom Topic Name
                    </label>
                    <input
                      type="text"
                      value={manualForm.customTopic}
                      onChange={(e) => setManualForm({ ...manualForm, customTopic: e.target.value })}
                      placeholder="e.g. Geometry, Financial Mathematics, Data Structures"
                      className="w-full p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}

                {/* 3. 4 Answer Options */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Answer Options & Correct Answer Selector <span className="text-rose-400">*</span>
                    </label>
                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Select radio for correct answer
                    </span>
                  </div>

                  {manualForm.options.map((opt, i) => {
                    const isCorrect = manualForm.correctOptionIndex === i;
                    const letter = String.fromCharCode(65 + i);

                    return (
                      <div
                        key={i}
                        className={`p-2.5 rounded-2xl border transition flex items-center space-x-3 ${
                          isCorrect
                            ? 'bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/30'
                            : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Radio selector */}
                        <div className="flex items-center pl-1">
                          <input
                            type="radio"
                            id={`option-radio-${i}`}
                            name="correctOptionSelector"
                            checked={isCorrect}
                            onChange={() => setManualForm({ ...manualForm, correctOptionIndex: i })}
                            className="w-4 h-4 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                          />
                        </div>

                        {/* Letter badge */}
                        <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                          isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {letter}
                        </span>

                        {/* Input for option text */}
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const next = [...manualForm.options];
                            next[i] = e.target.value;
                            setManualForm({ ...manualForm, options: next });
                          }}
                          required
                          placeholder={`Enter Option ${letter}...`}
                          className="flex-1 p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-600"
                        />

                        {/* Label toggle button */}
                        <button
                          type="button"
                          onClick={() => setManualForm({ ...manualForm, correctOptionIndex: i })}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider transition ${
                            isCorrect
                              ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {isCorrect ? '✓ Correct' : 'Mark Correct'}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* 4. Explanation */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Step-by-Step Explanation / Formula (Optional)
                  </label>
                  <textarea
                    value={manualForm.explanation}
                    onChange={(e) => setManualForm({ ...manualForm, explanation: e.target.value })}
                    rows={2}
                    placeholder="Explain why this answer is correct so candidates learn upon reviewing results..."
                    className="w-full p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-600"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowManualModal(false)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-white rounded-xl"
                  >
                    Cancel
                  </button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={savingManual}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/25 flex items-center space-x-2 border border-emerald-400/30"
                  >
                    {savingManual ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving Question...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Question to Bank</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Question Generation Modal */}
      <AnimatePresence>
        {showAIModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel border border-brand-500/30 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
                    <Sparkles className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">AI Question Studio</h3>
                    <p className="text-xs text-slate-400">
                      Synthesize aptitude MCQs by entering any topic or concept.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAIModal(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Generation Form */}
              <form onSubmit={handleGenerateAI} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Topic / Concept
                  </label>
                  <input
                    type="text"
                    value={aiForm.topic}
                    onChange={(e) => setAiForm({ ...aiForm, topic: e.target.value })}
                    required
                    placeholder="e.g. Percentage, Profit & Loss, Syllogisms"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={aiForm.difficulty}
                    onChange={(e) => setAiForm({ ...aiForm, difficulty: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Question Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={aiForm.count}
                    onChange={(e) => setAiForm({ ...aiForm, count: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>

                <div className="sm:col-span-4 flex justify-end pt-1">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={generatingAI}
                    className="px-5 py-2.5 bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center space-x-2 border border-brand-400/30"
                  >
                    {generatingAI ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                        <span>Synthesizing Questions with AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Generate Questions</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </form>

              {/* Animated AI Thinking State */}
              {generatingAI && (
                <div className="p-8 text-center space-y-3 bg-slate-900/60 border border-brand-500/20 rounded-2xl">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-purple-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-brand-500/30 animate-pulse">
                    <BrainCircuit className="w-6 h-6 text-amber-300" />
                  </div>
                  <h4 className="text-sm font-bold text-white">AI Engine Processing</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Synthesizing realistic options, verifying correct answers, and constructing explanations for &quot;{aiForm.topic}&quot;...
                  </p>
                </div>
              )}

              {/* Generated Preview & Review Area */}
              {aiQuestionsPreview.length > 0 && !generatingAI && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      Review Questions ({selectedAiIndices.length} of {aiQuestionsPreview.length} selected)
                    </span>
                    <div className="flex items-center space-x-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setSelectedAiIndices(aiQuestionsPreview.map((_, i) => i))}
                        className="text-brand-400 hover:underline font-bold"
                      >
                        Select All
                      </button>
                      <span className="text-slate-600">•</span>
                      <button
                        type="button"
                        onClick={() => setSelectedAiIndices([])}
                        className="text-slate-400 hover:underline"
                      >
                        Clear Selection
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto p-1">
                    {aiQuestionsPreview.map((q, idx) => {
                      const isChecked = selectedAiIndices.includes(idx);

                      return (
                        <div
                          key={idx}
                          className={`p-4 rounded-2xl border transition space-y-3 ${
                            isChecked
                              ? 'bg-slate-900/90 border-brand-500/50 ring-1 ring-brand-500/30'
                              : 'bg-slate-900/40 border-slate-800 opacity-50'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedAiIndices([...selectedAiIndices, idx]);
                                else setSelectedAiIndices(selectedAiIndices.filter((i) => i !== idx));
                              }}
                              className="mt-1 w-4 h-4 text-brand-500 rounded-sm focus:ring-brand-500 cursor-pointer"
                            />
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-500/20 text-brand-300">
                                  {q.topic}
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                                  {q.difficulty}
                                </span>
                              </div>
                              <p className="text-sm font-semibold text-white">{q.question}</p>
                            </div>
                          </div>

                          {/* Options */}
                          <div className="grid grid-cols-2 gap-2 text-xs pl-7">
                            {q.options.map((opt, optIndex) => {
                              const isCorrect = opt === q.correctAnswer;
                              return (
                                <div
                                  key={optIndex}
                                  className={`p-2 rounded-xl border text-xs flex items-center justify-between ${
                                    isCorrect
                                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200 font-bold'
                                      : 'bg-slate-950 border-slate-800 text-slate-400'
                                  }`}
                                >
                                  <span>{opt}</span>
                                  {isCorrect && (
                                    <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-bold">
                                      CORRECT
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Explanation */}
                          {q.explanation && (
                            <div className="text-xs text-slate-400 pl-7 leading-relaxed">
                              <span className="font-bold text-slate-300">Explanation:</span> {q.explanation}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowAIModal(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveSelectedAI}
                      disabled={savingAI || selectedAiIndices.length === 0}
                      className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/25 flex items-center space-x-1.5 border border-emerald-400/30"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{savingAI ? 'Saving...' : `Save ${selectedAiIndices.length} Questions to Bank`}</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminQuestionsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading questions studio...</div>}>
      <QuestionsContent />
    </Suspense>
  );
}
