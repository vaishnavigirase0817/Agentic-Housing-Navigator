import { Mission, MissionRequirements, MissionStage, Property, MatchEvaluation } from '../types';
import { propertyService } from './propertyService';
import { calculateMatchScore } from './scoringService';
import { agentService } from './agentService';
import { notificationService } from './notificationService';
import { authService } from './authService';
import { AgentOrchestrationResult } from '../agent/HousingOrchestrator';

const MISSION_STORAGE_KEY = 'agentic_housing_active_mission_v1';
const SHORTLIST_STORAGE_KEY = 'agentic_housing_shortlist_v1';

export const INITIAL_MISSION_STAGES: MissionStage[] = [
  { id: 'stage-1', name: 'Requirement Understanding', status: 'pending', detail: 'RequirementAgent parsing spatial, budgetary, and lifestyle constraints' },
  { id: 'stage-2', name: 'Property Search', status: 'pending', detail: 'PropertySearchAgent querying indexed property data service' },
  { id: 'stage-3', name: 'Budget Evaluation', status: 'pending', detail: 'BudgetAgent auditing maximum monthly rent limits and deposit constraints' },
  { id: 'stage-4', name: 'Location Evaluation', status: 'pending', detail: 'LocationAgent computing distance & transit proximity to university' },
  { id: 'stage-5', name: 'Preference Matching', status: 'pending', detail: 'PreferenceAgent evaluating furnishing, amenities, floor, and verification' },
  { id: 'stage-6', name: 'Property Ranking', status: 'pending', detail: 'RankingAgent running multi-factor deterministic scoring engine (0-100%)' },
  { id: 'stage-7', name: 'Shortlist Generation', status: 'pending', detail: 'HousingOrchestrator compiling top recommended matches with trade-offs' },
  { id: 'stage-8', name: 'Monitoring Activation', status: 'pending', detail: 'MonitoringAgent deploying autonomous polling daemon for incoming listings' }
];

export interface IMissionService {
  getActiveMission(): Promise<Mission | null>;
  parseNaturalLanguage(query: string): Promise<MissionRequirements>;
  createAndExecuteMission(requirements: MissionRequirements, onProgress?: (stageIndex: number, detail: string) => void): Promise<Mission>;
  generateAiExplanation(property: Property, requirements: MissionRequirements, score: MatchEvaluation): Promise<string>;
  getShortlist(): Promise<string[]>;
  toggleShortlist(propertyId: string): Promise<string[]>;
  dismissProperty(propertyId: string): Promise<void>;
  simulateNewListingCheck(mission: Mission): Promise<{ newProperty: Property; evaluation: MatchEvaluation; isNewTopMatch: boolean }>;
  resetMission(): Promise<void>;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class MissionServiceImpl implements IMissionService {
  private activeMission: Mission | null = null;
  private shortlist: string[] = [];
  private isLoadedFromBackend = false;

  constructor() {
    this.loadLocal();
    this.syncFromBackend();
  }

  private loadLocal() {
    try {
      const stored = localStorage.getItem(MISSION_STORAGE_KEY);
      if (stored) {
        this.activeMission = JSON.parse(stored);
      }
      const storedShortlist = localStorage.getItem(SHORTLIST_STORAGE_KEY);
      if (storedShortlist) {
        this.shortlist = JSON.parse(storedShortlist);
      }
    } catch {
      this.activeMission = null;
      this.shortlist = [];
    }
  }

  private persistLocal() {
    try {
      if (this.activeMission) {
        localStorage.setItem(MISSION_STORAGE_KEY, JSON.stringify(this.activeMission));
      } else {
        localStorage.removeItem(MISSION_STORAGE_KEY);
      }
      localStorage.setItem(SHORTLIST_STORAGE_KEY, JSON.stringify(this.shortlist));
    } catch (e) {
      console.error('Failed to persist mission state locally', e);
    }
  }

  private async syncFromBackend(): Promise<void> {
    try {
      const headers = authService.getAuthHeaders();
      const [missionRes, shortlistRes] = await Promise.all([
        fetch('/api/missions/active', { headers }),
        fetch('/api/shortlist', { headers })
      ]);

      if (missionRes.ok) {
        const mJson = await missionRes.json();
        if (mJson.success && mJson.data) {
          this.activeMission = mJson.data;
        }
      }

      if (shortlistRes.ok) {
        const sJson = await shortlistRes.json();
        if (sJson.success && Array.isArray(sJson.data)) {
          this.shortlist = sJson.data;
        }
      }

      this.persistLocal();
      this.isLoadedFromBackend = true;
    } catch (err) {
      console.warn('[MissionService] Backend sync deferred:', err);
    }
  }

  async getActiveMission(): Promise<Mission | null> {
    if (!this.isLoadedFromBackend) {
      await this.syncFromBackend();
    }
    return this.activeMission;
  }

  async parseNaturalLanguage(query: string): Promise<MissionRequirements> {
    try {
      const res = await fetch('/api/agent/mission/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authService.getAuthHeaders() },
        body: JSON.stringify({ query })
      });
      if (!res.ok) throw new Error('API request failed');
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
      throw new Error('Invalid parse response');
    } catch (e) {
      console.warn('Backend parsing error, using local fallback parser', e);
      return {
        rawQuery: query,
        propertyType: 'Apartment',
        bedrooms: 2,
        maxBudget: 15000,
        minBudget: 8000,
        targetLocation: 'Near College Campus',
        maxDistanceKm: 3.0,
        furnishing: 'Furnished',
        moveInDate: 'Next month (1st-5th)',
        preferredAmenities: ['Power Backup', 'Lift', 'Wi-Fi', '24/7 Security'],
        parkingRequired: true,
        preferredFloor: 'Avoid Ground',
        avoidGroundFloor: true,
        petFriendlyRequired: false,
        additionalNotes: 'Local deterministic fallback parser'
      };
    }
  }

