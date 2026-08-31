import React from 'react';
import { Property, MatchEvaluation } from '../types';
import { X, Check, Minus, Sparkles, MapPin, Eye, Heart } from 'lucide-react';
import { calculateAffordability } from '../services/scoringService';

interface CompareModalProps {
  properties: Property[];
  scores: Record<string, MatchEvaluation>;
  isOpen: boolean;
  onClose: () => void;
  onViewDetails: (id: string) => void;
  onRemoveFromShortlist: (id: string) => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  properties,
  scores,
  isOpen,
  onClose,
  onViewDetails,
  onRemoveFromShortlist
}) => {
  if (!isOpen || properties.length === 0) return null;

  const compareFeatures = [
    { label: 'Match Score', key: 'score' },
    { label: 'Monthly Rent', key: 'rent' },
    { label: 'Maintenance Fee', key: 'maint' },
    { label: 'Security Deposit', key: 'deposit' },
    { label: 'Est. Total Monthly Cost', key: 'monthly_total' },
    { label: 'Distance from Campus', key: 'distance' },
    { label: 'Bedrooms / Type', key: 'bhk' },
    { label: 'Furnishing Status', key: 'furnishing' },
    { label: 'Floor Level', key: 'floor' },
    { label: 'Parking Type', key: 'parking' },
    { label: 'Owner Verified', key: 'verified' },
    { label: 'Key Amenities', key: 'amenities' }
  ];

  return (
    <div
      id="modal-compare-properties"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white border border-slate-200 rounded-2xl flex flex-col shadow-2xl overflow-hidden text-slate-900">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-indigo-600 font-bold uppercase tracking-wider">
                Side-by-Side Analysis
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-medium">
                {properties.length} Properties
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              Property Comparison Matrix
            </h2>
          </div>

          <button
            id="btn-close-compare-modal"
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Table Scrollable Area */}
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          <div className="min-w-[650px]">
            {/* Properties Top Row (Cards Header) */}
            <div className="grid grid-cols-4 gap-4 pb-4 border-b border-slate-200">
              <div className="text-xs font-mono text-slate-500 uppercase tracking-wider self-end pb-2 font-semibold">
                Property Metric
              </div>
              {properties.map((p) => {
                const evalData = scores[p.id];
                return (
                  <div key={p.id} className="space-y-2">
                    <img
                      src={p.images[0]}
                      alt={p.title}
                      className="w-full h-28 object-cover rounded-lg border border-slate-200 shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                    <h3 className="text-xs font-bold text-slate-900 line-clamp-1">
                      {p.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 line-clamp-1">
                      <MapPin className="w-3 h-3 text-indigo-600 shrink-0" />
                      {p.locality}
                    </p>
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onViewDetails(p.id);
                        }}
                        className="flex-1 py-1.5 px-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Details</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveFromShortlist(p.id)}
                        className="p-1.5 rounded bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 cursor-pointer"
                        title="Remove from shortlist"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Matrix Rows */}
            <div className="divide-y divide-slate-200 text-xs">
              {/* Match Score */}
              <div className="grid grid-cols-4 gap-4 py-3 items-center">
                <span className="font-semibold text-slate-700">Match Score</span>
                {properties.map((p) => {
                  const score = scores[p.id]?.totalScore;
                  return (
                    <div key={p.id}>
                      {score !== undefined ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono font-bold">
                          <Sparkles className="w-3 h-3 text-indigo-600" />
                          {score}% Match
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono">--</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Monthly Rent */}
              <div className="grid grid-cols-4 gap-4 py-3 items-center">
                <span className="font-semibold text-slate-700">Monthly Rent</span>
                {properties.map((p) => (
                  <div key={p.id} className="font-bold text-slate-900 font-mono text-sm">
                    ₹{p.monthlyRent.toLocaleString('en-IN')}/mo
                  </div>
                ))}
              </div>

              {/* Maintenance Fee */}
              <div className="grid grid-cols-4 gap-4 py-3 items-center">
                <span className="font-semibold text-slate-700">Maintenance</span>
                {properties.map((p) => (
                  <div key={p.id} className="text-slate-700 font-mono">
                    ₹{p.maintenance.toLocaleString('en-IN')}/mo
                  </div>
                ))}
              </div>

              {/* Security Deposit */}
              <div className="grid grid-cols-4 gap-4 py-3 items-center">
                <span className="font-semibold text-slate-700">Security Deposit</span>
                {properties.map((p) => (
                  <div key={p.id} className="text-slate-700 font-mono">
                    ₹{p.securityDeposit.toLocaleString('en-IN')}
                  </div>
                ))}
              </div>

              {/* Est. Total Monthly Cost */}
              <div className="grid grid-cols-4 gap-4 py-3 items-center bg-indigo-50/60 px-2 rounded-lg">
                <span className="font-bold text-indigo-900">Est. Total Monthly</span>
                {properties.map((p) => {
                  const aff = calculateAffordability(p);
                  return (
                    <div key={p.id} className="font-mono font-bold text-emerald-700 text-sm">
                      ₹{aff.monthlyHousingCost.toLocaleString('en-IN')}/mo
                    </div>
                  );
                })}
              </div>

              {/* Distance from Campus */}
              <div className="grid grid-cols-4 gap-4 py-3 items-center">
                <span className="font-semibold text-slate-700">Distance</span>
                {properties.map((p) => (
                  <div key={p.id} className="text-slate-700 font-mono">
                    {p.distanceKm} km
                  </div>
                ))}
              </div>

              {/* BHK & Layout */}
              <div className="grid grid-cols-4 gap-4 py-3 items-center">
                <span className="font-semibold text-slate-700">Layout</span>
                {properties.map((p) => (
                  <div key={p.id} className="text-slate-800">
                    {p.bedrooms} BHK ({p.propertyType})
                  </div>
                ))}
              </div>

              {/* Furnishing */}
              <div className="grid grid-cols-4 gap-4 py-3 items-center">
                <span className="font-semibold text-slate-700">Furnishing</span>
                {properties.map((p) => (
                  <div key={p.id} className="text-slate-800">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium">
                      {p.furnishing}
                    </span>
                  </div>
                ))}
              </div>

              {/* Floor */}
              <div className="grid grid-cols-4 gap-4 py-3 items-center">
                <span className="font-semibold text-slate-700">Floor Level</span>
                {properties.map((p) => (
                  <div key={p.id} className="text-slate-700 font-mono">
                    {p.floor === 0 ? 'Ground Floor' : `Floor ${p.floor} of ${p.totalFloors}`}
                  </div>
                ))}
              </div>

              {/* Parking */}
              <div className="grid grid-cols-4 gap-4 py-3 items-center">
                <span className="font-semibold text-slate-700">Parking</span>
                {properties.map((p) => (
                  <div key={p.id} className="text-slate-800">
                    {p.parking}
                  </div>
                ))}
              </div>

              {/* Owner Verified */}
              <div className="grid grid-cols-4 gap-4 py-3 items-center">
                <span className="font-semibold text-slate-700">Owner Verified</span>
                {properties.map((p) => (
                  <div key={p.id}>
                    {p.ownerVerified ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <Check className="w-4 h-4 text-emerald-600" /> Yes
                      </span>
                    ) : (
                      <span className="text-slate-400 flex items-center gap-1">
                        <Minus className="w-4 h-4" /> Standard
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Amenities */}
              <div className="grid grid-cols-4 gap-4 py-3 items-start">
                <span className="font-semibold text-slate-700 pt-1">Key Amenities</span>
                {properties.map((p) => (
                  <div key={p.id} className="space-y-1">
                    {p.amenities.slice(0, 5).map((a, i) => (
                      <div key={i} className="text-[11px] text-slate-600 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        <span>{a}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold cursor-pointer transition-colors"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
