import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'PK Assessment Hub — Next-Gen AI Assessment Platform',
  description: 'AI-powered aptitude testing, intelligent question generation, and real-time automated assessment analytics.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="text-slate-100 min-h-screen flex flex-col font-sans antialiased selection:bg-brand-500 selection:text-white">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          {children}
        </main>
        <footer className="border-t border-slate-800/80 bg-navy-950/70 backdrop-blur-md py-8 text-center text-xs text-slate-500 relative z-10">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-slate-300 tracking-wide">PK Assessment Hub</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">Next-Gen AI Evaluation Suite</span>
            </div>
            <div className="flex items-center space-x-4 text-slate-500">
              <span>Deterministic MCQ Engine</span>
              <span>•</span>
              <span>Gemini AI Integration</span>
              <span>•</span>
              <span>&copy; {new Date().getFullYear()}</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
