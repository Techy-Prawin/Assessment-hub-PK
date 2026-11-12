'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle2, AlertTriangle, ArrowLeft, ArrowRight, Save, Send, HelpCircle, ShieldCheck, Check, Sparkles, RefreshCw } from 'lucide-react';

interface Question {
  id: string;
  question: string;
  topic: string;
  difficulty: string;
  marks: number;
  options: string[];
  order: number;
}

interface TestData {
  id: string;
  title: string;
  description: string | null;
  duration: number; // in minutes
  totalMarks: number;
}

export default function AttendTestPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [test, setTest] = useState<TestData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Selected answers map: { [questionId]: optionString }
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Countdown timer state (seconds remaining)
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Submit test function
  const submitTest = useCallback(
    async (isTimeout = false) => {
      if (submitting || !attemptId) return;
      setSubmitting(true);

      try {
        const res = await fetch(`/api/attempts/${attemptId}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to submit test');
        }

        // Redirect to results page
        router.push(`/test/${testId}/result/${attemptId}`);
      } catch (err: any) {
        console.error('Submission error:', err);
        alert(err.message || 'Error submitting test. Please try again.');
        setSubmitting(false);
      }
    },
    [attemptId, answers, router, submitting, testId]
  );

  // Initialize test session
  useEffect(() => {
    let mounted = true;

    async function initTest() {
      try {
        const res = await fetch('/api/attempts/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ testId }),
        });

        if (res.status === 401) {
          router.push('/login');
          return;
        }

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to start test');
        }

        if (mounted) {
          setAttemptId(data.attemptId);
          setTest(data.test);
          setQuestions(data.questions);
          setAnswers(data.savedAnswers || {});

          // Calculate remaining seconds
          const startTime = new Date(data.startedAt).getTime();
          const durationSeconds = data.duration * 60;
          const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
          const remaining = Math.max(0, durationSeconds - elapsedSeconds);

          setTimeLeft(remaining);
        }
      } catch (err: any) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initTest();

    return () => {
      mounted = false;
    };
  }, [testId, router]);

  // Timer interval
  useEffect(() => {
    if (loading || timeLeft <= 0 || !attemptId) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto submit when time expires!
          submitTest(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, timeLeft, attemptId, submitTest]);

  // Auto-save answer to server
  const handleSelectOption = async (qId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: option }));
    setIsSaving(true);

    try {
      if (attemptId) {
        await fetch(`/api/attempts/${attemptId}/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionId: qId, selectedAnswer: option }),
        });
      }
    } catch (err) {
      console.warn('Auto-save error:', err);
    } finally {
      setTimeout(() => setIsSaving(false), 400);
    }
  };

  const handleClearAnswer = async (qId: string) => {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[qId];
      return next;
    });

    if (attemptId) {
      await fetch(`/api/attempts/${attemptId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: qId, selectedAnswer: null }),
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
        <div className="w-14 h-14 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto shadow-lg shadow-brand-500/25" />
        <h2 className="text-xl font-bold text-white tracking-tight">Initializing Assessment Environment...</h2>
        <p className="text-xs text-slate-400">Verifying security token and loading question bank.</p>
      </div>
    );
  }

  if (error || !test || questions.length === 0) {
    return (
      <div className="max-w-md mx-auto my-12 glass-panel border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Assessment Unavailable</h2>
        <p className="text-xs text-slate-400 leading-relaxed">{error || 'Test not found or has no active questions.'}</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-4 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-lg"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;
  const progressPct = Math.round(((currentIndex + 1) / questions.length) * 100);

  // Format time remaining
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isTimeCritical = timeLeft < 180; // less than 3 minutes

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Assessment Header Bar */}
      <div className="glass-panel border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-20 z-40">
        <div className="flex items-center space-x-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">{test.title}</h1>
            <div className="flex items-center space-x-2 text-[11px] text-slate-400">
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <span>•</span>
              <span className="text-slate-500">Auto-save active</span>
              {isSaving ? (
                <span className="text-amber-400 flex items-center gap-1 font-mono">
                  <RefreshCw className="w-3 h-3 animate-spin" /> saving...
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" /> synced
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Live Timer & Submit Button */}
        <div className="flex items-center space-x-3">
          <div
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl border font-mono font-bold text-sm transition shadow-inner ${
              isTimeCritical
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse'
                : 'bg-slate-900/90 border-slate-800 text-emerald-400'
            }`}
          >
            <Clock className={`w-4 h-4 ${isTimeCritical ? 'text-rose-400' : 'text-emerald-400'}`} />
            <span>{timeFormatted}</span>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowConfirmModal(true)}
            disabled={submitting}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg shadow-emerald-600/20 transition border border-emerald-400/30"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Finish Test</span>
          </motion.button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
        <motion.div
          className="bg-gradient-to-r from-brand-500 via-indigo-500 to-purple-500 h-full rounded-full"
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Question Panel (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQ.id}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.25 }}
              className="glass-panel border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
            >
              {/* Question Top Info */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold px-3 py-1 rounded-xl bg-brand-500/20 text-brand-300 border border-brand-500/30 font-mono">
                    QUESTION {currentIndex + 1}
                  </span>
                  <span className="text-xs font-medium text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700/60">
                    {currentQ.topic}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    {currentQ.difficulty}
                  </span>
                </div>
                <div className="text-xs font-mono font-bold text-slate-400">
                  +{currentQ.marks} {currentQ.marks === 1 ? 'Mark' : 'Marks'}
                </div>
              </div>

              {/* Question Text */}
              <div className="text-base sm:text-lg font-semibold text-white leading-relaxed">
                {currentQ.question}
              </div>

              {/* Multiple Choice Options */}
              <div className="space-y-3 pt-2">
                {currentQ.options.map((opt, idx) => {
                  const isSelected = answers[currentQ.id] === opt;
                  const letter = String.fromCharCode(65 + idx); // A, B, C, D

                  return (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.008 }}
                      whileTap={{ scale: 0.995 }}
                      type="button"
                      onClick={() => handleSelectOption(currentQ.id, opt)}
                      className={`w-full text-left p-4 rounded-2xl border transition flex items-start space-x-3.5 relative overflow-hidden ${
                        isSelected
                          ? 'bg-brand-500/20 border-brand-500 ring-2 ring-brand-500/30 shadow-lg shadow-brand-500/20 text-white'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 text-slate-300'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-xl text-xs font-bold flex items-center justify-center shrink-0 transition ${
                          isSelected
                            ? 'bg-brand-500 text-white shadow-md'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {letter}
                      </div>
                      <span className={`text-sm pt-0.5 leading-normal ${isSelected ? 'font-bold text-white' : 'font-medium'}`}>
                        {opt}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Question Navigation Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => handleClearAnswer(currentQ.id)}
                  disabled={!answers[currentQ.id]}
                  className="text-xs font-semibold text-slate-400 hover:text-rose-400 disabled:opacity-0 transition"
                >
                  Clear Selection
                </button>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentIndex === 0}
                    className="px-4 py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/80 text-slate-300 hover:text-white disabled:opacity-30 text-xs font-bold flex items-center space-x-1.5 transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                    disabled={currentIndex === questions.length - 1}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 disabled:opacity-30 text-white text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-indigo-600/25 transition border border-brand-400/30"
                  >
                    <span>Next Question</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Sidebar: Question Palette (1 col) */}
        <div className="space-y-6">
          <div className="glass-panel border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-white text-sm tracking-wide">Question Palette</h3>

            {/* Status Legend */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span>Answered: <strong className="text-white">{answeredCount}</strong></span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                <span>Remaining: <strong className="text-white">{unansweredCount}</strong></span>
              </div>
            </div>

            {/* Questions Grid */}
            <div className="grid grid-cols-5 gap-2 max-h-72 overflow-y-auto p-1">
              {questions.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                const isCurrent = currentIndex === idx;

                let btnClass = 'bg-slate-900/90 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-white';

                if (isCurrent) {
                  btnClass = 'ring-2 ring-brand-500 ring-offset-2 ring-offset-slate-950 font-black ' +
                    (isAnswered ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-brand-600 text-white border-brand-400');
                } else if (isAnswered) {
                  btnClass = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 font-bold';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-xl text-xs font-mono transition flex items-center justify-center ${btnClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowConfirmModal(true)}
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/25 transition flex items-center justify-center space-x-2 border border-emerald-400/30"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit Assessment</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <ShieldCheck className="w-7 h-7" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-xl font-black text-white">Finish Assessment?</h3>
                <p className="text-xs text-slate-400">
                  Your answers will be submitted for immediate automatic scoring.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-center">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Answered</span>
                  <p className="text-2xl font-black text-emerald-400 font-mono">{answeredCount}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Unanswered</span>
                  <p className="text-2xl font-black text-amber-400 font-mono">{unansweredCount}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={submitting}
                  className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition"
                >
                  Return to Test
                </button>
                <button
                  type="button"
                  onClick={() => submitTest(false)}
                  disabled={submitting}
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/25 transition flex items-center justify-center space-x-1.5 border border-emerald-400/30"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Confirm Submit</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
