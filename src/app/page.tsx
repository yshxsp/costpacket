import Link from 'next/link';
import { ArrowRight, Hammer, CheckCircle, BarChart3, Receipt } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4 flex justify-between items-center backdrop-blur-md bg-black/50 sticky top-0 z-50">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-white">
          <Hammer className="text-orange-500 w-6 h-6" />
          BuildOps <span className="text-indigo-500">Lite</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">Log In</Link>
          <Link href="/signup" className="text-sm font-medium bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20">
            Get Started Free
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-orange-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-xs text-orange-400 mb-8 font-medium">
           <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
          </span>
          Modern Tech Stack for 2026 Resumes
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl text-white">
          Manage <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Contractors</span>.<br />
          Automate <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-600">Payments</span>.
        </h1>
        
        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-10 text-balance leading-relaxed">
          The ultimate B2B SaaS platform to track construction subcontracts, parse receipts using AI, and automate payouts.
        </p>
        
        <div className="flex sm:flex-row flex-col gap-4">
          <Link href="/signup" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20 group">
            Start for Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/login" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all">
            Sign In
          </Link>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-5xl w-full text-left">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md hover:bg-white/10 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-orange-500/20 text-orange-500 flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg text-white mb-2">Project Tracking</h3>
            <p className="text-zinc-400 text-sm">Assign tasks to plumbers and electricians. Real-time updates directly from the job site.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md hover:bg-white/10 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-indigo-500/20 text-indigo-500 flex items-center justify-center mb-4">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg text-white mb-2">AI Vision Receipts</h3>
            <p className="text-zinc-400 text-sm">Snap a photo of hardware store bills. AI extracts line items, totals, and automatically logs expenses.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md hover:bg-white/10 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-green-500/20 text-green-500 flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg text-white mb-2">Stripe Connect</h3>
            <p className="text-zinc-400 text-sm">Single click approvals that automatically route money to the subcontractor's bank account.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
