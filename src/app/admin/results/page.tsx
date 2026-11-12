'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BarChart3, Eye, Search, CheckCircle2, XCircle, Clock, ArrowLeft, Filter, Users, ShieldCheck } from 'lucide-react';

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
  startedAt: string;
  submittedAt: string | null;
}

export default function AdminResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/api/admin/results')
      .then((res) => {
        if (res.status === 401 || res.status === 403) {
          router.push('/login');
          return null;
        }
        if (!res.ok) throw new Error('Failed to load results');
        return res.json();
      })
      .then((data) => {
        if (data?.results) setResults(data.results);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [router]);

  const filtered = results.filter((r) => {
    const query = searchTerm.toLowerCase();
    return (
      r.userName.toLowerCase().includes(query) ||
      r.userEmail.toLowerCase().includes(query) ||
      r.testTitle.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <Link
              href="/admin"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              title="Back to admin overview"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                Assessment Results Audit
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Real-time log of candidate submissions, scores, accuracy percentage, and answers.
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search candidate or test..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-brand-500 placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Results Table */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-900/60 border border-slate-800 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel border border-slate-800 rounded-3xl p-12 text-center max-w-md mx-auto space-y-3 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto">
            <BarChart3 className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-white text-base">No Test Submissions Yet</h3>
          <p className="text-xs text-slate-400">
            Results will appear here as soon as candidates complete an assessment.
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel border border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-4 px-5">Candidate</th>
                  <th className="py-4 px-5">Assessment</th>
                  <th className="py-4 px-5">Score</th>
                  <th className="py-4 px-5">Accuracy</th>
                  <th className="py-4 px-5">Breakdown (C / W / S)</th>
                  <th className="py-4 px-5">Submitted Date</th>
                  <th className="py-4 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-5">
                      <div className="font-bold text-white">{item.userName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{item.userEmail}</div>
                    </td>

                    <td className="py-4 px-5 font-semibold text-slate-300">
                      {item.testTitle}
                    </td>

                    <td className="py-4 px-5 font-mono">
                      <span className="font-black text-white text-sm">{item.score}</span>
                      <span className="text-slate-500 text-xs"> / {item.totalMarks}</span>
                    </td>

                    <td className="py-4 px-5 font-mono">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          item.percentage >= 80
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : item.percentage >= 50
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {item.percentage}%
                      </span>
                    </td>

                    <td className="py-4 px-5">
                      <div className="flex items-center space-x-2 text-[11px] font-mono">
                        <span className="text-emerald-400 font-bold">{item.correctCount} C</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-rose-400 font-bold">{item.wrongCount} W</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-500">{item.unansweredCount} S</span>
                      </div>
                    </td>

                    <td className="py-4 px-5 text-slate-400">
                      {item.submittedAt
                        ? new Date(item.submittedAt).toLocaleString()
                        : 'In Progress'}
                    </td>

                    <td className="py-4 px-5 text-right">
                      <Link
                        href={`/test/${item.testId}/result/${item.id}`}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition border border-slate-700"
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
        </motion.div>
      )}
    </div>
  );
}
