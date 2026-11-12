'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Clock, HelpCircle, Award, Users, FileText, CheckCircle2, AlertCircle, X, Eye, ToggleLeft, ToggleRight, Sparkles, BarChart3 } from 'lucide-react';

interface QuestionInBank {
  id: string;
  question: string;
  topic: string;
  difficulty: string;
  marks: number;
}

interface TestItem {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  totalMarks: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: string;
  questionsCount: number;
  attemptsCount: number;
  averageScore: number;
}

function TestsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tests, setTests] = useState<TestItem[]>([]);
  const [bankQuestions, setBankQuestions] = useState<QuestionInBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Test Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [testForm, setTestForm] = useState({
    title: '',
    description: '',
    duration: 30,
    status: 'PUBLISHED' as 'DRAFT' | 'PUBLISHED',
    selectedQuestionIds: [] as string[],
  });
  const [creatingTest, setCreatingTest] = useState(false);

  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'new') setShowCreateModal(true);
  }, [searchParams]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [testsRes, questionsRes] = await Promise.all([
        fetch('/api/tests'),
        fetch('/api/questions'),
      ]);

      if (testsRes.status === 401 || testsRes.status === 403) {
        router.push('/login');
        return;
      }

      const testsData = await testsRes.json();
      const questionsData = await questionsRes.json();

      if (testsData?.tests) setTests(testsData.tests);
      if (questionsData?.questions) setBankQuestions(questionsData.questions);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle Create Test
  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (testForm.selectedQuestionIds.length === 0) {
      alert('Please select at least one question from the bank for this test.');
      return;
    }

    setCreatingTest(true);
    try {
      const res = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: testForm.title.trim(),
          description: testForm.description.trim() || null,
          duration: Number(testForm.duration) || 30,
          status: testForm.status,
          questionIds: testForm.selectedQuestionIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create test');

      setShowCreateModal(false);
      setTestForm({
        title: '',
        description: '',
        duration: 30,
        status: 'PUBLISHED',
        selectedQuestionIds: [],
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error creating test');
    } finally {
      setCreatingTest(false);
    }
  };

  // Toggle publish status
  const handleToggleStatus = async (test: TestItem) => {
    const newStatus = test.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      const res = await fetch(`/api/tests/${test.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      setTests((prev) =>
        prev.map((t) => (t.id === test.id ? { ...t, status: newStatus } : t))
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delete test
  const handleDeleteTest = async (id: string) => {
    if (!confirm('Are you sure you want to delete this test and all its candidate records?')) return;

    try {
      const res = await fetch(`/api/tests/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete test');
      setTests((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const selectedTotalMarks = testForm.selectedQuestionIds.reduce((sum, qId) => {
    const q = bankQuestions.find((item) => item.id === qId);
    return sum + (q?.marks || 1);
  }, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Manage Assessments</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Assemble assessment tests, configure duration, select questions, and control publishing.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center space-x-2 bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition border border-brand-400/30"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Assessment</span>
        </motion.button>
      </div>

      {/* Tests Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-slate-900/60 border border-slate-800 rounded-3xl" />
          ))}
        </div>
      ) : tests.length === 0 ? (
        <div className="glass-panel border border-slate-800 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-white text-base">No Assessments Configured</h3>
          <p className="text-xs text-slate-400">
            Create your first test and select questions from the question library.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl shadow-lg"
          >
            Create Assessment
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test, index) => {
            const isPublished = test.status === 'PUBLISHED';

            return (
              <motion.div
                key={test.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
                className="glass-panel border border-slate-800 rounded-3xl p-6 shadow-xl hover:border-slate-700 transition flex flex-col justify-between relative group"
              >
                <div className="space-y-4">
                  {/* Status Toggle & Delete */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleToggleStatus(test)}
                      className={`inline-flex items-center space-x-1.5 text-xs font-bold px-2.5 py-1 rounded-full border transition ${
                        isPublished
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                      }`}
                      title="Click to toggle publish status"
                    >
                      <span className={`w-2 h-2 rounded-full ${isPublished ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      <span>{isPublished ? 'Published' : 'Draft'}</span>
                    </button>

                    <button
                      onClick={() => handleDeleteTest(test.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                      title="Delete test"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <Link
                      href={`/admin/tests/${test.id}`}
                      className="text-lg font-bold text-white hover:text-brand-300 transition line-clamp-1"
                    >
                      {test.title}
                    </Link>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {test.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Metadata Chips */}
                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-800 text-xs">
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

                  {/* Participation Stats */}
                  <div className="flex items-center justify-between text-xs text-slate-400 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="flex items-center space-x-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>{test.attemptsCount} Candidates</span>
                    </div>
                    <div>
                      Avg Score: <strong className="text-white font-mono">{test.averageScore}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-6 grid grid-cols-2 gap-2">
                  <Link
                    href={`/admin/tests/${test.id}`}
                    className="py-2 px-3 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center space-x-1"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Scores & Audit</span>
                  </Link>

                  <Link
                    href={`/test/${test.id}`}
                    className="py-2 px-3 bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white font-semibold text-xs rounded-xl border border-slate-800 transition flex items-center justify-center space-x-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Test Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Assemble Assessment Test</h3>
                  <p className="text-xs text-slate-400">
                    Configure test settings and select questions from your library.
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTest} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Assessment Title
                  </label>
                  <input
                    type="text"
                    value={testForm.title}
                    onChange={(e) => setTestForm({ ...testForm, title: e.target.value })}
                    required
                    placeholder="e.g. Quantitative Aptitude Practice Test 1"
                    className="w-full p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Description
                  </label>
                  <textarea
                    value={testForm.description}
                    onChange={(e) => setTestForm({ ...testForm, description: e.target.value })}
                    rows={2}
                    placeholder="Brief summary of test scope and instructions..."
                    className="w-full p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                      Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="180"
                      value={testForm.duration}
                      onChange={(e) => setTestForm({ ...testForm, duration: Number(e.target.value) })}
                      className="w-full p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                      Publish Status
                    </label>
                    <select
                      value={testForm.status}
                      onChange={(e) => setTestForm({ ...testForm, status: e.target.value as any })}
                      className="w-full p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white"
                    >
                      <option value="PUBLISHED">Published (Immediately Available to Students)</option>
                      <option value="DRAFT">Draft (Hidden from Students)</option>
                    </select>
                  </div>
                </div>

                {/* Question Selection */}
                <div className="space-y-3 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                    <div>
                      <span className="text-xs font-bold text-white uppercase">
                        Select Questions from Bank ({testForm.selectedQuestionIds.length} selected, {selectedTotalMarks} marks)
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-xs">
                      <button
                        type="button"
                        onClick={() =>
                          setTestForm({
                            ...testForm,
                            selectedQuestionIds: bankQuestions.map((q) => q.id),
                          })
                        }
                        className="text-brand-400 hover:underline font-bold"
                      >
                        Select All
                      </button>
                      <span className="text-slate-600">•</span>
                      <button
                        type="button"
                        onClick={() => setTestForm({ ...testForm, selectedQuestionIds: [] })}
                        className="text-slate-400 hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {bankQuestions.length === 0 ? (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-300">
                      No questions exist in the library. Please add questions first!
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto p-1">
                      {bankQuestions.map((q) => {
                        const isSelected = testForm.selectedQuestionIds.includes(q.id);

                        return (
                          <label
                            key={q.id}
                            className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition ${
                              isSelected
                                ? 'bg-brand-500/20 border-brand-500/50'
                                : 'bg-slate-900/60 border-slate-800 hover:bg-slate-850'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setTestForm({
                                    ...testForm,
                                    selectedQuestionIds: [...testForm.selectedQuestionIds, q.id],
                                  });
                                } else {
                                  setTestForm({
                                    ...testForm,
                                    selectedQuestionIds: testForm.selectedQuestionIds.filter((id) => id !== q.id),
                                  });
                                }
                              }}
                              className="mt-0.5 w-4 h-4 text-brand-500 rounded-sm focus:ring-brand-500"
                            />
                            <div className="flex-1 text-xs">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-bold text-brand-300 bg-brand-500/10 px-1.5 py-0.5 rounded text-[10px]">
                                  {q.topic}
                                </span>
                                <span className="text-slate-500 text-[10px] font-mono">({q.marks} marks)</span>
                              </div>
                              <span className="font-medium text-slate-200 line-clamp-2">{q.question}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingTest || testForm.selectedQuestionIds.length === 0}
                    className="px-5 py-2.5 bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg border border-brand-400/30"
                  >
                    {creatingTest ? 'Publishing Test...' : 'Publish Assessment'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminTestsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading assessments...</div>}>
      <TestsContent />
    </Suspense>
  );
}
