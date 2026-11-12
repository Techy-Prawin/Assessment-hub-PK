'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, HelpCircle, Award, Users, CheckCircle2, XCircle, Eye, Trash2, ToggleLeft, ToggleRight, AlertCircle, FileText, Sparkles, BarChart3 } from 'lucide-react';

interface QuestionItem {
  id: string;
  question: string;
  topic: string;
  difficulty: string;
  marks: number;
  options: string[];
  correctAnswer: string;
  explanation: string | null;
  order: number;
}

interface AttemptItem {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  score: number;
  percentage: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  status: string;
  startedAt: string;
  submittedAt: string | null;
}

interface TestDetail {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  totalMarks: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: string;
  questionsCount: number;
  questions: QuestionItem[];
  attempts: AttemptItem[];
}

export default function AdminTestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params.id as string;

  const [test, setTest] = useState<TestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTest = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tests/${testId}`);
      if (res.status === 401 || res.status === 403) {
        router.push('/login');
        return;
      }
      if (!res.ok) throw new Error('Failed to load test details');
      const data = await res.json();
      setTest(data.test);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId]);

  const handleToggleStatus = async () => {
    if (!test) return;
    const newStatus = test.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      const res = await fetch(`/api/tests/${test.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      setTest({ ...test, status: newStatus });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteTest = async () => {
    if (!confirm('Are you sure you want to delete this test? All candidate attempts for this test will be removed.')) return;
    try {
      const res = await fetch(`/api/tests/${testId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete test');
      router.push('/admin/tests');
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-900/60 border border-slate-800 rounded-xl" />
        <div className="h-48 bg-slate-900/60 border border-slate-800 rounded-3xl" />
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="max-w-md mx-auto my-12 glass-panel border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Assessment Not Found</h2>
        <p className="text-xs text-slate-400">{error || 'Unable to retrieve assessment details.'}</p>
        <Link
          href="/admin/tests"
          className="inline-block px-5 py-2.5 bg-brand-600 text-white font-bold text-xs rounded-xl shadow-lg"
        >
          Return to Assessments List
        </Link>
      </div>
    );
  }

  const completedAttempts = test.attempts.filter((a) => a.status === 'COMPLETED');
  const totalAttempts = completedAttempts.length;
  const avgScore = totalAttempts > 0
    ? Number((completedAttempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts).toFixed(1))
    : 0;
  const avgPercentage = totalAttempts > 0
    ? Number((completedAttempts.reduce((sum, a) => sum + a.percentage, 0) / totalAttempts).toFixed(1))
    : 0;
  const highestScore = totalAttempts > 0
    ? Math.max(...completedAttempts.map((a) => a.score))
    : 0;

  const isPublished = test.status === 'PUBLISHED';

  return (
    <div className="space-y-8">
      {/* Navigation & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/admin/tests"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            title="Back to all tests"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  isPublished
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {test.status}
              </span>
              <span className="text-xs text-slate-500">Created {new Date(test.createdAt).toLocaleDateString()}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              {test.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggleStatus}
            className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
              isPublished
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
            }`}
          >
            <span>{isPublished ? 'Unpublish (Draft)' : 'Publish to Students'}</span>
          </button>

          <Link
            href={`/test/${test.id}`}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition border border-slate-700"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Candidate Preview</span>
          </Link>

          <button
            onClick={handleDeleteTest}
            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
            title="Delete test"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Test Meta Description & Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
      >
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          {test.description || 'No description provided for this assessment.'}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center font-mono">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Duration</span>
            <div className="text-xl font-black text-white mt-0.5">{test.duration}m</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center font-mono">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Total Marks</span>
            <div className="text-xl font-black text-white mt-0.5">{test.totalMarks}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center font-mono">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Attempts</span>
            <div className="text-xl font-black text-white mt-0.5">{totalAttempts}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center font-mono">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Avg Score</span>
            <div className="text-xl font-black text-brand-400 mt-0.5">
              {avgScore} <span className="text-xs text-slate-500 font-normal">({avgPercentage}%)</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center font-mono">
            <span className="text-[10px] text-slate-500 font-bold uppercase">High Score</span>
            <div className="text-xl font-black text-emerald-400 mt-0.5">{highestScore}</div>
          </div>
        </div>
      </motion.div>

      {/* Participant Submissions Table */}
      <div className="glass-panel border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white">Candidate Scores & Attempts</h2>
          <p className="text-xs text-slate-400">All student test attempts for this assessment</p>
        </div>

        {test.attempts.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
            No candidates have attended this test yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Candidate</th>
                  <th className="py-3.5 px-4">Score</th>
                  <th className="py-3.5 px-4">Accuracy</th>
                  <th className="py-3.5 px-4">Correct / Wrong / Skipped</th>
                  <th className="py-3.5 px-4">Submission Date</th>
                  <th className="py-3.5 px-4 text-right">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {test.attempts.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{attempt.user.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{attempt.user.email}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <span className="font-black text-white text-sm">{attempt.score}</span>
                      <span className="text-slate-500"> / {test.totalMarks}</span>
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                          attempt.percentage >= 50
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {attempt.percentage}%
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 font-mono">
                      <span className="text-emerald-400 font-bold">{attempt.correctCount} C</span> •{' '}
                      <span className="text-rose-400 font-bold">{attempt.wrongCount} W</span> •{' '}
                      <span className="text-slate-500">{attempt.unansweredCount} S</span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400">
                      {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : 'In Progress'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/test/${test.id}/result/${attempt.id}`}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition border border-slate-700"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Questions Included in Test */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white tracking-tight">
          Questions in Assessment ({test.questions.length})
        </h2>

        <div className="space-y-3">
          {test.questions.map((q, idx) => (
            <div
              key={q.id}
              className="glass-panel border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    Q{idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-brand-300 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
                    {q.topic}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">({q.marks} {q.marks === 1 ? 'mark' : 'marks'})</span>
                </div>
              </div>

              <p className="text-sm font-semibold text-white">{q.question}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {q.options.map((opt, optIndex) => {
                  const isCorrect = opt === q.correctAnswer;
                  return (
                    <div
                      key={optIndex}
                      className={`p-3 rounded-2xl border flex items-center justify-between ${
                        isCorrect
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200 font-bold'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-500">{String.fromCharCode(65 + optIndex)}.</span>
                        <span>{opt}</span>
                      </div>
                      {isCorrect && (
                        <span className="text-[9px] uppercase font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                          Correct
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {q.explanation && (
                <div className="text-xs text-slate-300 bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl">
                  <span className="font-bold text-brand-400">Explanation:</span> {q.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
