'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle2, ArrowRight, BrainCircuit, BarChart3, Clock, Cpu } from 'lucide-react';

export default function HomePage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
  };

  return (
    <div className="space-y-16 py-6 overflow-hidden">
      {/* Hero Section */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative rounded-3xl bg-gradient-to-b from-slate-900/90 via-navy-900/80 to-slate-950/90 border border-slate-800/80 p-8 sm:p-14 lg:p-16 overflow-hidden shadow-2xl backdrop-blur-xl"
      >
        {/* Ambient glow orbs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-hero-gradient pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6">
            <motion.div variants={itemVariants} className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-brand-500/30 backdrop-blur-md shadow-inner">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="text-xs font-semibold gradient-text-accent tracking-wide">
                Next-Gen AI Aptitude & Assessment Engine
              </span>
            </motion.div>

            <motion.h1 variants={itemVariants} className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] text-white">
              Elevate Skills with <br />
              <span className="gradient-text">Intelligent Assessments</span>
            </motion.h1>

            <motion.p variants={itemVariants} className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
              An all-in-one assessment ecosystem. Generate multiple-choice aptitude tests with AI in seconds, host timed exams with real-time auto-saving, and inspect instant deterministic evaluations.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/dashboard"
                className="group relative inline-flex items-center space-x-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-brand-500/25 hover:shadow-brand-500/40 transition duration-300 border border-brand-400/30"
              >
                <span>Take Assessment</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition duration-200" />
              </Link>

              <Link
                href="/admin"
                className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 hover:text-white font-bold text-sm border border-slate-700/80 backdrop-blur-md transition duration-300 shadow-md"
              >
                <Cpu className="w-4 h-4 text-brand-400" />
                <span>Admin Console</span>
              </Link>
            </motion.div>

            {/* Micro badges */}
            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-6 pt-4 text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Deterministic Scoring</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                <span>Gemini AI Integration</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                <span>Live Timeout Protection</span>
              </div>
            </motion.div>
          </div>

          {/* Right Hero Visual Card */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-5 relative"
          >
            <div className="relative mx-auto max-w-sm rounded-3xl bg-slate-900/90 border border-slate-700/80 p-6 shadow-2xl backdrop-blur-2xl space-y-5 animate-float">
              {/* Header inside mockup */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-emerald-400">
                  <Clock className="w-3 h-3" />
                  <span>14:42 REMAINING</span>
                </div>
              </div>

              {/* Sample Question Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-md border border-brand-500/20">
                    Question 4 of 20
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">+1.0 Mark</span>
                </div>
                <p className="text-xs font-semibold text-slate-200 leading-snug">
                  A shopkeeper marks an article at ₹600 and offers a discount of 20%. What is the selling price?
                </p>
              </div>

              {/* Mock options */}
              <div className="space-y-2">
                {[
                  { label: 'A', text: '₹480', selected: true, correct: true },
                  { label: 'B', text: '₹500', selected: false },
                  { label: 'C', text: '₹460', selected: false },
                  { label: 'D', text: '₹520', selected: false },
                ].map((opt, i) => (
                  <div
                    key={i}
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition ${
                      opt.selected
                        ? 'bg-brand-500/20 border-brand-500/50 text-white shadow-xs'
                        : 'bg-slate-800/40 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className={`w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center ${
                        opt.selected ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {opt.label}
                      </span>
                      <span>{opt.text}</span>
                    </div>
                    {opt.selected && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </div>
                ))}
              </div>

              {/* Real-time sync badge */}
              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Auto-saved to cloud
                </span>
                <span className="text-slate-500">Progress: 85%</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Feature Grid with Glowing Glass Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card glass-card-hover p-8 rounded-3xl space-y-4 relative group"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-brand-500/25">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-brand-300 transition">
            AI Question Synthesis
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Generate customized questions across any topic (Percentage, Reasoning, English, Coding) by difficulty level with step-by-step explanations.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="glass-card glass-card-hover p-8 rounded-3xl space-y-4 relative group"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition">
            Timed Exam Engine
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Interactive test interface with live question palette, instant background answer synchronization, and auto-submit on countdown expiry.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="glass-card glass-card-hover p-8 rounded-3xl space-y-4 relative group"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/25">
            <BarChart3 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition">
            Automated Evaluation
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Instant deterministic score calculation, accuracy percentage, time diagnostics, and AI-driven recommendations for future improvement.
          </p>
        </motion.div>
      </div>

      {/* Assessment Workflow Visual Pipeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass-panel rounded-3xl p-8 sm:p-10 border border-slate-800 space-y-8"
      >
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">
            Operational Lifecycle
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Seamless End-to-End Workflow
          </h2>
          <p className="text-xs text-slate-400">
            Engineered for simplicity, reliability, and smooth candidate evaluation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { step: '01', title: 'Question Generation', desc: 'Create questions manually or generate them with AI by topic & difficulty.' },
            { step: '02', title: 'Assessment Setup', desc: 'Select questions from the bank, set test duration, and publish instantly.' },
            { step: '03', title: 'Timed Testing', desc: 'Candidates answer with timer countdown, palette navigation, and auto-save.' },
            { step: '04', title: 'Instant Analytics', desc: 'Deterministic score calculation, accuracy metrics, and question review.' },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 space-y-2 relative overflow-hidden"
            >
              <span className="text-3xl font-black text-slate-800 absolute right-4 bottom-2 select-none">
                {item.step}
              </span>
              <div className="text-xs font-bold text-brand-400">STEP {item.step}</div>
              <h4 className="font-bold text-white text-sm">{item.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
