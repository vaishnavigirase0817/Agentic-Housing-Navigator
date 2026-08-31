import React from 'react';
import { AppRoute, Mission } from '../types';
import { 
  Compass, 
  Sparkles, 
  ArrowRight, 
  Brain, 
  Scale, 
  Radar, 
  CheckCircle2, 
  ShieldCheck, 
  Database,
  Layers,
  Zap,
  MapPin,
  TrendingUp
} from 'lucide-react';
import { AgentStatusBadge } from '../components/AgentStatusBadge';

interface LandingPageProps {
  onNavigate: (route: AppRoute) => void;
  activeMission: Mission | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, activeMission }) => {
  return (
    <div id="landing-page" className="space-y-16 pb-12 animate-in fade-in duration-300">
      {/* Hero Section */}
      <section className="relative pt-6 sm:pt-12 text-center max-w-4xl mx-auto space-y-6">
        {/* Hackathon Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-mono font-medium">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>All Things Agentic Hackathon • Autonomous Workflow System</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight font-display leading-[1.15]">
          Your housing search, <br />
          <span className="bg-gradient-to-r from-indigo-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
            on autopilot.
          </span>
        </h1>

        {/* Supporting Text */}
        <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Tell your agent what you need. It searches, evaluates, ranks, remembers, and keeps watching for better matches.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            id="btn-landing-create-mission"
            type="button"
            onClick={() => onNavigate('create-mission')}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <span>Create Housing Mission</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            id="btn-landing-explore-demo"
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Database className="w-4 h-4 text-cyan-600" />
            <span>Explore Demo Dashboard</span>
          </button>
        </div>

        {/* Transparent Dataset Notice */}
        <div className="pt-2">
          <p className="text-xs text-slate-500 font-mono flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-500" />
            Phase 1 Prototype indexes 32 curated properties with deterministic scoring & live simulation daemon.
          </p>
        </div>
      </section>

      {/* Active Agent Mission Preview Card */}
      <section className="max-w-4xl mx-auto">
        <div className="relative rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-lg overflow-hidden">
          {/* Subtle Ambient Accent */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-100/60 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-100/60 rounded-full blur-3xl pointer-events-none" />

          <div className="relative space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-indigo-600 uppercase tracking-wider font-bold">
                    Mission Execution Preview
                  </span>
                  <AgentStatusBadge status={activeMission?.status || 'MONITORING'} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {activeMission?.title || '2BHK • ₹15,000 max • Near College Campus'}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => onNavigate(activeMission ? 'active-mission' : 'create-mission')}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold self-start sm:self-auto border border-slate-300 transition-colors cursor-pointer"
              >
                {activeMission ? 'View Live Mission →' : 'Launch This Mission →'}
              </button>
            </div>

            {/* Natural Language Prompt Example Banner */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-700 flex items-start gap-3">
              <span className="text-indigo-600 font-bold shrink-0">PROMPT:</span>
              <span className="text-slate-800 italic">
                "Find me a furnished 2BHK under ₹15,000 near my college, preferably within 3 km, available next month."
              </span>
            </div>

            {/* Workflow Progress Steps */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 font-semibold">
                  <span>1. UNDERSTAND</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <p className="text-xs font-bold text-slate-900">Gemini 3.7 Flash</p>
                <p className="text-[11px] text-slate-500">Parsed 8 constraints</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 font-semibold">
                  <span>2. SEARCH</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <p className="text-xs font-bold text-slate-900">Demo Dataset</p>
                <p className="text-[11px] text-slate-500">32 properties indexed</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 font-semibold">
                  <span>3. RANK</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <p className="text-xs font-bold text-slate-900">Deterministic Math</p>
                <p className="text-[11px] text-slate-500">Top match: 96% score</p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-emerald-800 font-semibold">
                  <span>4. MONITOR</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <p className="text-xs font-bold text-emerald-900">Active Daemon</p>
                <p className="text-[11px] text-emerald-700">Polling every 15m</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Major Capabilities Section */}
      <section className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display">
            Autonomous Housing Search Capabilities
          </h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            Unlike a basic chatbot, this agent executes a full end-to-end mission workflow with deterministic scoring and live listing detection.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Capability 1: Understand */}
          <div
            id="feature-understand"
            className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all space-y-4 shadow-sm"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Brain className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-indigo-600 font-bold uppercase tracking-wider">
                01 • Multi-Modal Parsing
              </span>
              <h3 className="text-lg font-bold text-slate-900">Understand</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Extracts precise structured constraints from plain language — including budget thresholds, geodesic distance limits, floor preferences, and furnishing requirements.
            </p>
            <div className="pt-2 border-t border-slate-200 text-[11px] font-mono text-slate-500">
              Powered by Server-Side Gemini 3.7 Flash + Local Fallback
            </div>
          </div>

          {/* Capability 2: Decide */}
          <div
            id="feature-decide"
            className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all space-y-4 shadow-sm"
          >
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
              <Scale className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-teal-600 font-bold uppercase tracking-wider">
                02 • Deterministic Evaluation
              </span>
              <h3 className="text-lg font-bold text-slate-900">Decide</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Applies a 7-factor weighted scoring algorithm (Budget 30%, Location 25%, Layout 15%, etc.) to compute verifiable 0-100% match scores and generate clear trade-off rationales.
            </p>
            <div className="pt-2 border-t border-slate-200 text-[11px] font-mono text-slate-500">
              Transparent, audit-ready math engine
            </div>
          </div>

          {/* Capability 3: Monitor */}
          <div
            id="feature-monitor"
            className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all space-y-4 shadow-sm"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Radar className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-emerald-600 font-bold uppercase tracking-wider">
                03 • Continuous Daemon
              </span>
              <h3 className="text-lg font-bold text-slate-900">Monitor</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Keeps running on your behalf. When newly posted properties match your requirements, the monitoring daemon scores them and triggers real-time alerts.
            </p>
            <div className="pt-2 border-t border-slate-200 text-[11px] font-mono text-slate-500">
              Includes interactive "Simulate Listing" demo tool
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="max-w-4xl mx-auto text-center p-8 rounded-2xl bg-gradient-to-r from-indigo-50 via-slate-50 to-emerald-50 border border-indigo-200 space-y-4 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900 font-display">
          Ready to launch your autonomous housing mission?
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
          Experience the complete workflow from natural-language parsing to deterministic ranking and monitoring.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('create-mission')}
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs inline-flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <span>Start Mission Now</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>
    </div>
  );
};
