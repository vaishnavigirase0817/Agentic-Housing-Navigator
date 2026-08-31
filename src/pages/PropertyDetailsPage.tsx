import React, { useState, useEffect } from 'react';
import { AppRoute, Property, MatchEvaluation, Mission, AgentApprovalRequest } from '../types';
import { calculateAffordability } from '../services/scoringService';
import { missionService } from '../services/missionService';
import { notificationService } from '../services/notificationService';
import { agentService } from '../services/agentService';
import { approvalService } from '../services/approvalService';
import { AgentApprovalModal } from '../components/AgentApprovalModal';
import {
  ArrowLeft,
  Heart,
  MapPin,
  Building2,
  BedDouble,
  Bath,
  Maximize2,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Calendar,
  Layers,
  Check,
  Eye,
  Loader2,
  Bot,
  Send,
  ShieldAlert,
  Clock,
  XCircle,
  ThumbsUp
} from 'lucide-react';

interface PropertyDetailsPageProps {
  propertyId: string | null;
  properties: Property[];
  scores: Record<string, MatchEvaluation>;
  mission: Mission | null;
  shortlist: string[];
  onToggleShortlist: (id: string) => void;
  onNavigate: (route: AppRoute) => void;
}

export const PropertyDetailsPage: React.FC<PropertyDetailsPageProps> = ({
  propertyId,
  properties,
  scores,
  mission,
  shortlist,
  onToggleShortlist,
  onNavigate
}) => {
  const property = properties.find((p) => p.id === propertyId);
  const evaluation = property ? scores[property.id] : undefined;
  const isShortlisted = property ? shortlist.includes(property.id) : false;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [aiRationale, setAiRationale] = useState<string>('');
  const [isLoadingRationale, setIsLoadingRationale] = useState(false);

  // Human-in-the-loop controlled approval state
  const [approvalRequest, setApprovalRequest] = useState<AgentApprovalRequest | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [authorizedActionSuccess, setAuthorizedActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (property && mission && evaluation) {
      setIsLoadingRationale(true);
      missionService
        .generateAiExplanation(property, mission.requirements, evaluation)
        .then((text) => {
          setAiRationale(text);
        })
        .catch(() => {
          setAiRationale(
            `Strong match because the property is ₹${Math.abs(mission.requirements.maxBudget - property.monthlyRent).toLocaleString('en-IN')} ${property.monthlyRent <= mission.requirements.maxBudget ? 'below' : 'over'} your budget, ${property.distanceKm} km from your target location, ${property.furnishing.toLowerCase()}, and ready for move-in.`
          );
        })
        .finally(() => {
          setIsLoadingRationale(false);
        });
    }
  }, [propertyId]);

  if (!property) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Property Not Found</h2>
        <p className="text-xs text-slate-500">The requested property listing could not be located.</p>
        <button
          type="button"
          onClick={() => onNavigate('search')}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
        >
          Return to Search
        </button>
      </div>
    );
  }

  const affordability = calculateAffordability(property);
  const score = evaluation?.totalScore;

  // Initiate Controlled Action: Agent asks for approval before contacting owner
  const handleInitiateContactOwner = async () => {
    const defaultMsg = `Hello, I am reaching out regarding your listing "${property.title}" in ${property.locality} listed at ₹${property.monthlyRent.toLocaleString('en-IN')}/month. I am looking for a ${property.bedrooms}BHK with move-in from ${property.availableFrom || 'immediate'}. Could we schedule a viewing this week?`;

    const request = await approvalService.requestApproval({
      missionId: mission?.id || 'direct-search',
      propertyId: property.id,
      propertyTitle: property.title,
      agent: 'CommunicationAgent',
      actionType: 'contact_owner',
      title: 'Contact Verified Property Owner',
      description: 'Dispatch verified tenancy inquiry to owner with scheduling request',
      proposedMessage: defaultMsg,
      recipientName: 'Verified Property Owner / Landlord',
      recipientContact: '+91 98450 XXXXX'
    });

    setApprovalRequest(request);
    setIsApprovalModalOpen(true);
  };

  const handleApproveAction = async (requestId: string, finalMessage: string) => {
    if (!approvalRequest) return;
    setAuthorizedActionSuccess(`Inquiry dispatched to owner for "${property.title}". The landlord has received your authorized message.`);

    await approvalService.resolveApproval(requestId, 'APPROVED', finalMessage);

    await notificationService.addNotification({
      title: '✅ Agent Action Authorized',
      message: `Inquiry sent to property owner for "${property.title}".`,
      type: 'mission',
      propertyId: property.id,
      missionId: mission?.id
    });

    if (mission) {
      await agentService.logEvent(
        mission.id,
        'CommunicationAgent: Owner Inquiry Dispatched',
        `User approved message to owner of "${property.title}". Message: "${finalMessage.slice(0, 80)}..."`,
        'success',
        'system',
        {
          requestId,
          propertyId: property.id,
          recipient: approvalRequest.recipientName,
          status: 'APPROVED',
          authorizedAt: new Date().toISOString()
        }
      );
    }
  };

  const handleRejectAction = async (requestId: string, reason?: string) => {
    setAuthorizedActionSuccess(null);
    await approvalService.resolveApproval(requestId, 'REJECTED');
    if (mission) {
      await agentService.logEvent(
        mission.id,
        'CommunicationAgent: Action Cancelled by User',
        `User declined sending inquiry for "${property.title}". Reason: ${reason || 'User rejected authorization'}.`,
        'warning',
        'system',
        { requestId, propertyId: property.id, status: 'REJECTED' }
      );
    }
  };

  return (
    <div id="property-details-page" className="max-w-5xl mx-auto space-y-8 pb-16 animate-in fade-in duration-200">
      {/* Agent Approval Modal */}
      <AgentApprovalModal
        request={approvalRequest}
        isOpen={isApprovalModalOpen}
        onApprove={handleApproveAction}
        onReject={handleRejectAction}
        onClose={() => setIsApprovalModalOpen(false)}
      />

      {/* Success Notification Banner on Action Approval */}
      {authorizedActionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-xs font-medium">{authorizedActionSuccess}</p>
          </div>
          <button
            type="button"
            onClick={() => setAuthorizedActionSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold font-mono px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Back Button & Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          id="btn-back-from-details"
          type="button"
          onClick={() => onNavigate(mission ? 'active-mission' : 'search')}
          className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{mission ? 'Back to Mission' : 'Back to Search'}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            id="btn-details-toggle-shortlist"
            type="button"
            onClick={() => onToggleShortlist(property.id)}
            className={`px-4 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
              isShortlisted
                ? 'bg-rose-50 border-rose-300 text-rose-700'
                : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
            }`}
          >
            <Heart className={`w-4 h-4 ${isShortlisted ? 'fill-rose-600 text-rose-600' : ''}`} />
            <span>{isShortlisted ? 'Saved to Shortlist' : 'Add to Shortlist'}</span>
          </button>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="space-y-3">
        <div className="relative h-72 sm:h-96 w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
          <img
            src={property.images[activeImageIndex] || property.images[0]}
            alt={property.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />

          {/* Verification Badge */}
          {property.ownerVerified && (
            <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-blue-600/90 text-white backdrop-blur-md text-xs font-semibold flex items-center gap-1.5 shadow-md">
              <ShieldCheck className="w-4 h-4 text-white" />
              <span>Owner Verified Listing</span>
            </div>
          )}

          {/* Match Score Badge */}
          {score !== undefined && (
            <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-indigo-700/90 text-white backdrop-blur-md text-xs font-mono font-bold flex items-center gap-1.5 shadow-md">
              <Sparkles className="w-4 h-4 text-white" />
              <span>{score}% DETERMINISTIC MATCH</span>
            </div>
          )}
        </div>

        {/* Thumbnail Selector */}
        {property.images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {property.images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImageIndex(idx)}
                className={`relative w-20 h-16 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                  activeImageIndex === idx
                    ? 'border-indigo-600 ring-2 ring-indigo-300'
                    : 'border-slate-300 opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt="thumb" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Title & Key Stats Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2 text-xs font-mono text-indigo-700 font-bold uppercase tracking-wider">
            <span>{property.propertyType}</span>
            <span>•</span>
            <span>{property.bedrooms} BHK Layout</span>
            <span>•</span>
            <span>{property.furnishing}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-display">
            {property.title}
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{property.locality}, Bengaluru</span>
            <span className="text-slate-400">•</span>
            <span className="font-mono text-indigo-700 font-bold">{property.distanceKm} km from campus</span>
          </p>
        </div>

        {/* Rent Callout Box */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1 min-w-[200px] text-right md:text-right">
          <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Monthly Base Rent</span>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono">
            ₹{property.monthlyRent.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            + ₹{property.maintenance} maint. / month
          </p>
        </div>
      </div>

      {/* Structured Recommendation Explanation & Verified Factors */}
      {evaluation && (
        <section className="p-6 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 border border-indigo-200">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-700 uppercase tracking-wider">
                    Agent Recommendation Engine
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold border border-emerald-200">
                    {evaluation.totalScore}% MATCH
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Detailed Recommendation Breakdown
                </h3>
              </div>
            </div>

            <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
              Deterministic 7-Factor Model
            </span>
          </div>

          {/* 1. Why Selected (AI Rationale) */}
          <div className="space-y-1.5 bg-white p-4 rounded-xl border border-indigo-100 shadow-xs">
            <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-700 font-bold">
              1. Why Selected
            </span>
            <div className="text-xs sm:text-sm text-slate-800 leading-relaxed">
              {isLoadingRationale ? (
                <div className="flex items-center gap-2 text-slate-500 font-mono text-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>Generating intelligent trade-off explanation via Gemini 3.7 Flash...</span>
                </div>
              ) : (
                <p>
                  {aiRationale ||
                    `Strong match because the property is ₹${Math.abs(
                      (mission?.requirements.maxBudget || 15000) - property.monthlyRent
                    ).toLocaleString('en-IN')} ${
                      property.monthlyRent <= (mission?.requirements.maxBudget || 15000) ? 'below' : 'above'
                    } budget, ${property.distanceKm} km from target, ${property.furnishing.toLowerCase()}, and verified by our coordinator.`}
                </p>
              )}
            </div>
          </div>

          {/* 2. What Matched & 3. What Did Not Match Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* What Matched */}
            <div className="space-y-2 p-4 rounded-xl bg-emerald-50/80 border border-emerald-200">
              <div className="font-bold text-emerald-800 flex items-center gap-1.5 font-mono uppercase text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                2. What Matched ({evaluation.matchReasons.length} Factors):
              </div>
              <ul className="space-y-1.5 text-slate-700">
                {evaluation.matchReasons.map((reason, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* What Did Not Match & Trade-offs */}
            <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="font-bold text-slate-700 flex items-center gap-1.5 font-mono uppercase text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                3. Trade-offs to Consider:
              </div>
              <ul className="space-y-1.5 text-slate-600">
                {evaluation.drawbacks && evaluation.drawbacks.length > 0 ? (
                  evaluation.drawbacks.map((drawback, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-slate-700">
                      <span className="text-amber-600 font-bold">•</span>
                      <span>{drawback}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-500 italic">
                    Maintenance and utilities add ~₹{(property.maintenance + property.estimatedUtilities).toLocaleString('en-IN')}/mo to estimated cost.
                  </li>
                )}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Main Details Grid: Specs (Left) & Affordability + Controlled Action (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Specifications & Amenities */}
        <div className="lg:col-span-2 space-y-6">
          {/* Specifications Table */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 font-mono uppercase tracking-wider">
              Property Specifications
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-mono text-slate-500">BEDROOMS</span>
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <BedDouble className="w-3.5 h-3.5 text-indigo-600" />
                  {property.bedrooms} BHK
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-mono text-slate-500">BATHROOMS</span>
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Bath className="w-3.5 h-3.5 text-indigo-600" />
                  {property.bathrooms} Bathrooms
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-mono text-slate-500">CARPET AREA</span>
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
                  {property.squareFeet} sq.ft
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-mono text-slate-500">FLOOR LEVEL</span>
                <p className="font-bold text-slate-900">
                  {property.floor === 0 ? 'Ground Floor' : `Floor ${property.floor} of ${property.totalFloors}`}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-mono text-slate-500">PARKING</span>
                <p className="font-bold text-slate-900">{property.parking}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-mono text-slate-500">AVAILABLE FROM</span>
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  {property.availableFrom}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="pt-3 border-t border-slate-200 space-y-1.5">
              <h4 className="text-xs font-bold text-slate-800">Listing Overview</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {property.description}
              </p>
            </div>
          </div>

          {/* Amenities Grid */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 font-mono uppercase tracking-wider">
              Amenities & Inclusions ({property.amenities.length})
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {property.amenities.map((amenity, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-xs text-slate-800"
                >
                  <div className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Financial Affordability Analysis & Controlled Human Action CTA */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 font-mono uppercase tracking-wider">
                  Affordability Breakdown
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold">
                OPTIMAL
              </span>
            </div>

            {/* Monthly Ongoing Cost Calculation */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono text-slate-500 font-bold">
                ESTIMATED MONTHLY TOTAL
              </span>
              <div className="text-2xl font-bold text-emerald-700 font-mono">
                ₹{affordability.monthlyHousingCost.toLocaleString('en-IN')}/mo
              </div>

              <div className="space-y-1.5 pt-2 text-xs">
                <div className="flex justify-between text-slate-700">
                  <span>Base Rent:</span>
                  <span className="font-mono font-semibold">₹{property.monthlyRent.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Maintenance:</span>
                  <span className="font-mono font-semibold">₹{property.maintenance.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Est. Utilities:</span>
                  <span className="font-mono font-semibold">₹{property.estimatedUtilities.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Move-in Cash Outlay */}
            <div className="pt-4 border-t border-slate-200 space-y-2">
              <span className="text-[11px] font-mono text-slate-500 font-bold">
                INITIAL MOVE-IN OUTLAY
              </span>
              <div className="text-xl font-bold text-slate-900 font-mono">
                ₹{affordability.initialMoveInCost.toLocaleString('en-IN')}
              </div>

              <div className="space-y-1.5 pt-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Security Deposit:</span>
                  <span className="font-mono text-slate-800 font-semibold">₹{property.securityDeposit.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>1st Month Rent + Maint:</span>
                  <span className="font-mono text-slate-800 font-semibold">
                    ₹{(property.monthlyRent + property.maintenance).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Human-in-the-Loop Safe Action Button */}
            <div className="pt-3 space-y-2">
              <button
                id="btn-contact-owner-approval"
                type="button"
                onClick={handleInitiateContactOwner}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer font-mono"
              >
                <Send className="w-4 h-4" />
                <span>Contact Owner (Requires Approval)</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleShortlist(property.id)}
                className={`w-full py-2.5 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                  isShortlisted
                    ? 'bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                <Heart className={`w-4 h-4 ${isShortlisted ? 'fill-rose-600 text-rose-600' : ''}`} />
                <span>{isShortlisted ? 'Remove from Shortlist' : 'Add to Shortlist for Compare'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

