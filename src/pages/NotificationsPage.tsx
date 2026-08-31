import React, { useState } from 'react';
import { AppRoute, AppNotification } from '../types';
import {
  Bell,
  CheckCheck,
  Trash2,
  Sparkles,
  Heart,
  Activity,
  Layers,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

interface NotificationsPageProps {
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onNavigate: (route: AppRoute) => void;
  onViewDetails: (id: string) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onNavigate,
  onViewDetails
}) => {
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = notifications.filter((n) => {
    if (filterType === 'unread') return !n.read;
    if (filterType !== 'all') return n.type === filterType;
    return true;
  });

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'match':
        return <Sparkles className="w-4 h-4 text-emerald-600" />;
      case 'shortlist':
        return <Heart className="w-4 h-4 text-rose-600" />;
      case 'mission':
        return <Activity className="w-4 h-4 text-indigo-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div id="notifications-page" className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Notification Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono font-semibold">
              {notifications.filter((n) => !n.read).length} Unread
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time alerts from your autonomous monitoring daemon & mission controller
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onMarkAllAsRead}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark All Read</span>
          </button>

          <button
            type="button"
            onClick={onClearAll}
            className="p-2 rounded-xl bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-300 transition-colors cursor-pointer shadow-xs"
            title="Clear all notifications"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
        {['all', 'unread', 'match', 'shortlist', 'mission'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 rounded-xl font-mono uppercase font-semibold border transition-colors cursor-pointer ${
              filterType === t
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                notif.read
                  ? 'bg-slate-50/80 border-slate-200 opacity-90'
                  : 'bg-white border-indigo-200 shadow-sm ring-1 ring-indigo-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 shrink-0 mt-0.5">
                  {getIcon(notif.type)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{notif.title}</h3>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                    )}
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{notif.message}</p>
                  <span className="text-[10px] font-mono text-slate-500 block pt-1">
                    {new Date(notif.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {notif.propertyId && (
                  <button
                    type="button"
                    onClick={() => {
                      onMarkAsRead(notif.id);
                      onViewDetails(notif.propertyId!);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <span>View Property</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}

                {notif.missionId && (
                  <button
                    type="button"
                    onClick={() => {
                      onMarkAsRead(notif.id);
                      onNavigate('active-mission');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <span>Open Mission</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}

                {!notif.read && (
                  <button
                    type="button"
                    onClick={() => onMarkAsRead(notif.id)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 cursor-pointer"
                    title="Mark as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16 p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <Bell className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">No Notifications In This View</h3>
            <p className="text-xs text-slate-500">All alerts and updates will appear here in real time.</p>
          </div>
        )}
      </div>
    </div>
  );
};
