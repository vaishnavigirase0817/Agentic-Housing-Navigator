import React, { useState } from 'react';
import { AppRoute, Mission, Property, MatchEvaluation, AgentActivityEvent } from '../types';
import { AgentStatusBadge } from '../components/AgentStatusBadge';
import { PropertyCard } from '../components/PropertyCard';
import {
  Activity,
  CheckCircle2,
  Clock,
  Radar,
  Sparkles,
  Zap,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Building2,
  TrendingUp,
  MapPin,
  Eye,
  Heart,
  HelpCircle,
  Database,
  Brain
} from 'lucide-react';

interface ActiveMissionPageProps {
  onNavigate: (route: AppRoute) => void;
  mission: Mission | null;
  properties: Property[];
  scores: Record<string, MatchEvaluation>;
  shortlist: string[];
  onToggleShortlist: (id: string) => void;
  onViewDetails: (id: string) => void;
  onSimulateListing: () => void;
  onResetMission: () => void;
  recentActivity: AgentActivityEvent[];
  isSimulating: boolean;
}

export const ActiveMissionPage: React.FC<ActiveMissionPageProps> = ({
  onNavigate,
  mission,
  properties,
  scores,
  shortlist,
  onToggleShortlist,
  onViewDetails,
  onSimulateListing,
  onResetMission,
  recentActivity,
  isSimulating
}) => {
  const [selectedScoreFilter, setSelectedScoreFilter] = useState<'all' | 'high' | 'stretch'>('all');

  if (!mission) {
    return (
      <div id="active-mission-empty" className="text-center py-16 space-y-4 animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-500">
          <Activity className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">No Active Mission Running</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          You haven't launched a housing search mission yet. Start one to see the 8-stage autonomous pipeline in action.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('create-mission')}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <span>Create Mission Now</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Filter properties based on mission matches
  const matchedProps = properties
    .filter((p) => mission.matchedPropertyIds.includes(p.id))
    .filter((p) => !mission.dismissedPropertyIds?.includes(p.id))
    .sort((a, b) => {
      const sA = scores[a.id]?.totalScore ?? 0;
      const sB = scores[b.id]?.totalScore ?? 0;
      return sB - sA;
    });

  const filteredProps = matchedProps.filter((p) => {
    const sc = scores[p.id]?.totalScore ?? 0;
    if (selectedScoreFilter === 'high') return sc >= 85;
    if (selectedScoreFilter === 'stretch') return sc >= 70 && sc < 85;
    return true;
  });

  return (
    <div id="active-mission-page" className="space-y-8 pb-12 animate-in fade-in duration-200">
      {/* Top Mission Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold text-indigo-700 uppercase tracking-wider">
              MISSION CONTROLLER
            </span>
            <AgentStatusBadge status={mission.status} showDetail={true} />
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {mission.title}
          </h1>

          <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap font-mono">
            <span>Max Budget: ₹{mission.requirements.maxBudget.toLocaleString('en-IN')}/mo</span>
            <span>•</span>
            <span>Distance: ≤ {mission.requirements.maxDistanceKm} km</span>
            <span>•</span>
            <span>Furnishing: {mission.requirements.furnishing}</span>
            {mission.requirements.avoidGroundFloor && (
              <>
                <span>•</span>
                <span className="text-amber-700 font-semibold">Avoid Ground Floor</span>
              </>
            )}
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
              <Database className="w-3 h-3 text-emerald-600" />
              Cloud Firestore Synced
            </span>
          </div>

          {((mission.appliedMemoryNotes && mission.appliedMemoryNotes.length > 0) || (mission.requirements.appliedMemoryNotes && mission.requirements.appliedMemoryNotes.length > 0)) && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-medium">
              <Brain className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>
                <strong className="font-semibold text-indigo-700 font-mono">Persistent Memory:</strong>{' '}
                {(mission.appliedMemoryNotes || mission.requirements.appliedMemoryNotes || []).join(' • ')}
              </span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-active-simulate-match"
            type="button"
            onClick={onSimulateListing}
            disabled={isSimulating}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-mono font-bold flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-sm ring-1 ring-emerald-500"
            title="Publishes Pub/Sub event to Cloud Run Monitoring Worker immediately"
          >
            <Zap className={`w-4 h-4 text-white ${isSimulating ? 'animate-spin' : ''}`} />
            <span>Demo: Trigger Background Check</span>
          </button>

          <button
            id="btn-edit-mission-params"
            type="button"
            onClick={() => onNavigate('create-mission')}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>New Mission</span>
          </button>

          <button
            id="btn-reset-mission"
            type="button"
            onClick={onResetMission}
            className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-300 transition-colors cursor-pointer"
            title="Reset active mission"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Google Cloud Asynchronous Background Monitoring Status Widget */}
      <section className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white border border-emerald-800/60 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-800/40">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400">
              <Radar className="w-4 h-4 animate-spin text-emerald-400" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-emerald-400 tracking-wider uppercase">
                  Google Cloud Infrastructure
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-mono text-[10px] font-bold">
                  Monitoring Active
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Cloud Scheduler → Pub/Sub (<span className="text-emerald-300 font-mono">housing-monitoring</span>) → Cloud Run Worker (<span className="text-indigo-300 font-mono">ADK MonitoringAgent</span>)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-trigger-monitoring-cloud"
              type="button"
              onClick={onSimulateListing}
              disabled={isSimulating}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Zap className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>Demo: Trigger Background Check</span>
            </button>
          </div>
        </div>

        {/* 5-Column Live Monitoring Telemetry Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400">Daemon Status</span>
            <div className="flex items-center gap-1.5 text-emerald-400 font-mono font-bold text-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Monitoring Active</span>
            </div>
            <span className="text-[10px] text-slate-400">Scale-to-Zero Cloud Run</span>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400">Last Background Check</span>
            <div className="text-slate-100 font-mono font-bold text-sm">
              {mission.monitoring?.lastChecked
                ? new Date(mission.monitoring.lastChecked).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                : 'Just now'}
            </div>
            <span className="text-[10px] text-emerald-300 font-mono">Firestore synced</span>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400">Next Scheduled Check</span>
            <div className="text-slate-100 font-mono font-bold text-sm">
              {mission.monitoring?.nextCheck
                ? new Date(mission.monitoring.nextCheck).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'In ~15 min'}
            </div>
            <span className="text-[10px] text-slate-400">Cloud Scheduler Cron</span>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400">Properties Evaluated</span>
            <div className="text-cyan-300 font-mono font-bold text-sm">
              {mission.monitoring?.totalEvaluated || properties.length} properties
            </div>
            <span className="text-[10px] text-slate-400">Multi-factor scoring</span>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400">New Matches / Notifs</span>
            <div className="text-amber-300 font-mono font-bold text-sm">
              {mission.monitoring?.newMatchesFound || 0} Matches
            </div>
            <button
              type="button"
              onClick={() => onNavigate('notifications')}
              className="text-[10px] text-indigo-300 hover:text-indigo-200 underline font-mono cursor-pointer"
            >
              View Notifications →
            </button>
          </div>
        </div>
      </section>

      {/* 8-Stage Workflow Stepper */}
      <section className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900 font-mono uppercase tracking-wider">
              Autonomous 8-Stage Execution Pipeline
            </h2>
          </div>
          <span className="text-xs font-mono text-emerald-700 font-bold">
            {mission.stages.filter((s) => s.status === 'completed').length} / {mission.stages.length} Stages Completed
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {mission.stages.map((stage, index) => {
            const isCompleted = stage.status === 'completed';
            const isInProgress = stage.status === 'in-progress';
            const isPending = stage.status === 'pending';

            return (
              <div
                key={stage.id}
                id={`stage-card-${index + 1}`}
                className={`p-3.5 rounded-xl border transition-all space-y-1.5 ${
                  isCompleted
                    ? 'bg-emerald-50/60 border-emerald-300'
                    : isInProgress
                    ? 'bg-indigo-50/70 border-indigo-400 ring-1 ring-indigo-300 animate-pulse'
                    : 'bg-slate-50 border-slate-200 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="font-bold text-slate-600">STAGE {index + 1}</span>
                  {isCompleted ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      DONE
                    </span>
                  ) : isInProgress ? (
                    <span className="text-indigo-700 font-bold">RUNNING</span>
                  ) : (
                    <span className="text-slate-400">STANDBY</span>
                  )}
                </div>

                <h3 className="text-xs font-bold text-slate-900">{stage.name}</h3>

                <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                  {stage.detail}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Ranked Properties Section */}
      <section className="space-y-4">
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Ranked Recommendation List</h2>
            <p className="text-xs text-slate-500">
              Evaluated with deterministic multi-factor scoring (Budget 30%, Location 25%, Layout 15%, etc.)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedScoreFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors cursor-pointer ${
                selectedScoreFilter === 'all'
                  ? 'bg-indigo-600 border-indigo-600 text-white font-semibold'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              All Matches ({matchedProps.length})
            </button>

            <button
              type="button"
              onClick={() => setSelectedScoreFilter('high')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors cursor-pointer ${
                selectedScoreFilter === 'high'
                  ? 'bg-emerald-600 border-emerald-600 text-white font-semibold'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Top Tier (≥85%)
            </button>

            <button
              type="button"
              onClick={() => setSelectedScoreFilter('stretch')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors cursor-pointer ${
                selectedScoreFilter === 'stretch'
                  ? 'bg-indigo-600 border-indigo-600 text-white font-semibold'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Good Matches (70-84%)
            </button>
          </div>
        </div>

        {/* Property Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProps.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              evaluation={scores[property.id]}
              isShortlisted={shortlist.includes(property.id)}
              onToggleShortlist={onToggleShortlist}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      </section>

      {/* Live Agent Telemetry & Log Stream */}
      <section className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radar className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900 font-mono uppercase tracking-wider">
              Agent Telemetry Stream
            </h3>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('activity')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
          >
            View Complete Logs →
          </button>
        </div>

        <div className="space-y-2">
          {recentActivity.slice(0, 5).map((evt) => (
            <div
              key={evt.id}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                <span className="font-bold text-indigo-700">{evt.taskName}</span>
                <span className="text-slate-400 hidden sm:inline">—</span>
                <span className="text-slate-700 font-sans text-xs">{evt.description}</span>
              </div>

              <span className="text-[11px] text-slate-500 shrink-0 self-end sm:self-auto">
                {new Date(evt.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
