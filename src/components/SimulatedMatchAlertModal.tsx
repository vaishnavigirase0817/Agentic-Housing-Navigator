import React from 'react';
import { Property, MatchEvaluation } from '../types';
import { Sparkles, MapPin, CheckCircle2, Eye, Heart, X, Zap } from 'lucide-react';

interface SimulatedMatchAlertModalProps {
  property: Property | null;
  evaluation: MatchEvaluation | null;
  isOpen: boolean;
  onClose: () => void;
  onViewDetails: (id: string) => void;
  onToggleShortlist: (id: string) => void;
  isShortlisted: boolean;
}

export const SimulatedMatchAlertModal: React.FC<SimulatedMatchAlertModalProps> = ({
  property,
  evaluation,
  isOpen,
  onClose,
  onViewDetails,
  onToggleShortlist,
  isShortlisted
}) => {
  if (!isOpen || !property || !evaluation) return null;

  return (
    <div
      id="modal-simulated-match"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-white border border-emerald-300 rounded-2xl p-5 shadow-2xl space-y-4 text-slate-900">
        {/* Close Button */}
        <button
          id="btn-close-sim-modal"
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Alert Pill */}
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-300 shadow-sm">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-emerald-700 uppercase tracking-wider">
                Google Cloud Background Worker
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold font-mono shadow-xs">
                {evaluation.totalScore}% MATCH
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              Your agent found a new {evaluation.totalScore}% match while you were away.
            </h3>
          </div>
        </div>

        {/* Property Mini Preview */}
        <div className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-24 h-24 object-cover rounded-lg shrink-0 border border-slate-200"
            referrerPolicy="no-referrer"
          />
          <div className="flex-1 min-w-0 space-y-1">
            <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
              {property.title}
            </h4>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              {property.distanceKm} km away • {property.locality}
            </p>
            <div className="flex items-baseline gap-1.5 pt-1">
              <span className="text-lg font-bold text-slate-900">
                ₹{property.monthlyRent.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-slate-500">/mo</span>
              <span className="text-[11px] text-slate-500 ml-2">
                ({property.furnishing} • {property.bedrooms}BHK)
              </span>
            </div>
          </div>
        </div>

        {/* Why this matches reasons */}
        <div className="space-y-1.5 bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl">
          <div className="text-xs font-bold text-emerald-900 flex items-center gap-1 font-mono uppercase">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Autonomous Match Rationale:
          </div>
          <ul className="space-y-1 text-xs text-slate-700">
            {evaluation.matchReasons.slice(0, 3).map((reason, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <button
            id="btn-sim-view-details"
            type="button"
            onClick={() => {
              onClose();
              onViewDetails(property.id);
            }}
            className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>View Full Details</span>
          </button>

          <button
            id="btn-sim-shortlist"
            type="button"
            onClick={() => onToggleShortlist(property.id)}
            className={`py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isShortlisted
                ? 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
            }`}
          >
            <Heart className={`w-4 h-4 ${isShortlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span>{isShortlisted ? 'Shortlisted' : 'Shortlist'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
