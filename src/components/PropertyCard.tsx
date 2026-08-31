import React from 'react';
import { Property, MatchEvaluation } from '../types';
import { 
  ShieldCheck, 
  MapPin, 
  BedDouble, 
  Sparkles, 
  Heart, 
  Eye, 
  X, 
  CheckCircle2, 
  Building2,
  Layers
} from 'lucide-react';

interface PropertyCardProps {
  property: Property;
  evaluation?: MatchEvaluation;
  isShortlisted: boolean;
  onToggleShortlist: (id: string) => void;
  onViewDetails: (id: string) => void;
  onDismiss?: (id: string) => void;
  compact?: boolean;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  evaluation,
  isShortlisted,
  onToggleShortlist,
  onViewDetails,
  onDismiss,
  compact = false
}) => {
  const score = evaluation?.totalScore;

  const getScoreColor = (sc?: number) => {
    if (!sc) return 'from-slate-100 to-slate-200 text-slate-700 border-slate-300';
    if (sc >= 85) return 'from-emerald-50 to-teal-50 text-emerald-800 border-emerald-300';
    if (sc >= 70) return 'from-indigo-50 to-blue-50 text-indigo-800 border-indigo-300';
    return 'from-amber-50 to-orange-50 text-amber-800 border-amber-300';
  };

  const isSimulated = property.source === 'simulated_feed';

  return (
    <div
      id={`property-card-${property.id}`}
      className={`group relative bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md rounded-xl overflow-hidden transition-all duration-300 flex flex-col shadow-sm ${
        isSimulated ? 'ring-2 ring-emerald-500/60' : ''
      }`}
    >
      {/* Image Banner */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
        <img
          src={property.images[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80'}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80';
          }}
        />
        
        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5 flex-wrap">
            {score !== undefined && (
              <div
                id={`match-score-badge-${property.id}`}
                className={`px-2.5 py-1 rounded-full border backdrop-blur-md font-mono text-xs font-bold flex items-center gap-1 shadow-sm bg-gradient-to-r ${getScoreColor(score)}`}
              >
                <Sparkles className="w-3 h-3 text-current" />
                <span>{score}% MATCH</span>
              </div>
            )}
            {isSimulated && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider animate-pulse shadow-sm">
                NEW LISTING
              </span>
            )}
          </div>

          {/* Quick Shortlist Heart Action */}
          <button
            id={`btn-shortlist-${property.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleShortlist(property.id);
            }}
            className={`pointer-events-auto p-2 rounded-full backdrop-blur-md border transition-all cursor-pointer shadow-sm ${
              isShortlisted
                ? 'bg-rose-500 border-rose-400 text-white shadow-rose-500/30'
                : 'bg-white/90 border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-white'
            }`}
            title={isShortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
          >
            <Heart className={`w-4 h-4 ${isShortlisted ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Bottom Image Overlay */}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] text-white font-medium drop-shadow">
          <span className="bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded border border-white/20 flex items-center gap-1">
            <Building2 className="w-3 h-3 text-slate-200" />
            {property.propertyType} • {property.bedrooms}BHK
          </span>
          <span className="bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded border border-white/20 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-indigo-300" />
            {property.distanceKm} km away
          </span>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Rent & Verification Row */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-slate-900 tracking-tight">
                  ₹{property.monthlyRent.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-slate-500 font-normal">/month</span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                + ₹{property.maintenance} maint. • Deposit: ₹{property.securityDeposit.toLocaleString('en-IN')}
              </p>
            </div>

            {property.ownerVerified && (
              <span
                id={`verified-badge-${property.id}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-semibold"
                title="Owner identity and registry checked"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Verified</span>
              </span>
            )}
          </div>

          {/* Title */}
          <h3
            id={`property-title-${property.id}`}
            onClick={() => onViewDetails(property.id)}
            className="text-sm font-bold text-slate-900 line-clamp-1 hover:text-indigo-600 cursor-pointer transition-colors"
          >
            {property.title}
          </h3>

          {/* Locality */}
          <p className="text-xs text-slate-600 flex items-center gap-1 mt-1 line-clamp-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {property.locality}
          </p>

          {/* Spec Badges Row */}
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium">
              {property.furnishing}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium">
              Floor {property.floor}/{property.totalFloors}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium">
              {property.parking} Parking
            </span>
          </div>

          {/* Key Match Reason Bullet Point */}
          {evaluation?.matchReasons && evaluation.matchReasons.length > 0 && !compact && (
            <div className="mt-3 p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-200 text-xs">
              <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-900 mb-1 font-mono uppercase">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Why this matches:
              </div>
              <p className="text-slate-700 text-[11px] line-clamp-2 leading-relaxed">
                {evaluation.matchReasons[0]}
                {evaluation.matchReasons[1] ? ` • ${evaluation.matchReasons[1]}` : ''}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons Footer */}
        <div className="pt-2.5 border-t border-slate-200 flex items-center gap-2">
          <button
            id={`btn-view-details-${property.id}`}
            type="button"
            onClick={() => onViewDetails(property.id)}
            className="flex-1 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Details</span>
          </button>

          <button
            id={`btn-shortlist-action-${property.id}`}
            type="button"
            onClick={() => onToggleShortlist(property.id)}
            className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
              isShortlisted
                ? 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isShortlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span className="hidden sm:inline">{isShortlisted ? 'Saved' : 'Shortlist'}</span>
          </button>

          {onDismiss && (
            <button
              id={`btn-dismiss-${property.id}`}
              type="button"
              onClick={() => onDismiss(property.id)}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Dismiss property from active list"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
