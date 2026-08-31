import React from 'react';
import { MissionStatus } from '../types';
import { 
  Bot, 
  Sparkles, 
  Search, 
  Cpu, 
  BarChart3, 
  Radar, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface AgentStatusBadgeProps {
  status: MissionStatus;
  className?: string;
  showDetail?: boolean;
}

export const AgentStatusBadge: React.FC<AgentStatusBadgeProps> = ({
  status,
  className = '',
  showDetail = false
}) => {
  const config = {
    IDLE: {
      label: 'STANDBY',
      detail: 'Agent is ready for a new housing mission',
      bg: 'bg-slate-100 border-slate-300 text-slate-700',
      dot: 'bg-slate-500',
      icon: Bot
    },
    THINKING: {
      label: 'UNDERSTANDING',
      detail: 'Parsing requirements & constraints',
      bg: 'bg-amber-50 border-amber-300 text-amber-800',
      dot: 'bg-amber-500 animate-ping',
      icon: Sparkles
    },
    SEARCHING: {
      label: 'SEARCHING DATASET',
      detail: 'Querying indexed demo property listings',
      bg: 'bg-blue-50 border-blue-300 text-blue-800',
      dot: 'bg-blue-500 animate-pulse',
      icon: Search
    },
    EVALUATING: {
      label: 'EVALUATING RULES',
      detail: 'Applying budget, location & floor filters',
      bg: 'bg-indigo-50 border-indigo-300 text-indigo-800',
      dot: 'bg-indigo-500 animate-pulse',
      icon: Cpu
    },
    RANKING: {
      label: 'RANKING MATCHES',
      detail: 'Calculating deterministic match scores (0-100%)',
      bg: 'bg-purple-50 border-purple-300 text-purple-800',
      dot: 'bg-purple-500 animate-pulse',
      icon: BarChart3
    },
    MONITORING: {
      label: 'MONITORING ACTIVE',
      detail: 'Continuous daemon watching for new listings',
      bg: 'bg-emerald-50 border-emerald-300 text-emerald-800',
      dot: 'bg-emerald-500 animate-ping',
      icon: Radar
    },
    COMPLETED: {
      label: 'MISSION COMPLETED',
      detail: 'Shortlist compiled and recommendations ready',
      bg: 'bg-teal-50 border-teal-300 text-teal-800',
      dot: 'bg-teal-500',
      icon: CheckCircle2
    },
    ERROR: {
      label: 'ERROR',
      detail: 'An issue occurred during mission execution',
      bg: 'bg-rose-50 border-rose-300 text-rose-800',
      dot: 'bg-rose-500',
      icon: AlertCircle
    }
  }[status] || {
    label: status,
    detail: '',
    bg: 'bg-slate-100 border-slate-300 text-slate-700',
    dot: 'bg-slate-500',
    icon: Bot
  };

  const Icon = config.icon;

  return (
    <div
      id={`agent-status-badge-${status.toLowerCase()}`}
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border backdrop-blur-md text-xs font-mono tracking-wide ${config.bg} ${className}`}
      title={config.detail}
    >
      <span className="relative flex h-2 w-2">
        <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dot}`} />
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot.replace('animate-ping', '').replace('animate-pulse', '')}`} />
      </span>
      <Icon className="w-3.5 h-3.5" />
      <span className="font-semibold uppercase">{config.label}</span>
      {showDetail && (
        <span className="hidden md:inline text-slate-600 border-l border-slate-300 pl-2 ml-1 text-[11px] normal-case font-sans">
          {config.detail}
        </span>
      )}
    </div>
  );
};
