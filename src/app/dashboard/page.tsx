'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Clock, HelpCircle, Award, CheckCircle2, AlertCircle, ArrowRight, Play, Eye, BookOpen, Sparkles, Target, Zap, Activity } from 'lucide-react';

interface TestItem {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  totalMarks: number;
  questionsCount: number;
  userAttemptStatus: 'AVAILABLE' | 'COMPLETED' | 'IN_PROGRESS';
  latestAttempt: {
    id: string;
    score: number;
    percentage: number;
    submittedAt: string | null;
    status: string;
  } | null;
}

interface CurrentUser {
  name: string;
  email: string;
  role: string;
}

export default function UserDashboard() {
  const router = useRouter();
  const [tests, setTests] = useState<TestItem[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<'ALL' | 'AVAILABLE' | 'COMPLETED'>('ALL');

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then((res) => (res.ok ? res.json() : null)),
      fetch('/api/tests').then(async (res) => {
        if (res.status === 401) {
          router.push('/login');
          return null;
        }
        if (!res.ok) throw new Error('Failed to load tests');
        return res.json();
      }),
    ])
      .then(([userData, testsData]) => {
        if (userData?.user) setCurrentUser(userData.user);
        if (testsData?.tests) setTests(testsData.tests);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-36 bg-slate-900/60 border border-slate-800 rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-slate-900/60 border border-slate-800 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-slate-900/60 border border-slate-800 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  const completedTests = tests.filter((t) => t.userAttemptStatus === 'COMPLETED');
  const availableTests = tests.filter((t) => t.userAttemptStatus === 'AVAILABLE');
  const inProgressTests = tests.filter((t) => t.userAttemptStatus === 'IN_PROGRESS');

  const averageAccuracy = completedTests.length > 0
    ? Number(
        (
          completedTests.reduce((sum, t) => sum + (t.latestAttempt?.percentage || 0), 0) /
          completedTests.length
        ).toFixed(1)
      )
    : 0;

  const filteredTests = tests.filter((t) => {
    if (filterTab === 'AVAILABLE') return t.userAttemptStatus === 'AVAILABLE';
    if (filterTab === 'COMPLETED') return t.userAttemptStatus === 'COMPLETED';
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Welcome Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl"
      >
        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800/80 border border-brand-500/30 text-xs text-brand-300 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Assessment Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Hello, {currentUser?.name || 'Candidate'} 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Track your aptitude benchmarks, test reasoning speed, and explore detailed question analyses.
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-slate-900/80 border border-slate-800 px-4 py-2.5 rounded-2xl shadow-inner">
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
            <div className="text-xs">
              <span className="text-slate-400">Readiness:</span>{' '}
              <strong className="text-white font-mono">{completedTests.length > 0 ? 'Active' : 'Ready'}</strong>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-5 rounded-2xl border border-slate-800/80 flex items-center space-x-4"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Play className="w-5 h-5 fill-current" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Available Tests</span>
            <div className="text-2xl font-black text-white mt-0.5">{availableTests.length}</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-5 rounded-2xl border border-slate-800/80 flex items-center space-x-4"
        >
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Completed Tests</span>
            <div className="text-2xl font-black text-white mt-0.5">{completedTests.length}</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-5 rounded-2xl border border-slate-800/80 flex items-center space-x-4"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Avg Accuracy</span>
            <div className="text-2xl font-black text-purple-300 mt-0.5">{averageAccuracy}%</div>
          </div>
        </motion.div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs & Test Grid Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Assigned Assessments</h2>
          <p className="text-xs text-slate-400">Select any test to launch timed assessment</p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 bg-slate-900/90 border border-slate-800 p-1 rounded-xl text-xs">
          {(['ALL', 'AVAILABLE', 'COMPLETED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                filterTab === tab
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Tests Grid */}
      {filteredTests.length === 0 ? (
        <div className="glass-panel border border-slate-800 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">No Assessments Found</h3>
          <p className="text-xs text-slate-400">
            {filterTab === 'COMPLETED'
              ? 'You have not completed any assessments yet. Choose an available assessment above to get started!'
              : 'There are currently no assessments matching your filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTests.map((test, index) => {
            const isCompleted = test.userAttemptStatus === 'COMPLETED';
            const isInProgress = test.userAttemptStatus === 'IN_PROGRESS';

            return (
              <motion.div
                key={test.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
                className="glass-card glass-card-hover rounded-3xl p-6 border border-slate-800 flex flex-col justify-between relative group"
              >
                <div className="space-y-4">
                  {/* Status Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Aptitude Test
                    </span>

                    {isCompleted ? (
                      <span className="inline-flex items-center space-x-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        <span>Completed</span>
                      </span>
                    ) : isInProgress ? (
                      <span className="inline-flex items-center space-x-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span>In Progress</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>Available</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-brand-300 transition line-clamp-1">
                      {test.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {test.description || 'Comprehensive assessment test designed to test core competence.'}
                    </p>
                  </div>

                  {/* Metadata Chips */}
                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-800/80 text-xs">
                    <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                      <Clock className="w-3.5 h-3.5 text-brand-400 mb-1" />
                      <span className="font-bold text-white font-mono">{test.duration}m</span>
                      <span className="text-[9px] text-slate-500 uppercase">Duration</span>
                    </div>

                    <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                      <HelpCircle className="w-3.5 h-3.5 text-indigo-400 mb-1" />
                      <span className="font-bold text-white font-mono">{test.questionsCount}</span>
                      <span className="text-[9px] text-slate-500 uppercase">Questions</span>
                    </div>

                    <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                      <Award className="w-3.5 h-3.5 text-purple-400 mb-1" />
                      <span className="font-bold text-white font-mono">{test.totalMarks}</span>
                      <span className="text-[9px] text-slate-500 uppercase">Marks</span>
                    </div>
                  </div>

                  {/* Score Pill if completed */}
                  {isCompleted && test.latestAttempt && (
                    <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] uppercase text-slate-500 font-semibold">Your Score</span>
                        <div className="font-black text-white text-base">
                          {test.latestAttempt.score} <span className="text-xs font-normal text-slate-500">/ {test.totalMarks}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase text-slate-500 font-semibold">Accuracy</span>
                        <div className={`font-black text-base ${test.latestAttempt.percentage >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {test.latestAttempt.percentage}%
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Action Button */}
                <div className="pt-6">
                  {isCompleted && test.latestAttempt ? (
                    <div className="space-y-2">
                      <Link
                        href={`/test/${test.id}/result/${test.latestAttempt.id}`}
                        className="w-full py-2.5 px-4 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 hover:text-white font-semibold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center space-x-2"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Result & Explanations</span>
                      </Link>
                      <Link
                        href={`/test/${test.id}`}
                        className="w-full py-2 px-4 bg-transparent hover:bg-brand-500/10 text-brand-400 font-semibold text-xs rounded-xl transition flex items-center justify-center space-x-1"
                      >
                        <span>Retake Assessment</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ) : (
                    <Link
                      href={`/test/${test.id}`}
                      className="w-full py-3 px-4 bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/25 transition flex items-center justify-center space-x-2 border border-brand-400/30"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isInProgress ? 'Resume Assessment' : 'Start Assessment'}</span>
                    </Link>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
