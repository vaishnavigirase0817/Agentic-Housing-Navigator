import React, { useState } from 'react';
import { AppRoute, Property, MatchEvaluation } from '../types';
import { PropertyCard } from '../components/PropertyCard';
import { CompareModal } from '../components/CompareModal';
import {
  Heart,
  Scale,
  ArrowRight,
  TrendingDown,
  MapPin,
  Sparkles,
  Building2,
  Trash2
} from 'lucide-react';

interface ShortlistPageProps {
  onNavigate: (route: AppRoute) => void;
  properties: Property[];
  scores: Record<string, MatchEvaluation>;
  shortlist: string[];
  onToggleShortlist: (id: string) => void;
  onViewDetails: (id: string) => void;
}

export const ShortlistPage: React.FC<ShortlistPageProps> = ({
  onNavigate,
  properties,
  scores,
  shortlist,
  onToggleShortlist,
  onViewDetails
}) => {
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  const shortlistedProps = properties.filter((p) => shortlist.includes(p.id));

  // Calculate quick stats
  const avgRent =
    shortlistedProps.length > 0
      ? Math.round(shortlistedProps.reduce((sum, p) => sum + p.monthlyRent, 0) / shortlistedProps.length)
      : 0;

  const minDistance =
    shortlistedProps.length > 0
      ? Math.min(...shortlistedProps.map((p) => p.distanceKm))
      : 0;

  return (
    <div id="shortlist-page" className="space-y-8 pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Shortlisted Properties
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-mono font-bold border border-rose-200">
              {shortlistedProps.length} Saved
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare side-by-side rent, proximity to campus, and verified amenities
          </p>
        </div>

        {shortlistedProps.length > 1 && (
          <button
            id="btn-open-compare-matrix"
            type="button"
            onClick={() => setIsCompareOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Scale className="w-4 h-4" />
            <span>Compare All ({shortlistedProps.length}) Side-by-Side</span>
          </button>
        )}
      </div>

      {shortlistedProps.length > 0 ? (
        <>
          {/* Summary Metric Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                Average Shortlist Rent
              </span>
              <p className="text-xl font-bold text-slate-900 font-mono">
                ₹{avgRent.toLocaleString('en-IN')}/mo
              </p>
              <p className="text-[11px] text-emerald-700 font-semibold">Within optimal budget threshold</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                Closest Distance
              </span>
              <p className="text-xl font-bold text-slate-900 font-mono">{minDistance} km</p>
              <p className="text-[11px] text-indigo-700 font-semibold">Proximity to campus corridor</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                Comparison Ready
              </span>
              <p className="text-xl font-bold text-teal-700 font-mono">
                {shortlistedProps.length >= 2 ? 'Active Matrix' : 'Add 1 more to compare'}
              </p>
              <p className="text-[11px] text-slate-500">Side-by-side trade-off matrix</p>
            </div>
          </div>

          {/* Properties Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {shortlistedProps.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                evaluation={scores[property.id]}
                isShortlisted={true}
                onToggleShortlist={onToggleShortlist}
                onViewDetails={onViewDetails}
              />
            ))}
          </div>
        </>
      ) : (
        /* Empty State */
        <div className="text-center py-20 p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Properties Shortlisted Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Click the heart icon on any property card or search result to save it here for side-by-side comparison.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('search')}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <span>Browse Search Results</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Compare Modal */}
      <CompareModal
        properties={shortlistedProps}
        scores={scores}
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        onViewDetails={onViewDetails}
        onRemoveFromShortlist={onToggleShortlist}
      />
    </div>
  );
};
