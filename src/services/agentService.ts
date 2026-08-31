import { AgentActivityEvent } from '../types';
import { authService } from './authService';

const ACTIVITY_STORAGE_KEY = 'agentic_housing_activity_v1';

export interface IAgentService {
  getEvents(): Promise<AgentActivityEvent[]>;
  logEvent(
    missionId: string,
    taskName: string,
    description: string,
    status: AgentActivityEvent['status'],
    category: AgentActivityEvent['category'],
    dataSnapshot?: Record<string, any>
  ): Promise<AgentActivityEvent>;
  logEvents(events: AgentActivityEvent[]): Promise<void>;
  clearEvents(): Promise<void>;
}

class AgentServiceImpl implements IAgentService {
  private events: AgentActivityEvent[] = [];

  constructor() {
    this.loadLocal();
    this.syncFromBackend();
  }

  private loadLocal() {
    try {
      const stored = localStorage.getItem(ACTIVITY_STORAGE_KEY);
      if (stored) {
        this.events = JSON.parse(stored);
      } else {
        this.events = [
          {
            id: 'evt-init-1',
            missionId: 'system',
            timestamp: new Date().toISOString(),
            taskName: 'HousingOrchestrator: Cloud Infrastructure Ready',
            agent: 'HousingOrchestrator',
            action: 'initialize_cluster',
            description: 'Google Cloud Run ADK Multi-Agent Architecture initialized with Cloud Firestore backend.',
            status: 'info',
            category: 'system',
            dataSnapshot: {
              engine: 'Google ADK Multi-Agent Orchestrator',
              model: 'gemini-3.7-flash',
              database: 'Cloud Firestore',
              platform: 'Google Cloud Run',
              agents: [
                'RequirementAgent',
                'PropertySearchAgent',
                'BudgetAgent',
                'LocationAgent',
                'PreferenceAgent',
                'RankingAgent',
                'MonitoringAgent'
              ]
            },
            metadata: {
              platform: 'Cloud Run',
              database: 'Firestore'
            }
          }
        ];
        this.persistLocal();
      }
    } catch {
      this.events = [];
    }
  }

  private persistLocal() {
    try {
      localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(this.events.slice(0, 200)));
    } catch (e) {
      console.error('Failed to persist agent events locally', e);
    }
  }

  private async syncFromBackend(): Promise<void> {
    try {
      const res = await fetch('/api/events', {
        headers: authService.getAuthHeaders()
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          this.events = json.data;
          this.persistLocal();
        }
      }
    } catch (err) {
      console.warn('[AgentService] Backend sync deferred:', err);
    }
  }

  async getEvents(): Promise<AgentActivityEvent[]> {
    await this.syncFromBackend();
    return [...this.events];
  }

  async logEvent(
    missionId: string,
    taskName: string,
    description: string,
    status: AgentActivityEvent['status'] = 'info',
    category: AgentActivityEvent['category'] = 'system',
    dataSnapshot?: Record<string, any>
  ): Promise<AgentActivityEvent> {
    const newEvent: AgentActivityEvent = {
      id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      missionId,
      timestamp: new Date().toISOString(),
      taskName,
      agent: dataSnapshot?.agent || 'HousingOrchestrator',
      action: dataSnapshot?.tool || 'execute_task',
      status,
      category,
      description,
      dataSnapshot,
      metadata: dataSnapshot
    };

    this.events.unshift(newEvent);
    this.persistLocal();

    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authService.getAuthHeaders() },
        body: JSON.stringify(newEvent)
      });
    } catch (e) {
      console.warn('[AgentService] Backend logEvent deferred:', e);
    }

    return newEvent;
  }

  async logEvents(newEvents: AgentActivityEvent[]): Promise<void> {
    if (!newEvents || newEvents.length === 0) return;
    const existingIds = new Set(this.events.map(e => e.id));
    const unique = newEvents.filter(e => !existingIds.has(e.id));
    this.events = [...unique, ...this.events];
    this.persistLocal();

    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authService.getAuthHeaders() },
        body: JSON.stringify(newEvents)
      });
    } catch (e) {
      console.warn('[AgentService] Backend logEvents batch deferred:', e);
    }
  }

  async clearEvents(): Promise<void> {
    this.events = [];
    this.persistLocal();

    try {
      await fetch('/api/events', {
        method: 'DELETE',
        headers: authService.getAuthHeaders()
      });
    } catch (e) {
      console.warn('[AgentService] Backend clearEvents deferred:', e);
    }
  }
}

export const agentService = new AgentServiceImpl();
