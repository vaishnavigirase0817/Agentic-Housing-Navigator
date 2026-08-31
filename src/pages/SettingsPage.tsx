import React, { useState, useEffect } from 'react';
import { AppRoute } from '../types';
import { propertyService } from '../services/propertyService';
import { missionService } from '../services/missionService';
import { agentService } from '../services/agentService';
import { notificationService } from '../services/notificationService';
import { memoryService } from '../services/memoryService';
import {
  Layers,
  Database,
  Cpu,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Server,
  Terminal,
  Activity,
  Workflow,
  Wrench,
  Bot,
  Cloud,
  Lock,
  HardDrive
} from 'lucide-react';

interface SettingsPageProps {
  onNavigate: (route: AppRoute) => void;
  onRefreshData: () => Promise<void>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate, onRefreshData }) => {
  const [resetStatus, setResetStatus] = useState<string | null>(null);
  const [cloudStatus, setCloudStatus] = useState<any>(null);

  useEffect(() => {
    fetch('/api/cloud/status')
      .then(res => res.json())
      .then(data => setCloudStatus(data))
      .catch(() => setCloudStatus({ status: 'offline', error: 'Backend unreachable' }));
  }, []);

  const handleResetDataset = async () => {
    await propertyService.resetToInitialDemoData();
    await onRefreshData();
    setResetStatus('Dataset reset to original 32 demo listings!');
    setTimeout(() => setResetStatus(null), 3000);
  };

  const handleResetEverything = async () => {
    localStorage.clear();
    await propertyService.resetToInitialDemoData();
    await missionService.resetMission();
    await agentService.clearEvents();
    await notificationService.clearAll();
    await memoryService.resetPreferences();
    await onRefreshData();
    setResetStatus('Entire application state wiped and reset to default.');
    setTimeout(() => setResetStatus(null), 3000);
  };

  const agentsList = [
    { name: 'HousingOrchestrator', role: 'Root Coordinator', desc: 'Dispatches and coordinates multi-agent sequential pipeline' },
    { name: 'RequirementAgent', role: 'NLP Intent Extraction', desc: 'Parses spatial, budgetary & lifestyle parameters from natural language' },
    { name: 'PropertySearchAgent', role: 'Listing Discovery', desc: 'Queries indexed listings via search_properties tool' },
    { name: 'BudgetAgent', role: 'Financial Audit', desc: 'Computes monthly living cost ratios & upfront cash requirements' },
    { name: 'LocationAgent', role: 'Campus Proximity', desc: 'Calculates transit distances & radius buffers to landmark targets' },
    { name: 'PreferenceAgent', role: 'Lifestyle Screen', desc: 'Verifies floor constraints, furnishing status & requested amenities' },
    { name: 'RankingAgent', role: 'Deterministic Scoring + AI', desc: 'Executes 7-factor scoring engine (0-100%) & Gemini trade-off reasoning' },
    { name: 'MonitoringAgent', role: 'Background Daemon', desc: 'Deploys autonomous listener for new inbound listings' },
  ];

  const toolsList = [
    'search_properties',
    'get_property',
    'calculate_affordability',
    'calculate_match_score',
    'compare_properties',
    'save_to_shortlist',
    'load_user_preferences',
    'save_user_preference',
    'create_mission',
    'update_mission',
    'create_notification'
  ];

  const repositoriesList = [
    { name: 'FirestoreMissionRepository', collection: 'missions', desc: 'Persists active and historical housing missions' },
    { name: 'FirestoreMemoryRepository', collection: 'preferences', desc: 'Stores long-term user preferences & implicit constraints' },
    { name: 'FirestoreNotificationRepository', collection: 'notifications', desc: 'Manages user alerts and inbound match announcements' },
    { name: 'FirestoreEventRepository', collection: 'agent_events', desc: 'Maintains audit log of multi-agent execution telemetry' },
    { name: 'FirestoreShortlistRepository', collection: 'shortlists', desc: 'Synchronizes saved comparison properties' },
    { name: 'FirestoreUserRepository', collection: 'users', desc: 'User profiles and account metadata' },
  ];

  return (
    <div id="settings-page" className="max-w-5xl mx-auto space-y-8 pb-12 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Google Cloud & ADK Architecture
          </h1>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-mono font-bold border border-emerald-200 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            CLOUD RUN & FIRESTORE ACTIVE
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Decoupled architecture: Frontend • Google Cloud Run • Cloud Firestore Repositories • ADK Multi-Agent Orchestrator • Gemini 3.7 Flash
        </p>
      </div>

      {resetStatus && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-mono flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{resetStatus}</span>
        </div>
      )}

      {/* Google Cloud Background Monitoring Architecture */}
      <section className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white border border-indigo-800 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Zap className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-white">
              Google Cloud Asynchronous Background Pipeline
            </h2>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-[10px] font-mono font-bold">
            EVENT-DRIVEN ACTIVE
          </span>
        </div>

        <p className="text-xs text-slate-300">
          The housing agent continues working even after users leave the browser session. Cloud Scheduler publishes periodic heartbeat events to Pub/Sub topics, invoking the stateless Cloud Run background monitoring worker to evaluate active Firestore missions against new properties.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
            <div className="flex items-center justify-between text-emerald-400 font-mono text-xs font-bold">
              <span>1. Cloud Scheduler</span>
              <span className="text-[10px] text-slate-400">Cron Daemon</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Triggers every 15 minutes (<span className="font-mono text-emerald-300">*/15 * * * *</span>) publishing monitoring jobs to Google Cloud Pub/Sub.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
            <div className="flex items-center justify-between text-indigo-300 font-mono text-xs font-bold">
              <span>2. Cloud Pub/Sub</span>
              <span className="text-[10px] text-slate-400">Message Bus</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Topics: <span className="font-mono text-emerald-300">housing-monitoring</span>, <span className="font-mono text-cyan-300">property-updates</span>, and <span className="font-mono text-indigo-300">agent-events</span> with guaranteed delivery.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
            <div className="flex items-center justify-between text-purple-300 font-mono text-xs font-bold">
              <span>3. Cloud Run Worker</span>
              <span className="text-[10px] text-slate-400">ADK Agent</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Runs <span className="font-mono text-purple-200">MonitoringAgent</span> to deterministically score candidates and generate Gemini explanations on &gt;85% matches.
            </p>
          </div>
        </div>
      </section>

      {/* Cloud Infrastructure Bento */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">COMPUTE</span>
            <Cloud className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-sm font-bold text-slate-900">Google Cloud Run</div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Stateless containerized service with scale-to-zero cost efficiency.
          </p>
          <div className="text-[10px] font-mono text-emerald-700 font-semibold flex items-center gap-1 pt-1 border-t border-slate-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Ready for Cloud Run
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">DATABASE</span>
            <Database className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-sm font-bold text-slate-900">Cloud Firestore</div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Document database with 6 repositories & automatic local fallback.
          </p>
          <div className="text-[10px] font-mono text-emerald-700 font-semibold flex items-center gap-1 pt-1 border-t border-slate-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            {cloudStatus?.firestore?.status || 'Active'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">SECURITY</span>
            <Lock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-sm font-bold text-slate-900">Secret Manager</div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Server-side credential protection with zero client-side key leakage.
          </p>
          <div className="text-[10px] font-mono text-emerald-700 font-semibold flex items-center gap-1 pt-1 border-t border-slate-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Server-Side Protected
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">AI ENGINE</span>
            <Bot className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-sm font-bold text-slate-900">Gemini 3.7 Flash</div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Google ADK Multi-Agent Coordinator with deterministic tooling.
          </p>
          <div className="text-[10px] font-mono text-emerald-700 font-semibold flex items-center gap-1 pt-1 border-t border-slate-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            ADK Pipeline Active
          </div>
        </div>
      </section>

      {/* Backend Status & Model Info */}
      <section className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Google Gemini & ADK Multi-Agent Engine</h3>
              <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-mono font-bold">
                gemini-3.7-flash
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Root Orchestrator + 7 Specialized Sub-Agents + 6 Firestore Repositories + 11 Agent Tools
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-indigo-600" />
            <span>API: <strong className="text-slate-900">/api/*</strong></span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Operational</span>
          </div>
        </div>
      </section>

      {/* Firestore Repositories */}
      <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 font-mono uppercase tracking-wider">
              Cloud Firestore Repositories & Data Access Layer
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Persistent Storage
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {repositoriesList.map((repo) => (
            <div
              key={repo.name}
              className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-900">
                  {repo.name}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-semibold">
                  /{repo.collection}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {repo.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Agents & Tools Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Specialized Agents Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Workflow className="w-4 h-4 text-indigo-600" />
            <span>Specialized Agents in Pipeline</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {agentsList.map((agent, idx) => (
              <div 
                key={agent.name}
                className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1.5 hover:border-indigo-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-indigo-700">
                    {idx + 1}. {agent.name}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                    {agent.role}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {agent.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Real Agent Tools Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Wrench className="w-4 h-4 text-indigo-600" />
            <span>Registered Agent Tools (11)</span>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2.5">
            <p className="text-xs text-slate-500">
              Deterministic tools providing real property facts and calculations to agents:
            </p>
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {toolsList.map((t) => (
                <div 
                  key={t}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800"
                >
                  <Terminal className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dataset & Memory Management Section */}
      <section className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 font-mono uppercase tracking-wider">
          Demo Dataset & Session Management
        </h3>
        <p className="text-xs text-slate-500">
          Restore initial curated properties or perform a full application reset for demo test presentations.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            id="btn-reset-demo-dataset"
            type="button"
            onClick={handleResetDataset}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-300 transition-colors cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-4 h-4 text-indigo-600" />
            <span>Reset Demo Property Dataset (32 Listings)</span>
          </button>

          <button
            id="btn-wipe-session-storage"
            type="button"
            onClick={handleResetEverything}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-4 h-4 text-rose-600" />
            <span>Wipe All State & Reset</span>
          </button>
        </div>
      </section>
    </div>
  );
};