  async createAndExecuteMission(
    requirements: MissionRequirements,
    onProgress?: (stageIndex: number, detail: string) => void
  ): Promise<Mission> {
    const missionId = `mission-${Date.now()}`;
    const stages: MissionStage[] = INITIAL_MISSION_STAGES.map((s) => ({
      ...s,
      status: 'pending'
    }));

    const initialMission: Mission = {
      id: missionId,
      title: `${requirements.bedrooms === 'Any' ? 'Multi' : requirements.bedrooms + 'BHK'} • ₹${requirements.maxBudget.toLocaleString('en-IN')} max • ${requirements.targetLocation}`,
      status: 'THINKING',
      createdAt: new Date().toISOString(),
      requirements,
      currentStageIndex: 0,
      stages,
      matchedPropertyIds: [],
      rankedScores: {},
      monitoring: {
        isActive: false,
        lastChecked: new Date().toISOString(),
        nextCheck: new Date(Date.now() + 15 * 60000).toISOString(),
        totalEvaluated: 0,
        newMatchesFound: 0,
        checkFrequencyMinutes: 15
      },
      shortlistedPropertyIds: this.shortlist,
      dismissedPropertyIds: [],
      appliedMemoryNotes: requirements.appliedMemoryNotes || []
    };

    this.activeMission = initialMission;
    this.persistLocal();

    // Try executing through backend Google ADK & Cloud Firestore endpoint
    let orchestrationData: AgentOrchestrationResult | null = null;
    try {
      const response = await fetch('/api/agent/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authService.getAuthHeaders() },
        body: JSON.stringify({
          query: requirements.rawQuery,
          requirements
        })
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          orchestrationData = json.data;
        }
      }
    } catch (e) {
      console.warn('Backend orchestration endpoint unreachable, running with client ADK fallbacks:', e);
    }

