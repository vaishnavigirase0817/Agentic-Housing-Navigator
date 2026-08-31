import React from 'react';
import { AppRoute, MissionStatus, UserProfile } from '../types';
import { AgentStatusBadge } from './AgentStatusBadge';
import {
  Compass,
  LayoutDashboard,
  PlusCircle,
  Activity,
  Search,
  Heart,
  Brain,
  Bell,
  History,
  Settings,
  Sparkles,
  Zap,
  Database,
  User
} from 'lucide-react';

interface NavigationProps {
  currentRoute: AppRoute;
  onRouteChange: (route: AppRoute) => void;
  missionStatus: MissionStatus;
  hasActiveMission: boolean;
  unreadNotifsCount: number;
  shortlistCount: number;
  onSimulateListing: () => void;
  isSimulating: boolean;
  currentUser?: UserProfile | null;
  onOpenProfileModal?: () => void;
  onOpenAuthModal?: (mode: 'signin' | 'signup') => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentRoute,
  onRouteChange,
  missionStatus,
  hasActiveMission,
  unreadNotifsCount,
  shortlistCount,
  onSimulateListing,
  isSimulating,
  currentUser,
  onOpenProfileModal,
  onOpenAuthModal
}) => {
  const navItems = [
    { route: 'dashboard' as AppRoute, label: 'Dashboard', icon: LayoutDashboard },
    { route: 'create-mission' as AppRoute, label: 'New Mission', icon: PlusCircle, highlight: true },
    { route: 'active-mission' as AppRoute, label: 'Active Mission', icon: Activity, badge: hasActiveMission ? 'LIVE' : undefined },
    { route: 'search' as AppRoute, label: 'Property Search', icon: Search },
    { route: 'shortlist' as AppRoute, label: 'Shortlist', icon: Heart, count: shortlistCount },
    { route: 'preferences' as AppRoute, label: 'Agent Memory', icon: Brain },
    { route: 'notifications' as AppRoute, label: 'Notifications', icon: Bell, count: unreadNotifsCount },
    { route: 'activity' as AppRoute, label: 'Activity Logs', icon: History },
    { route: 'settings' as AppRoute, label: 'Architecture', icon: Settings },
  ];

  return (
    <>
      {/* Top Fixed Header Bar */}
      <header
        id="app-top-header"
        className="fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-xl border-b border-slate-200 z-30 flex items-center justify-between px-4 lg:px-6"
      >
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <button
            id="nav-brand-logo"
            type="button"
            onClick={() => onRouteChange('landing')}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-teal-400 p-[1.5px] shadow-sm shadow-indigo-500/20">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                <Compass className="w-5 h-5 text-indigo-600 group-hover:rotate-45 transition-transform duration-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-slate-900 text-sm lg:text-base tracking-tight">
                  Agentic Housing
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                  NAVIGATOR
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono hidden sm:block">
                All Things Agentic • Hackathon Prototype
              </p>
            </div>
          </button>
        </div>

        {/* Center/Right Status & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Transparent Demo Dataset Indicator */}
          <div
            id="badge-demo-dataset"
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-[11px] text-slate-600 font-mono font-medium"
            title="Running on local demo property dataset with deterministic scoring & Gemini parsing"
          >
            <Database className="w-3 h-3 text-cyan-600" />
            <span>Demo Property Dataset</span>
          </div>

          {/* Live Agent Status */}
          <div className="hidden sm:block">
            <AgentStatusBadge status={missionStatus} showDetail={false} />
          </div>

          {/* Simulate New Listing Button */}
          <button
            id="btn-simulate-listing"
            type="button"
            onClick={onSimulateListing}
            disabled={isSimulating}
            className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 active:scale-95 text-emerald-800 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            title="Inject a realistic listing into the demo dataset to test autonomous background monitoring"
          >
            <Zap className={`w-3.5 h-3.5 text-emerald-600 ${isSimulating ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Simulate New Property</span>
            <span className="sm:hidden">Simulate</span>
          </button>

          {/* Notification Quick Bell */}
          <button
            id="btn-nav-notifications"
            type="button"
            onClick={() => onRouteChange('notifications')}
            className="relative p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
            title="Open Notification Center"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifsCount > 0 && (
              <span
                id="badge-unread-notifications-count"
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center font-mono animate-pulse"
              >
                {unreadNotifsCount}
              </span>
            )}
          </button>

          {/* User Account / Profile Button */}
          {currentUser ? (
            <button
              id="btn-user-profile-header"
              type="button"
              onClick={onOpenProfileModal}
              className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer text-left"
              title="View or Switch User Profile"
            >
              <img
                src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name)}`}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full object-cover border border-emerald-500/40 shrink-0"
              />
              <div className="hidden sm:block min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate leading-tight">{currentUser.name.split(' ')[0]}</p>
                <p className="text-[9px] text-emerald-700 font-mono leading-tight truncate">Scoped DB</p>
              </div>
            </button>
          ) : (
            <button
              id="btn-signin-header"
              type="button"
              onClick={() => onOpenAuthModal && onOpenAuthModal('signin')}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </header>

      {/* Desktop Sidebar Navigation */}
      <aside
        id="app-desktop-sidebar"
        className="hidden lg:flex fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-slate-200 flex-col justify-between p-4 z-20 shadow-sm"
      >
        <div className="space-y-6">
          {/* Active User Account Badge in Sidebar */}
          {currentUser && (
            <div 
              onClick={onOpenProfileModal}
              className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name)}`}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover border border-emerald-500/40 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 truncate">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">{currentUser.city || 'User'}</p>
                </div>
              </div>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white text-emerald-700 border border-emerald-200">
                {currentUser.personaType || 'Auth'}
              </span>
            </div>
          )}

          {/* Mission Control Subheading */}
          <div>
            <div className="text-[11px] font-mono font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2 flex items-center justify-between">
              <span>Mission Control</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
            </div>
            
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentRoute === item.route;
                return (
                  <button
                    key={item.route}
                    id={`sidebar-nav-${item.route}`}
                    type="button"
                    onClick={() => onRouteChange(item.route)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                        : item.highlight
                        ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/80'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-indigo-600' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
                          {item.badge}
                        </span>
                      )}
                      {typeof item.count === 'number' && item.count > 0 && (
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${isActive ? 'bg-white text-indigo-700' : 'bg-slate-200 text-slate-800'}`}>
                          {item.count}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick Mission State Card in Sidebar */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-500 mb-1">
              <span>AGENT WORKFLOW</span>
              <Sparkles className="w-3 h-3 text-amber-500" />
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Autonomous mission orchestrator parses NLP, ranks listings via weighted factors, and activates continuous listener.
            </p>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500 font-mono space-y-1">
          <div className="flex items-center justify-between">
            <span>Runtime</span>
            <span className="text-slate-700 font-medium">Node / React / GenAI</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Architecture</span>
            <span className="text-emerald-700 font-semibold">Autonomous Agent</span>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        id="app-mobile-bottom-nav"
        className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-xl border-t border-slate-200 z-30 flex items-center justify-around px-2 shadow-md"
      >
        {[
          { route: 'dashboard' as AppRoute, label: 'Dash', icon: LayoutDashboard },
          { route: 'create-mission' as AppRoute, label: 'New', icon: PlusCircle, highlight: true },
          { route: 'active-mission' as AppRoute, label: 'Mission', icon: Activity },
          { route: 'search' as AppRoute, label: 'Search', icon: Search },
          { route: 'shortlist' as AppRoute, label: 'Saved', icon: Heart, count: shortlistCount }
        ].map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.route;
          return (
            <button
              key={item.route}
              id={`mobile-nav-${item.route}`}
              type="button"
              onClick={() => onRouteChange(item.route)}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition-all ${
                isActive
                  ? 'text-indigo-600 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>{item.label}</span>
              {typeof item.count === 'number' && item.count > 0 && (
                <span className="absolute top-1 right-2 w-3.5 h-3.5 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};
