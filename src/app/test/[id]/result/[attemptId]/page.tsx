'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Award, CheckCircle2, XCircle, MinusCircle, Clock, ArrowLeft, RefreshCw, Sparkles, HelpCircle, Target, Zap, Share2 } from 'lucide-react';

interface AnswerDetail {
  questionId: string;
  question: string;
  topic: string;
  difficulty: string;
  marks: number;
  options: string[];
  selectedAnswer: string | null;
  correctAnswer: string;
  explanation: string | null;
  isCorrect: boolean;
  marksAwarded: number;
  aiFeedback: string | null;
}

interface AttemptResult {
  id: string;
  testId: string;
  testTitle: string;
  testDescription: string | null;
  totalMarks: number;
  score: number;
  percentage: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  timeTaken: string;
  status: string;
  answers: AnswerDetail[];
}

export default function TestResultPage() {
  const router = useRouter();
  const params = useParams();
  const attemptId = params.attemptId as string;
  const testId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);

  useEffect(() => {
    fetch(`/api/attempts/${attemptId}`)
      .then(async (res) => {
        if (res.status === 401) {
          router.push('/login');
          return null;
        }
        if (!res.ok) throw new Error('Failed to load test result');
        return res.json();
      })
      .then((data) => {
        if (data && data.attempt) {
          setResult(data.attempt);
          if (data.attempt.percentage >= 70) {
            // Trigger celebration confetti
            try {
              confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#6366f1', '#a855f7', '#10b981', '#38bdf8'],
              });
            } catch (e) {
              console.warn('Confetti error:', e);
            }
          }
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [attemptId, router]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center space-y-4">
        <div className="w-14 h-14 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto shadow-lg shadow-brand-500/25" />
        <h2 className="text-xl font-bold text-white tracking-tight">Compiling Performance Diagnostics...</h2>
        <p className="text-xs text-slate-400">Computing deterministic scores and AI question evaluations.</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="max-w-md mx-auto my-12 glass-panel border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <XCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Result Not Found</h2>
        <p className="text-xs text-slate-400">{error || 'Unable to retrieve test submission record.'}</p>
        <Link
          href="/dashboard"
          className="inline-block mt-4 px-5 py-2.5 bg-brand-600 text-white font-bold text-xs rounded-xl shadow-lg"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const isPassed = result.percentage >= 50;

  // SVG Radial Gauge calculation
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (result.percentage / 100) * circumference;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Controls */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <Link
          href={`/test/${testId}`}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-brand-300 hover:text-white bg-brand-500/20 hover:bg-brand-500/30 border border-brand-500/30 px-3.5 py-2 rounded-xl transition shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retake Assessment</span>
        </Link>
      </div>

      {/* Main Score Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center space-y-2 mb-8">
          <span className="text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest bg-slate-800 text-slate-400 border border-slate-700">
            Assessment Complete
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            {result.testTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            {result.testDescription || 'Performance report and question analysis.'}
          </p>
        </div>

        {/* Circular Gauge & Core Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-4">
          {/* Radial Score Gauge */}
          <div className="md:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="88"
                  cy="88"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="12"
                  className="text-slate-800"
                  fill="transparent"
                />
                <motion.circle
                  cx="88"
                  cy="88"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className={result.percentage >= 70 ? 'text-emerald-400' : isPassed ? 'text-brand-400' : 'text-amber-400'}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-black text-white font-mono">{result.percentage}%</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  {isPassed ? 'Qualified' : 'Needs Practice'}
                </span>
              </div>
            </div>
          </div>

          {/* Metric Stats Cards */}
          <div className="md:col-span-7 grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Score</span>
              <div className="text-2xl font-black text-white mt-1 font-mono">
                {result.score} <span className="text-xs text-slate-500 font-normal">/ {result.totalMarks}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Time Taken</span>
              <div className="text-2xl font-black text-slate-200 mt-1 font-mono">
                {result.timeTaken}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Correct
              </span>
              <div className="text-2xl font-black text-emerald-300 mt-1 font-mono">
                {result.correctCount}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
              <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                <XCircle className="w-3.5 h-3.5" /> Incorrect
              </span>
              <div className="text-2xl font-black text-rose-300 mt-1 font-mono">
                {result.wrongCount}
              </div>
            </div>
          </div>
        </div>

        {/* Legend pills */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-slate-400 border-t border-slate-800/80">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>Correct: <strong className="text-white">{result.correctCount}</strong></span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <span>Wrong: <strong className="text-white">{result.wrongCount}</strong></span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
            <span>Skipped: <strong className="text-white">{result.unansweredCount}</strong></span>
          </div>
        </div>
      </motion.div>

      {/* AI Performance Recommendation */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-panel border border-brand-500/30 rounded-3xl p-6 relative overflow-hidden shadow-xl"
      >
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-brand-500/25">
            <Sparkles className="w-6 h-6 text-amber-300" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-white text-sm tracking-wide">
              AI Diagnostic Evaluation & Recommendation
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {result.percentage >= 80
                ? 'Outstanding performance! You displayed superior conceptual understanding across all tested categories. Consider taking Hard difficulty assessments to further push problem-solving speed.'
                : result.percentage >= 50
                ? 'Solid performance! You cleared the competency threshold. Review the step-by-step explanations for the incorrect questions below to avoid tricky traps on timed conditions.'
                : 'Foundational review recommended. Focus on breaking complex problems into sub-steps before re-attempting.'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Question by Question Review */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-tight">Question-by-Question Review</h2>

        <div className="space-y-4">
          {result.answers.map((item, index) => {
            const isUnanswered = !item.selectedAnswer;

            return (
              <motion.div
                key={item.questionId}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
                className="glass-panel border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                      Q{index + 1}
                    </span>
                    <span className="text-xs font-semibold text-brand-300 bg-brand-500/10 px-2 py-0.5 rounded-md border border-brand-500/20">
                      {item.topic}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      +{item.marksAwarded}/{item.marks} marks
                    </span>
                  </div>

                  {/* Status Pill */}
                  {item.isCorrect ? (
                    <span className="inline-flex items-center space-x-1 text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Correct</span>
                    </span>
                  ) : isUnanswered ? (
                    <span className="inline-flex items-center space-x-1 text-xs font-bold px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                      <MinusCircle className="w-3.5 h-3.5" />
                      <span>Skipped</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-xs font-bold px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Incorrect</span>
                    </span>
                  )}
                </div>

                {/* Question Text */}
                <p className="text-sm sm:text-base font-semibold text-white leading-snug">
                  {item.question}
                </p>

                {/* Options List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {item.options.map((opt, optIdx) => {
                    const isUserChoice = item.selectedAnswer === opt;
                    const isCorrectAnswer = item.correctAnswer === opt;

                    let optionStyle = 'bg-slate-900/60 border-slate-800 text-slate-400';

                    if (isCorrectAnswer) {
                      optionStyle = 'bg-emerald-500/20 border-emerald-500/60 text-emerald-200 font-bold ring-1 ring-emerald-500/30';
                    } else if (isUserChoice && !item.isCorrect) {
                      optionStyle = 'bg-rose-500/20 border-rose-500/60 text-rose-200 font-bold ring-1 ring-rose-500/30 line-through';
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`p-3 rounded-2xl border flex items-center justify-between ${optionStyle}`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-[11px] text-slate-500">
                            {String.fromCharCode(65 + optIdx)}.
                          </span>
                          <span>{opt}</span>
                        </div>
                        {isCorrectAnswer && (
                          <span className="text-[9px] uppercase font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                            Correct Answer
                          </span>
                        )}
                        {isUserChoice && !isCorrectAnswer && (
                          <span className="text-[9px] uppercase font-bold text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-500/40">
                            Your Choice
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Block */}
                {item.explanation && (
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-1">
                    <span className="font-bold flex items-center gap-1.5 text-brand-400">
                      <HelpCircle className="w-3.5 h-3.5" />
                      Detailed Explanation:
                    </span>
                    <p className="leading-relaxed text-slate-300">{item.explanation}</p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