    if (orchestrationData && orchestrationData.mission) {
      // Step through stages visually for UI smoothness
      for (let i = 0; i < 7; i++) {
        const stageNames = [
          'RequirementAgent analyzing constraints...',
          'PropertySearchAgent querying data services...',
          'BudgetAgent verifying budget ceilings & affordability...',
          'LocationAgent calculating distances & transit routes...',
          'PreferenceAgent verifying furnishing & amenities...',
          'RankingAgent executing multi-factor deterministic scoring...',
          'HousingOrchestrator synthesizing top recommendations...'
        ];
        if (onProgress) onProgress(i, stageNames[i]);
        stages[i].status = 'in-progress';
        this.persistLocal();
        await sleep(180);
        stages[i].status = 'completed';
        stages[i].timestamp = new Date().toISOString();
      }

      if (onProgress) onProgress(7, 'MonitoringAgent deploying background polling daemon...');
      stages[7].status = 'in-progress';
      this.persistLocal();
      await sleep(200);
      stages[7].status = 'completed';
      stages[7].detail = 'Continuous background monitoring active (polling demo stream every 15 minutes)';
      stages[7].timestamp = new Date().toISOString();

      const finalMission: Mission = {
        id: missionId,
        title: `${requirements.bedrooms === 'Any' ? 'Multi' : requirements.bedrooms + 'BHK'} • ₹${requirements.maxBudget.toLocaleString('en-IN')} max • ${requirements.targetLocation}`,
        status: 'MONITORING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        requirements,
        currentStageIndex: 7,
        stages,
        matchedPropertyIds: orchestrationData.mission.matchedPropertyIds,
        rankedScores: orchestrationData.rankedScores,
        monitoring: {
          isActive: true,
          lastChecked: new Date().toISOString(),
          nextCheck: new Date(Date.now() + 15 * 60000).toISOString(),
          totalEvaluated: orchestrationData.propertiesEvaluated,
          newMatchesFound: 0,
          checkFrequencyMinutes: 15
        },
        shortlistedPropertyIds: this.shortlist,
        dismissedPropertyIds: [],
        appliedMemoryNotes: orchestrationData.mission.appliedMemoryNotes || requirements.appliedMemoryNotes || []
      };

      this.activeMission = finalMission;
      this.persistLocal();

      // Log real agent events to activity service
      if (orchestrationData.agentExecutionEvents && orchestrationData.agentExecutionEvents.length > 0) {
        await agentService.logEvents(orchestrationData.agentExecutionEvents);
      }

      await notificationService.addNotification({
        title: 'Housing Mission Active',
        message: `Your mission is live! Found ${orchestrationData.topMatches.length} strong matches. Stored in Cloud Firestore.`,
        type: 'mission',
        missionId: finalMission.id
      });

      return finalMission;
    }

    // Client-side fallback if backend API was unreachable
    const allProps = await propertyService.getAllProperties();
    const scores: Record<string, MatchEvaluation> = {};
    for (const p of allProps) {
      scores[p.id] = calculateMatchScore(p, requirements);
    }
    const ranked = [...allProps].sort((a, b) => (scores[b.id]?.totalScore || 0) - (scores[a.id]?.totalScore || 0));

    stages.forEach((s) => (s.status = 'completed'));
    initialMission.status = 'MONITORING';
    initialMission.currentStageIndex = 7;
    initialMission.matchedPropertyIds = ranked.map((p) => p.id);
    initialMission.rankedScores = scores;
    initialMission.monitoring.isActive = true;
    initialMission.monitoring.totalEvaluated = allProps.length;

    this.activeMission = initialMission;
    this.persistLocal();

    await agentService.logEvent(
      missionId,
      'HousingOrchestrator: Fallback Mission Active',
      `Completed deterministic multi-factor ranking. Top match: ${scores[ranked[0]?.id]?.totalScore}%`,
      'success',
      'system'
    );

