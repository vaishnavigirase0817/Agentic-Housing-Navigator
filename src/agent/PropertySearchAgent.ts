import { Property, MissionRequirements, AgentActivityEvent } from '../types';
import { searchPropertiesTool } from '../tools';

export interface PropertySearchResult {
  candidateProperties: Property[];
  totalIndexed: number;
  filteredCount: number;
  event: AgentActivityEvent;
}

export class PropertySearchAgent {
  async execute(
    requirements: MissionRequirements,
    missionId: string
  ): Promise<PropertySearchResult> {
    const timestamp = new Date().toISOString();

    // 1. Tool Call: search_properties
    const searchArgs = {
      bedrooms: requirements.bedrooms,
      maxBudget: requirements.maxBudget,
      minBudget: requirements.minBudget,
      propertyType: requirements.propertyType,
      targetLocation: requirements.targetLocation,
      maxDistanceKm: requirements.maxDistanceKm,
      furnishing: requirements.furnishing,
      avoidGroundFloor: false, // Let downstream preference agent evaluate floor rules
      parkingRequired: false
    };

    const toolResult = searchPropertiesTool.execute(searchArgs);
    const candidateProperties = toolResult.properties;

    const event: AgentActivityEvent = {
      id: `evt-${Date.now()}-search`,
      missionId,
      timestamp,
      taskName: 'PropertySearchAgent: Dataset Index Query',
      agent: 'PropertySearchAgent',
      action: 'search_properties',
      status: 'success',
      category: 'search',
      description: `Indexed ${toolResult.totalFound} total properties; filtered ${candidateProperties.length} active candidates matching core structural parameters`,
      dataSnapshot: {
        agent: 'PropertySearchAgent',
        toolUsed: 'search_properties',
        searchCriteria: searchArgs,
        totalDatasetSize: toolResult.totalFound,
        candidateCount: candidateProperties.length,
        sampleCandidateIds: candidateProperties.slice(0, 5).map(p => p.id)
      },
      metadata: {
        toolUsed: 'search_properties',
        candidateCount: candidateProperties.length,
        totalDatasetSize: toolResult.totalFound
      }
    };

    return {
      candidateProperties,
      totalIndexed: toolResult.totalFound,
      filteredCount: candidateProperties.length,
      event
    };
  }
}
