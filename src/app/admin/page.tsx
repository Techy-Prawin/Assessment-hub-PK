'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, FileText, HelpCircle, BarChart3, Plus, Sparkles, ArrowRight, CheckCircle2, Clock, Eye, Activity, ShieldCheck, Zap } from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalTests: number;
  totalQuestions: number;
  totalAttempts: number;
  averagePercentage: number;
}

interface ResultItem {
  id: string;
  userName: string;
  userEmail: string;
  testTitle: string;
  testId: string;
  score: number;
  totalMarks: number;
  percentage: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  status: string;
  submittedAt: string | null;
}

export default function AdminOverviewPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentResults, setRecentResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/stats').then((res) => {
        if (res.status === 401 || res.status === 403) {
          router.push('/login');
          return null;
        }
        return res.json();
      }),
      fetch('/api/admin/results').then((res) => (res.ok ? res.json() : null)),
    ])
      .then(([statsData, resultsData]) => {
        if (statsData?.stats) setStats(statsData.stats);
        if (resultsData?.results) setRecentResults(resultsData.results.slice(0, 6));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-28 bg-slate-900/60 border border-slate-800 rounded-3xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-900/60 border border-slate-800 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header & Quick Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-xs font-semibold text-purple-300">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>Administrator Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2">
              System Operations Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Control the AI question generation pipeline, configure timed assessments, and review live candidate test audits.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/admin/questions?action=ai"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition border border-brand-400/30"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>AI Question Studio</span>
            </Link>

            <Link
              href="/admin/questions?action=new"
              className="inline-flex items-center space-x-1.5 bg-slate-900/90 border border-slate-800 hover:bg-slate-800 text-slate-200 font-bold text-xs px-3.5 py-2.5 rounded-xl transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-slate-400" />
              <span>Add Question</span>
            </Link>

            <Link
              href="/admin/tests?action=new"
              className="inline-flex items-center space-x-1.5 bg-slate-900/90 border border-slate-800 hover:bg-slate-800 text-slate-200 font-bold text-xs px-3.5 py-2.5 rounded-xl transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-brand-400" />
              <span>Create Test</span>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center space-x-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registered Users</span>
            <div className="text-2xl font-black text-white mt-0.5 font-mono">{stats?.totalUsers ?? 0}</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center space-x-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Question Bank</span>
            <div className="text-2xl font-black text-white mt-0.5 font-mono">{stats?.totalQuestions ?? 0}</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center space-x-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Tests</span>
            <div className="text-2xl font-black text-white mt-0.5 font-mono">{stats?.totalTests ?? 0}</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center space-x-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Attempts</span>
            <div className="text-2xl font-black text-white mt-0.5 font-mono">{stats?.totalAttempts ?? 0}</div>
          </div>
        </motion.div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/questions"
          className="glass-card glass-card-hover p-7 rounded-3xl border border-slate-800 space-y-3 block group"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-brand-500/25">
              <HelpCircle className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-brand-400 group-hover:translate-x-1 transition" />
          </div>
          <h3 className="text-base font-bold text-white group-hover:text-brand-300 transition">
            Manage Question Bank
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Create questions manually or generate new multiple-choice sets with Gemini AI across aptitude topics.
          </p>
        </Link>

        <Link
          href="/admin/tests"
          className="glass-card glass-card-hover p-7 rounded-3xl border border-slate-800 space-y-3 block group"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center shadow-md shadow-purple-500/25">
              <FileText className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition" />
          </div>
          <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition">
            Manage Assessments
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Assemble assessment tests from the question library, customize duration, toggle live publish states, and inspect tests.
          </p>
        </Link>

        <Link
          href="/admin/results"
          className="glass-card glass-card-hover p-7 rounded-3xl border border-slate-800 space-y-3 block group"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/25">
              <BarChart3 className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition" />
          </div>
          <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition">
            Audit Results & Diagnostics
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Review detailed submission results, scores, accuracy percentage, and individual answer breakdowns.
          </p>
        </Link>
      </div>

      {/* Recent Submissions Table */}
      <div className="glass-panel border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Recent Candidate Submissions</h2>
            <p className="text-xs text-slate-400">Live feed of student test attempts and scores</p>
          </div>
          <Link
            href="/admin/results"
            className="text-xs font-bold text-brand-400 hover:text-brand-300 flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentResults.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
            No test submissions recorded yet. When students complete an assessment, their scores will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Candidate</th>
                  <th className="py-3.5 px-4">Test Title</th>
                  <th className="py-3.5 px-4">Score</th>
                  <th className="py-3.5 px-4">Percentage</th>
                  <th className="py-3.5 px-4">Submitted At</th>
                  <th className="py-3.5 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {recentResults.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{r.userName}</div>
                      <div className="text-[11px] text-slate-500">{r.userEmail}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-300">{r.testTitle}</td>
                    <td className="py-3.5 px-4 font-mono">
                      <span className="font-black text-white">{r.score}</span>
                      <span className="text-slate-500"> / {r.totalMarks}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                          r.percentage >= 50
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {r.percentage}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : 'In Progress'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/test/${r.testId}/result/${r.id}`}
                        className="p-1.5 inline-flex items-center text-slate-400 hover:text-brand-300 hover:bg-slate-800 rounded-lg transition"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