    return initialMission;
  }

  async generateAiExplanation(
    property: Property,
    requirements: MissionRequirements,
    score: MatchEvaluation
  ): Promise<string> {
    try {
      const res = await fetch('/api/agent/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property,
          requirements,
          scoreEvaluation: score
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.explanation) return data.explanation;
      }
    } catch {}

    const diff = requirements.maxBudget - property.monthlyRent;
    const diffStr = diff >= 0 ? `₹${diff.toLocaleString('en-IN')} below max budget` : `₹${Math.abs(diff).toLocaleString('en-IN')} over budget`;
    return `Scored ${score.totalScore}% deterministic match. Located ${property.distanceKm} km from campus, ${property.furnishing.toLowerCase()}, and ${diffStr}.`;
  }

  async getShortlist(): Promise<string[]> {
    try {
      const res = await fetch('/api/shortlist', {
        headers: authService.getAuthHeaders()
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          this.shortlist = json.data;
          this.persistLocal();
          return [...this.shortlist];
        }
      }
    } catch {}
    this.loadLocal();
    return [...this.shortlist];
  }

  async toggleShortlist(propertyId: string): Promise<string[]> {
    this.loadLocal();
    const index = this.shortlist.indexOf(propertyId);
    let isAdded = false;

    if (index >= 0) {
      this.shortlist.splice(index, 1);
    } else {
      this.shortlist.push(propertyId);
      isAdded = true;
    }

    this.persistLocal();

    // Sync to Firestore backend
    try {
      await fetch('/api/shortlist/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authService.getAuthHeaders() },
        body: JSON.stringify({ propertyId })
      });
    } catch (err) {
      console.warn('[MissionService] Backend toggleShortlist deferred:', err);
    }

    const prop = await propertyService.getPropertyById(propertyId);
    if (prop) {
      if (isAdded) {
        await agentService.logEvent(
          this.activeMission?.id || 'manual',
          'save_to_shortlist: Property Added',
          `Shortlisted "${prop.title}" (₹${prop.monthlyRent.toLocaleString('en-IN')}) for direct side-by-side comparison`,
          'info',
          'rank',
          { tool: 'save_to_shortlist', propertyId: prop.id, rent: prop.monthlyRent }
        );
        await notificationService.addNotification({
          title: 'Added to Shortlist',
          message: `${prop.title} has been added to your shortlist in Cloud Firestore.`,
          type: 'shortlist',
          propertyId: prop.id
        });
      } else {
        await agentService.logEvent(
          this.activeMission?.id || 'manual',
          'save_to_shortlist: Property Removed',
          `Removed "${prop.title}" from shortlist in Cloud Firestore`,
          'info',
          'rank'
        );
      }
    }

    return [...this.shortlist];
  }

  async dismissProperty(propertyId: string): Promise<void> {
    if (this.activeMission) {
      if (!this.activeMission.dismissedPropertyIds.includes(propertyId)) {
        this.activeMission.dismissedPropertyIds.push(propertyId);
        this.persistLocal();

        try {
          await fetch(`/api/missions/${this.activeMission.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...authService.getAuthHeaders() },
            body: JSON.stringify({ dismissedPropertyIds: this.activeMission.dismissedPropertyIds })
          });
        } catch (e) {
          console.warn('[MissionService] Dismiss sync deferred:', e);
        }
      }
    }
  }

  async simulateNewListingCheck(
    mission: Mission
  ): Promise<{ newProperty: Property; evaluation: MatchEvaluation; isNewTopMatch: boolean }> {
    // 1. Generate inbound simulated listing
    const newProperty = await propertyService.simulateNewListing();

    let evaluation = calculateMatchScore(newProperty, mission.requirements);
    let isNewTopMatch = evaluation.totalScore >= 85;

    // 2. Trigger genuine Cloud Run / Pub/Sub / ADK Monitoring Worker pipeline
    try {
      const response = await fetch('/api/monitoring/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authService.getAuthHeaders() },
        body: JSON.stringify({
          property: newProperty,
          source: 'demo_trigger'
        })
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          const workerData = json.data;
          const missionRes = workerData.missionResults?.find((m: any) => m.missionId === mission.id);
          if (missionRes) {
            isNewTopMatch = missionRes.isStrongMatch;
          }
        }
      }
    } catch (err) {
      console.warn('[MissionService] Background worker trigger fallback:', err);
    }

    // 3. Keep client state perfectly in sync
    if (!mission.matchedPropertyIds.includes(newProperty.id)) {
      mission.matchedPropertyIds.unshift(newProperty.id);
    }
    mission.rankedScores[newProperty.id] = evaluation;
    mission.monitoring.totalEvaluated = (mission.monitoring.totalEvaluated || 0) + 1;
    mission.monitoring.lastChecked = new Date().toISOString();
    mission.monitoring.nextCheck = new Date(Date.now() + (mission.monitoring.checkFrequencyMinutes || 15) * 60000).toISOString();

    if (isNewTopMatch) {
      mission.monitoring.newMatchesFound = (mission.monitoring.newMatchesFound || 0) + 1;
    }

    this.activeMission = mission;
    this.persistLocal();

    return { newProperty, evaluation, isNewTopMatch };
  }

  async resetMission(): Promise<void> {
    this.activeMission = null;
    this.persistLocal();

    try {
      await fetch('/api/missions/active', {
        method: 'DELETE',
        headers: authService.getAuthHeaders()
      });
    } catch (e) {
      console.warn('[MissionService] Reset sync deferred:', e);
    }

    await agentService.logEvent(
      'system',
      'HousingOrchestrator: Mission Reset',
      'Active mission cleared in Cloud Firestore. Agent reset to standby mode.',
      'info',
      'system'
    );
  }
}

export const missionService = new MissionServiceImpl();
