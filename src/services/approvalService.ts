import { AgentApprovalRequest } from '../types';
import { authService } from './authService';

export interface IApprovalService {
  getApprovals(status?: AgentApprovalRequest['status']): Promise<AgentApprovalRequest[]>;
  requestApproval(request: Omit<AgentApprovalRequest, 'id' | 'createdAt' | 'status'>): Promise<AgentApprovalRequest>;
  resolveApproval(id: string, status: 'APPROVED' | 'REJECTED' | 'EDITED', editedMessage?: string): Promise<AgentApprovalRequest>;
}

class ApprovalService implements IApprovalService {
  async getApprovals(status?: AgentApprovalRequest['status']): Promise<AgentApprovalRequest[]> {
    try {
      const url = status ? `/api/approvals?status=${encodeURIComponent(status)}` : '/api/approvals';
      const res = await fetch(url, {
        headers: authService.getAuthHeaders()
      });
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
    } catch (e) {
      console.warn('[ApprovalService] Backend getApprovals failed, returning local fallback', e);
    }
    return [];
  }

  async requestApproval(requestData: Omit<AgentApprovalRequest, 'id' | 'createdAt' | 'status'>): Promise<AgentApprovalRequest> {
    const fullRequest: AgentApprovalRequest = {
      ...requestData,
      id: `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    try {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authService.getAuthHeaders() },
        body: JSON.stringify(fullRequest)
      });
      if (res.ok) {
        const json = await res.json();
        return json.data || fullRequest;
      }
    } catch (e) {
      console.warn('[ApprovalService] Backend save approval deferred:', e);
    }

    return fullRequest;
  }

  async resolveApproval(
    id: string,
    status: 'APPROVED' | 'REJECTED' | 'EDITED',
    editedMessage?: string
  ): Promise<AgentApprovalRequest> {
    try {
      const res = await fetch(`/api/approvals/${encodeURIComponent(id)}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authService.getAuthHeaders() },
        body: JSON.stringify({ status, editedMessage })
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {
      console.warn('[ApprovalService] Backend resolve approval deferred:', e);
    }

    return {
      id,
      missionId: 'system',
      propertyId: 'unknown',
      propertyTitle: 'Property',
      agent: 'CommunicationAgent',
      actionType: 'contact_owner',
      title: 'Outreach Request',
      description: 'Resolution processed',
      proposedMessage: editedMessage || '',
      recipientName: 'Owner',
      recipientContact: '+91 XXXXX',
      status,
      createdAt: new Date().toISOString(),
      resolvedAt: new Date().toISOString()
    };
  }
}

export const approvalService = new ApprovalService();
