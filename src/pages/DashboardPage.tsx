import React from 'react';
import { AppRoute, Mission, Property, MatchEvaluation, AgentActivityEvent } from '../types';
import { AgentStatusBadge } from '../components/AgentStatusBadge';
import { PropertyCard } from '../components/PropertyCard';
import {
  Compass,
  PlusCircle,
  Activity,
  Heart,
  Radar,
  ArrowRight,
  Sparkles,
  Zap,
  TrendingUp,
  ShieldCheck,
  Building2,
  Clock,
  ExternalLink,
  ChevronRight,
  Database
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (route: AppRoute) => void;
  activeMission: Mission | null;
  properties: Property[];
  scores: Record<string, MatchEvaluation>;
  shortlist: string[];
  onToggleShortlist: (id: string) => void;
  onViewDetails: (id: string) => void;
  recentActivity: AgentActivityEvent[];
  onSimulateListing: () => void;
  isSimulating: boolean;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  activeMission,
  properties,
  scores,
  shortlist,
  onToggleShortlist,
  onViewDetails,
  recentActivity,
  onSimulateListing,
  isSimulating
}) => {
  // Sort properties by score if available, or take top matches
  const sortedProperties = [...properties].sort((a, b) => {
    const sA = scores[a.id]?.totalScore ?? 0;
    const sB = scores[b.id]?.totalScore ?? 0;
    return sB - sA;
  });

  const topMatches = sortedProperties.slice(0, 4);
  const shortlistedProps = properties.filter((p) => shortlist.includes(p.id));

  return (
    <div id="dashboard-page" className="space-y-8 pb-12 animate-in fade-in duration-200">
      {/* Top Banner / Mission Status Widget */}
      <section className="relative rounded-2xl bg-gradient-to-r from-indigo-50/70 via-white to-emerald-50/40 border border-slate-200 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-indigo-700 uppercase tracking-wider">
                Operational Dashboard
              </span>
              <AgentStatusBadge status={activeMission?.status || 'IDLE'} showDetail={true} />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {activeMission ? activeMission.title : 'Agent Standby • Ready for Housing Mission'}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600">
              {activeMission
                ? `Autonomous search engine active. ${activeMission.monitoring.totalEvaluated} properties evaluated across 7 weighted scoring factors.`
                : 'No active mission configured. Launch a mission using natural language or structured constraints.'}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {activeMission ? (
              <button
                id="btn-dash-view-active-mission"
                type="button"
                onClick={() => onNavigate('active-mission')}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Activity className="w-4 h-4" />
                <span>View Mission Workflow</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                id="btn-dash-create-mission"
                type="button"
                onClick={() => onNavigate('create-mission')}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create New Mission</span>
              </button>
            )}

            <button
              id="btn-dash-simulate-quick"
              type="button"
              onClick={onSimulateListing}
              disabled={isSimulating}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-sm ring-1 ring-emerald-500"
              title="Demo: Trigger Google Cloud Background Check immediately"
            >
              <Zap className={`w-4 h-4 text-white ${isSimulating ? 'animate-spin' : ''}`} />
              <span>Demo: Trigger Background Check</span>
            </button>
          </div>
        </div>

        {/* Active Mission Mini Stage Progress Bar */}
        {activeMission && (
          <div className="mt-5 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-2">
              <span>WORKFLOW STAGE PROGRESS</span>
              <span className="text-emerald-700 font-bold">
                {activeMission.stages.filter((s) => s.status === 'completed').length} / {activeMission.stages.length} Completed
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
              {activeMission.stages.map((stage) => {
                const isDone = stage.status === 'completed';
                const isCurr = stage.status === 'in-progress';
                return (
                  <div
                    key={stage.id}
                    className={`h-2 rounded-full transition-all ${
                      isDone
                        ? 'bg-emerald-500'
                        : isCurr
                        ? 'bg-indigo-600 animate-pulse'
                        : 'bg-slate-200'
                    }`}
                    title={`${stage.name} (${stage.status})`}
                  />
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Metrics Row */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500">
            <span>INDEXED LISTINGS</span>
            <Database className="w-4 h-4 text-cyan-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 font-mono">{properties.length}</p>
          <p className="text-[11px] text-slate-500">Demo Property Dataset</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500">
            <span>TOP MATCH SCORE</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 font-mono">
            {sortedProperties[0] && scores[sortedProperties[0].id]?.totalScore !== undefined
              ? `${scores[sortedProperties[0].id]?.totalScore}%`
              : '96%'}
          </p>
          <p className="text-[11px] text-emerald-600 font-medium">Deterministic Match</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500">
            <span>SHORTLISTED</span>
            <Heart className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 font-mono">{shortlist.length}</p>
          <p className="text-[11px] text-slate-500">Saved for Comparison</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500">
            <span>MONITORING</span>
            <Radar className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 font-mono">
            {activeMission?.monitoring?.isActive ? 'ACTIVE' : 'READY'}
          </p>
          <p className="text-[11px] text-slate-500">Daemon Polling</p>
        </div>
      </section>

      {/* Main Grid: Top Recommended Properties (Left) & Monitoring / Telemetry (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Top Matches */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Top Recommended Matches</h2>
              <p className="text-xs text-slate-500">
                Ranked by budget, campus proximity, layout, and amenities
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('search')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>View All ({properties.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {topMatches.map((property) => (
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
        </div>

        {/* Right 1 Col: Monitoring Daemon & Live Telemetry Feed */}
        <div className="space-y-6">
          {/* Continuous Monitoring Widget */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-emerald-700 flex items-center gap-1.5">
                <Radar className="w-4 h-4 animate-spin text-emerald-600" />
                AUTONOMOUS DAEMON
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-mono font-bold">
                EVERY 15 MIN
              </span>
            </div>

            <h3 className="text-sm font-bold text-slate-900">Continuous Housing Watch</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              The agent daemon evaluates newly posted properties and alerts you immediately if a listing matches your budget and radius.
            </p>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Last Polled:</span>
                <span className="text-slate-900 font-medium">Just now</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Evaluated Today:</span>
                <span className="text-emerald-700 font-bold">
                  {activeMission?.monitoring.totalEvaluated || properties.length} properties
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>New High Matches:</span>
                <span className="text-indigo-700 font-bold">
                  {activeMission?.monitoring.newMatchesFound || 1}
                </span>
              </div>
            </div>

            <button
              id="btn-dash-sim-trigger-right"
              type="button"
              onClick={onSimulateListing}
              disabled={isSimulating}
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50 font-mono"
            >
              <Zap className={`w-4 h-4 text-white ${isSimulating ? 'animate-spin' : ''}`} />
              <span>Demo: Trigger Background Check</span>
            </button>
          </div>

          {/* Live Agent Activity Feed */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                Live Agent Activity
              </h3>

              <button
                type="button"
                onClick={() => onNavigate('activity')}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
              >
                View Full Log →
              </button>
            </div>

            <div className="space-y-2.5">
              {recentActivity.slice(0, 4).map((evt) => (
                <div
                  key={evt.id}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span className="font-bold text-indigo-700">{evt.taskName}</span>
                    <span>{new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-slate-700 text-[11px] leading-relaxed line-clamp-2">
                    {evt.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
