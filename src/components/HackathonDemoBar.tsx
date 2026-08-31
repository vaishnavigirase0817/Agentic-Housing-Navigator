import React, { useState } from 'react';
import { AppRoute, Mission } from '../types';
import {
  Sparkles,
  Zap,
  Play,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Radio,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

interface HackathonDemoBarProps {
  currentRoute: AppRoute;
  mission: Mission | null;
  onNavigate: (route: AppRoute) => void;
  onTriggerBackgroundCheck: () => void;
  isTriggeringBackground: boolean;
  onLoadSampleMission?: () => void;
}

export const HackathonDemoBar: React.FC<HackathonDemoBarProps> = ({
  currentRoute,
  mission,
  onNavigate,
  onTriggerBackgroundCheck,
  isTriggeringBackground,
  onLoadSampleMission
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const demoSteps = [
    {
      num: '1',
      title: 'Create Mission',
      route: 'create-mission' as AppRoute,
      desc: 'Gemini NLP parses messy prompt into 7 structured constraints'
    },
    {
      num: '2',
      title: 'Agent Execution',
      route: 'active-mission' as AppRoute,
      desc: 'Orchestrator coordinates Search, Evaluation & 7-factor Ranking'
    },
    {
      num: '3',
      title: 'Ranked Matches',
      route: 'active-mission' as AppRoute,
      desc: 'Deterministic scoring with verified advantages and trade-offs'
    },
    {
      num: '4',
      title: 'Memory & Profile',
      route: 'preferences' as AppRoute,
      desc: 'Cross-session Firestore memory learns floor & pet constraints'
    },
    {
      num: '5',
      title: 'Pub/Sub Monitoring',
      route: 'settings' as AppRoute,
      desc: 'Cloud Scheduler + Pub/Sub triggers Cloud Run worker asynchronously'
    },
    {
      num: '6',
      title: 'Observability',
      route: 'activity' as AppRoute,
      desc: 'Real-time telemetry trace spans, latency & sanitized payloads'
    }
  ];

  return (
    <div
      id="hackathon-demo-guide-bar"
      className="bg-slate-900 border-b border-indigo-900/60 text-white shadow-md transition-all sticky top-16 z-30"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        {/* Collapsed/Expanded Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-indigo-600/80 border border-indigo-400/40 text-[11px] font-mono font-bold tracking-wider uppercase text-indigo-100">
                Hackathon Demo Mode
              </span>
              <span className="text-xs font-semibold text-slate-200 hidden md:inline">
                End-to-End Autonomous Workflow Showcase
              </span>
            </div>
          </div>

          {/* Quick Demo Controls */}
          <div className="flex items-center gap-2">
            <button
              id="btn-demo-trigger-pubsub"
              type="button"
              onClick={onTriggerBackgroundCheck}
              disabled={isTriggeringBackground}
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-50 text-white text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="Publish simulated property update to Google Cloud Pub/Sub"
            >
              <Zap className={`w-3.5 h-3.5 ${isTriggeringBackground ? 'animate-spin' : 'text-emerald-200'}`} />
              <span>{isTriggeringBackground ? 'Publishing...' : 'Trigger Background Event'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white text-xs flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span className="text-[11px] font-mono">{isExpanded ? 'Hide Steps' : 'Show Walkthrough'}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Step-by-Step Judge Walkthrough Strip */}
        {isExpanded && (
          <div className="pt-2.5 pb-1 mt-2 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
            {demoSteps.map((step, idx) => {
              const isCurrent =
                (step.route === currentRoute) ||
                (step.route === 'active-mission' && currentRoute === 'active-mission');

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onNavigate(step.route)}
                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                    isCurrent
                      ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-xs'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-white/10 text-indigo-300">
                      Step {step.num}
                    </span>
                    {isCurrent && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  </div>
                  <div className="font-bold text-[11px] text-white line-clamp-1">{step.title}</div>
                  <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 leading-tight">{step.desc}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
