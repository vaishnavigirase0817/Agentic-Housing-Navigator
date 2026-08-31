import { GoogleGenAI } from '@google/genai';
import { 
  Mission, 
  MissionRequirements, 
  Property, 
  MatchEvaluation, 
  AgentActivityEvent, 
  MissionStage 
} from '../types';
import { RequirementAgent } from './RequirementAgent';
import { PropertySearchAgent } from './PropertySearchAgent';
import { BudgetAgent } from './BudgetAgent';
import { LocationAgent } from './LocationAgent';
import { PreferenceAgent } from './PreferenceAgent';
import { RankingAgent, TopMatchEntry } from './RankingAgent';
import { MonitoringAgent } from './MonitoringAgent';

export interface AgentOrchestrationResult {
  missionId: string;
  mission: Mission;
  requirements: MissionRequirements;
  propertiesEvaluated: number;
  matchedCount: number;
  topMatches: TopMatchEntry[];
  rankedScores: Record<string, MatchEvaluation>;
  recommendationReasoning: string[];
  monitoringActivated: boolean;
  agentExecutionEvents: AgentActivityEvent[];
  agentSummary: {
    requirementAgent: { status: string; extracted: any };
    propertySearchAgent: { status: string; totalFound: number };
    budgetAgent: { status: string; withinBudgetCount: number };
    locationAgent: { status: string; withinRadiusCount: number };
    preferenceAgent: { status: string; passedCount: number };
    rankingAgent: { status: string; topScore: number };
    monitoringAgent: { status: string; daemonActive: boolean };
  };
  error?: string;
}

export class HousingOrchestrator {
  private genAI: GoogleGenAI | null;
  private requirementAgent: RequirementAgent;
  private propertySearchAgent: PropertySearchAgent;
  private budgetAgent: BudgetAgent;
  private locationAgent: LocationAgent;
  private preferenceAgent: PreferenceAgent;
  private rankingAgent: RankingAgent;
  private monitoringAgent: MonitoringAgent;

  constructor(genAI: GoogleGenAI | null) {
    this.genAI = genAI;
    this.requirementAgent = new RequirementAgent(genAI);
    this.propertySearchAgent = new PropertySearchAgent();
    this.budgetAgent = new BudgetAgent();
    this.locationAgent = new LocationAgent();
    this.preferenceAgent = new PreferenceAgent();
    this.rankingAgent = new RankingAgent(genAI);
    this.monitoringAgent = new MonitoringAgent();
  }

