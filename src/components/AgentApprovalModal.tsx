import React, { useState } from 'react';
import { AgentApprovalRequest } from '../types';
import { ShieldAlert, CheckCircle, Edit3, XCircle, Send, User, Phone, Home, MessageSquare, AlertCircle } from 'lucide-react';

interface AgentApprovalModalProps {
  request: AgentApprovalRequest | null;
  isOpen: boolean;
  onApprove: (requestId: string, finalMessage: string) => void;
  onReject: (requestId: string, reason?: string) => void;
  onClose: () => void;
}

export const AgentApprovalModal: React.FC<AgentApprovalModalProps> = ({
  request,
  isOpen,
  onApprove,
  onReject,
  onClose
}) => {
  if (!isOpen || !request) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [editedMessage, setEditedMessage] = useState(request.proposedMessage);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const handleApprove = () => {
    onApprove(request.id, editedMessage);
    onClose();
  };

  const handleReject = () => {
    onReject(request.id, rejectReason || 'User declined contact authorization');
    onClose();
  };

  return (
    <div
      id="agent-approval-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="agent-approval-modal-card"
        className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden space-y-0 text-slate-900 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Alert Ribbon */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-amber-100 font-bold">
                Human-in-the-Loop Safeguard
              </div>
              <h3 className="text-base font-bold tracking-tight">
                Agent Action Requires Approval
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              The <strong>Autonomous Communication Agent</strong> has prepared an outreach inquiry to the verified property owner. Under our safety policy, external messages require explicit human authorization before dispatch.
            </p>
          </div>

          {/* Property & Recipient Target Info */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase font-bold flex items-center gap-1">
                <Home className="w-3 h-3 text-indigo-600" /> Property
              </span>
              <p className="font-semibold text-slate-900 line-clamp-1">{request.propertyTitle}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase font-bold flex items-center gap-1">
                <User className="w-3 h-3 text-emerald-600" /> Recipient
              </span>
              <p className="font-semibold text-slate-900 line-clamp-1">{request.recipientName} ({request.recipientContact})</p>
            </div>
          </div>

          {/* Message Content Preview or Edit */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1 font-mono uppercase">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                {isEditing ? 'Edit Proposed Message:' : 'Proposed Outreach Message:'}
              </label>
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Customize Text</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  Done Editing
                </button>
              )}
            </div>

            {isEditing ? (
              <textarea
                value={editedMessage}
                onChange={(e) => setEditedMessage(e.target.value)}
                rows={5}
                className="w-full p-3 rounded-xl bg-slate-50 border border-indigo-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-mono text-xs text-slate-800 leading-relaxed outline-none"
              />
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-line max-h-48 overflow-y-auto">
                {editedMessage}
              </div>
            )}
          </div>

          {/* Optional Reject Reason Drawer */}
          {showRejectInput && (
            <div className="space-y-1.5 animate-in fade-in duration-150">
              <label className="text-[11px] font-bold text-slate-600">Reason for rejection (optional):</label>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., Decided not to pursue this locality..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-slate-500 outline-none"
              />
            </div>
          )}
        </div>

        {/* Action Buttons: Approve, Edit, Reject */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {!showRejectInput ? (
              <button
                id="btn-reject-agent-action"
                type="button"
                onClick={() => setShowRejectInput(true)}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 hover:text-rose-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject</span>
              </button>
            ) : (
              <button
                id="btn-confirm-reject-agent-action"
                type="button"
                onClick={handleReject}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>Confirm Reject</span>
              </button>
            )}

            <button
              id="btn-edit-agent-action"
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>{isEditing ? 'Preview' : 'Edit'}</span>
            </button>
          </div>

          <button
            id="btn-approve-agent-action"
            type="button"
            onClick={handleApprove}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold font-mono flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Approve & Authorize</span>
          </button>
        </div>
      </div>
    </div>
  );
};