  /**
   * Primary ADK multi-agent orchestrator entry point.
   * Coordinates the specialized agents in sequential, verifiable steps.
   */
  async orchestrateMission(
    queryOrReq: string | Partial<MissionRequirements>,
    onStageUpdate?: (stageIndex: number, stageName: string, detail: string) => void
  ): Promise<AgentOrchestrationResult> {
    const missionId = `mission-${Date.now()}`;
    const executionEvents: AgentActivityEvent[] = [];

    // Root initialization event
    const initEvent: AgentActivityEvent = {
      id: `evt-${Date.now()}-orch-init`,
      missionId,
      timestamp: new Date().toISOString(),
      taskName: 'HousingOrchestrator: Pipeline Dispatched',
      status: 'active',
      category: 'system',
      description: 'Root coordinator started Google ADK multi-agent workflow across 7 specialized agents.',
      dataSnapshot: {
        agent: 'HousingOrchestrator',
        input: typeof queryOrReq === 'string' ? queryOrReq : 'Structured parameters',
        specializedAgents: [
          'RequirementAgent',
          'PropertySearchAgent',
          'BudgetAgent',
          'LocationAgent',
          'PreferenceAgent',
          'RankingAgent',
          'MonitoringAgent'
        ]
      }
    };
    executionEvents.push(initEvent);

    const stages: MissionStage[] = [
      { id: 'stage-1', name: 'Requirement Understanding', status: 'pending', detail: 'RequirementAgent parsing constraints' },
      { id: 'stage-2', name: 'Property Search', status: 'pending', detail: 'PropertySearchAgent querying data services' },
      { id: 'stage-3', name: 'Budget Evaluation', status: 'pending', detail: 'BudgetAgent auditing rents & affordability' },
      { id: 'stage-4', name: 'Location Evaluation', status: 'pending', detail: 'LocationAgent computing distance & transit proximity' },
      { id: 'stage-5', name: 'Preference Matching', status: 'pending', detail: 'PreferenceAgent verifying furnishing & amenities' },
      { id: 'stage-6', name: 'Property Ranking', status: 'pending', detail: 'RankingAgent running deterministic scoring & AI rationale' },
      { id: 'stage-7', name: 'Shortlist Generation', status: 'pending', detail: 'HousingOrchestrator synthesizing top recommendations' },
      { id: 'stage-8', name: 'Monitoring Activation', status: 'pending', detail: 'MonitoringAgent deploying background daemon' }
    ];

    try {
      // ==============================================================
      // STEP 1: RequirementAgent
      // ==============================================================
      stages[0].status = 'in-progress';
      if (onStageUpdate) onStageUpdate(0, 'Requirement Understanding', 'RequirementAgent parsing intent...');
      
      const rawQueryString = typeof queryOrReq === 'string' ? queryOrReq : (queryOrReq.rawQuery || '');
      const existingReqs = typeof queryOrReq === 'object' ? queryOrReq : undefined;

      let reqResult;
      try {
        reqResult = await this.requirementAgent.process(rawQueryString, missionId, existingReqs);
        executionEvents.push(reqResult.event);
        stages[0].status = 'completed';
        stages[0].detail = `Understood: ${reqResult.requirements.bedrooms}BHK ${reqResult.requirements.propertyType}, Max ₹${reqResult.requirements.maxBudget.toLocaleString('en-IN')}, ≤ ${reqResult.requirements.maxDistanceKm}km`;
        stages[0].timestamp = new Date().toISOString();
      } catch (err: any) {
        console.error('RequirementAgent encountered an error:', err);
        const errEvent: AgentActivityEvent = {
          id: `evt-${Date.now()}-req-err`,
          missionId,
          timestamp: new Date().toISOString(),
          taskName: 'RequirementAgent: Error (Recovered)',
          status: 'warning',
          category: 'understand',
          description: `RequirementAgent error: ${err?.message || 'Parse issue'}. Defaulted to fallback constraints.`,
          dataSnapshot: { error: String(err) }
        };
        executionEvents.push(errEvent);
        reqResult = {
          requirements: {
            rawQuery: rawQueryString || 'Fallback 2BHK mission',
            propertyType: 'Apartment',
            bedrooms: 2,
            maxBudget: 15000,
            minBudget: 8000,
            targetLocation: 'Near College Campus',
            maxDistanceKm: 3.0,
            furnishing: 'Furnished' as const,
            moveInDate: 'Next month',
            preferredAmenities: ['Power Backup', 'Lift', 'Wi-Fi'],
            parkingRequired: true,
            preferredFloor: 'Avoid Ground' as const,
            avoidGroundFloor: true,
            petFriendlyRequired: false,
            additionalNotes: 'Recovered via fallback'
          },
          rawQuery: rawQueryString,
          source: 'deterministic_fallback' as const,
          confidence: 0.7,
          extractedParameters: {},
          event: errEvent
        };
        stages[0].status = 'completed';
      }

      const requirements = reqResult.requirements;

      // ==============================================================
      // STEP 2: PropertySearchAgent
      // ==============================================================
      stages[1].status = 'in-progress';
      if (onStageUpdate) onStageUpdate(1, 'Property Search', 'PropertySearchAgent indexing listings...');
      
      const searchResult = await this.propertySearchAgent.execute(requirements, missionId);
      executionEvents.push(searchResult.event);
      stages[1].status = 'completed';
      stages[1].detail = `Retrieved ${searchResult.totalIndexed} listings from data service (${searchResult.filteredCount} initial candidates)`;
      stages[1].count = searchResult.filteredCount;
      stages[1].timestamp = new Date().toISOString();

      // ==============================================================
      // STEP 3: BudgetAgent
      // ==============================================================
      stages[2].status = 'in-progress';
      if (onStageUpdate) onStageUpdate(2, 'Budget Evaluation', 'BudgetAgent calculating affordability...');
      
      const budgetResult = await this.budgetAgent.evaluate(searchResult.candidateProperties, requirements, missionId);
      executionEvents.push(budgetResult.event);
      stages[2].status = 'completed';
      stages[2].detail = `${budgetResult.withinStrictBudgetCount} properties ≤ ₹${requirements.maxBudget.toLocaleString('en-IN')}, ${budgetResult.bufferStretchCount} within 15% stretch ceiling`;
      stages[2].count = budgetResult.qualifiedProperties.length;
      stages[2].timestamp = new Date().toISOString();

      // ==============================================================
      // STEP 4: LocationAgent
      // ==============================================================
      stages[3].status = 'in-progress';
      if (onStageUpdate) onStageUpdate(3, 'Location Evaluation', 'LocationAgent evaluating campus radius...');
      
      const locationResult = await this.locationAgent.evaluate(budgetResult.qualifiedProperties, requirements, missionId);
      executionEvents.push(locationResult.event);
      stages[3].status = 'completed';
      stages[3].detail = `${locationResult.withinRadiusCount} properties within ≤ ${requirements.maxDistanceKm}km campus radius`;
      stages[3].count = locationResult.locatedProperties.length;
      stages[3].timestamp = new Date().toISOString();

      // ==============================================================
      // STEP 5: PreferenceAgent
      // ==============================================================
      stages[4].status = 'in-progress';
      if (onStageUpdate) onStageUpdate(4, 'Preference Matching', 'PreferenceAgent checking floor & amenities...');
      
      const prefResult = await this.preferenceAgent.evaluate(locationResult.locatedProperties, requirements, missionId);
      executionEvents.push(prefResult.event);
      stages[4].status = 'completed';
      stages[4].detail = `${prefResult.floorMatches} properties satisfied floor & lifestyle preferences`;
      stages[4].count = prefResult.preferredProperties.length;
      stages[4].timestamp = new Date().toISOString();

      // ==============================================================
      // STEP 6: RankingAgent (Deterministic Scoring + AI Explanation)
      // ==============================================================
      stages[5].status = 'in-progress';
      if (onStageUpdate) onStageUpdate(5, 'Property Ranking', 'RankingAgent running 7-factor scoring engine...');
      
      // Score against ALL properties in dataset for complete ranking visibility
      const rankingResult = await this.rankingAgent.rankAndExplain(searchResult.candidateProperties, requirements, missionId);
      executionEvents.push(rankingResult.event);
      stages[5].status = 'completed';
      stages[5].detail = `Ranked ${rankingResult.rankedProperties.length} properties. Top match: ${rankingResult.topScore}%`;
      stages[5].timestamp = new Date().toISOString();

      // ==============================================================
      // STEP 7: Shortlist Synthesis
      // ==============================================================
      stages[6].status = 'in-progress';
      if (onStageUpdate) onStageUpdate(6, 'Shortlist Generation', 'Synthesizing top recommendations...');
      
      const topMatches = rankingResult.topMatches;
      stages[6].status = 'completed';
      stages[6].detail = `Compiled top ${topMatches.length} recommended properties with trade-off insights`;
      stages[6].count = topMatches.length;
      stages[6].timestamp = new Date().toISOString();

      // ==============================================================
      // STEP 8: MonitoringAgent
      // ==============================================================
      stages[7].status = 'in-progress';
      if (onStageUpdate) onStageUpdate(7, 'Monitoring Activation', 'MonitoringAgent deploying background listener...');
      
      const monitoringResult = await this.monitoringAgent.activate(
        missionId,
        requirements,
        rankingResult.rankedProperties.map(p => p.id),
        rankingResult.rankedScores,
        topMatches.length
      );
      executionEvents.push(monitoringResult.event);
      stages[7].status = 'completed';
      stages[7].detail = 'Continuous background listener active (polling frequency: 15 mins)';
      stages[7].timestamp = new Date().toISOString();

      // Final mission object
      const finalMission: Mission = {
        id: missionId,
        title: `${requirements.bedrooms === 'Any' ? 'Multi' : requirements.bedrooms + 'BHK'} • ₹${requirements.maxBudget.toLocaleString('en-IN')} max • ${requirements.targetLocation}`,
        status: 'MONITORING',
        createdAt: new Date().toISOString(),
        requirements,
        currentStageIndex: 7,
        stages,
        matchedPropertyIds: rankingResult.rankedProperties.map(p => p.id),
        rankedScores: rankingResult.rankedScores,
        monitoring: {
          isActive: true,
          lastChecked: new Date().toISOString(),
          nextCheck: new Date(Date.now() + 15 * 60000).toISOString(),
          totalEvaluated: rankingResult.rankedProperties.length,
          newMatchesFound: 0,
          checkFrequencyMinutes: 15
        },
        shortlistedPropertyIds: [],
        dismissedPropertyIds: [],
        appliedMemoryNotes: requirements.appliedMemoryNotes || []
      };

      // Completion event
      const completeEvent: AgentActivityEvent = {
        id: `evt-${Date.now()}-orch-done`,
        missionId,
        timestamp: new Date().toISOString(),
        taskName: 'HousingOrchestrator: Mission Workflow Succeeded',
        agent: 'HousingOrchestrator',
        action: 'complete_pipeline',
        status: 'success',
        category: 'system',
        description: `Autonomous housing mission ready. Evaluated ${rankingResult.rankedProperties.length} listings. Highest match score: ${rankingResult.topScore}%. Monitoring armed.`,
        dataSnapshot: {
          agent: 'HousingOrchestrator',
          missionId,
          totalEvaluated: rankingResult.rankedProperties.length,
          topMatchTitle: rankingResult.rankedProperties[0]?.title,
          topMatchScore: rankingResult.topScore,
          topMatchCount: topMatches.length,
          appliedMemoryNotes: requirements.appliedMemoryNotes
        },
        metadata: {
          topScore: rankingResult.topScore,
          totalProperties: rankingResult.rankedProperties.length,
          appliedMemoryNotes: requirements.appliedMemoryNotes
        }
      };
      executionEvents.push(completeEvent);

      return {
        missionId,
        mission: finalMission,
        requirements,
        propertiesEvaluated: rankingResult.rankedProperties.length,
        matchedCount: rankingResult.rankedProperties.filter(p => (rankingResult.rankedScores[p.id]?.totalScore || 0) >= 70).length,
        topMatches,
        rankedScores: rankingResult.rankedScores,
        recommendationReasoning: rankingResult.recommendationReasoning,
        monitoringActivated: true,
        agentExecutionEvents: executionEvents,
        agentSummary: {
          requirementAgent: { status: 'success', extracted: requirements },
          propertySearchAgent: { status: 'success', totalFound: searchResult.totalIndexed },
          budgetAgent: { status: 'success', withinBudgetCount: budgetResult.withinStrictBudgetCount },
          locationAgent: { status: 'success', withinRadiusCount: locationResult.withinRadiusCount },
          preferenceAgent: { status: 'success', passedCount: prefResult.floorMatches },
          rankingAgent: { status: 'success', topScore: rankingResult.topScore },
          monitoringAgent: { status: 'active', daemonActive: true }
        }
      };

    } catch (criticalErr: any) {
      console.error('HousingOrchestrator encountered critical workflow error:', criticalErr);
      const failEvent: AgentActivityEvent = {
        id: `evt-${Date.now()}-orch-fail`,
        missionId,
        timestamp: new Date().toISOString(),
        taskName: 'HousingOrchestrator: Pipeline Exception (Handled)',
        status: 'error',
        category: 'system',
        description: `Workflow exception caught: ${criticalErr?.message || 'Pipeline execution failure'}. Emitting controlled fallback state.`,
        dataSnapshot: { error: String(criticalErr) }
      };
      executionEvents.push(failEvent);

      // Controlled fallback response
      const fallbackReq: MissionRequirements = {
        rawQuery: typeof queryOrReq === 'string' ? queryOrReq : 'Fallback search',
        propertyType: 'Apartment',
        bedrooms: 2,
        maxBudget: 15000,
        minBudget: 8000,
        targetLocation: 'Near College Campus',
        maxDistanceKm: 3.0,
        furnishing: 'Furnished',
        moveInDate: 'Next month',
        preferredAmenities: ['Power Backup', 'Lift', 'Wi-Fi'],
        parkingRequired: true,
        preferredFloor: 'Avoid Ground',
        avoidGroundFloor: true,
        petFriendlyRequired: false
      };

      const fallbackMission: Mission = {
        id: missionId,
        title: '2BHK • ₹15,000 max • Near College Campus',
        status: 'ERROR',
        createdAt: new Date().toISOString(),
        requirements: fallbackReq,
        currentStageIndex: 0,
        stages,
        matchedPropertyIds: [],
        rankedScores: {},
        monitoring: {
          isActive: false,
          lastChecked: new Date().toISOString(),
          nextCheck: new Date().toISOString(),
          totalEvaluated: 0,
          newMatchesFound: 0,
          checkFrequencyMinutes: 15
        },
        shortlistedPropertyIds: [],
        dismissedPropertyIds: []
      };

      return {
        missionId,
        mission: fallbackMission,
        requirements: fallbackReq,
        propertiesEvaluated: 0,
        matchedCount: 0,
        topMatches: [],
        rankedScores: {},
        recommendationReasoning: ['Pipeline error encountered during execution. Safe fallback provided.'],
        monitoringActivated: false,
        agentExecutionEvents: executionEvents,
        agentSummary: {
          requirementAgent: { status: 'fallback', extracted: fallbackReq },
          propertySearchAgent: { status: 'skipped', totalFound: 0 },
          budgetAgent: { status: 'skipped', withinBudgetCount: 0 },
          locationAgent: { status: 'skipped', withinRadiusCount: 0 },
          preferenceAgent: { status: 'skipped', passedCount: 0 },
          rankingAgent: { status: 'skipped', topScore: 0 },
          monitoringAgent: { status: 'inactive', daemonActive: false }
        },
        error: criticalErr?.message || 'Agent pipeline failure'
      };
    }
  }
}
