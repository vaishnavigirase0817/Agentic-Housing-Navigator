import { Property, MissionRequirements, AgentActivityEvent } from '../types';

export interface LocationEvaluationResult {
  locatedProperties: Property[];
  withinRadiusCount: number;
  extendedRadiusCount: number;
  closestDistanceKm: number;
  averageDistanceKm: number;
  event: AgentActivityEvent;
}

export class LocationAgent {
  async evaluate(
    properties: Property[],
    requirements: MissionRequirements,
    missionId: string
  ): Promise<LocationEvaluationResult> {
    const timestamp = new Date().toISOString();
    const maxRadius = requirements.maxDistanceKm || 3.0;
    const extendedRadius = maxRadius * 1.4;

    let withinRadiusCount = 0;
    let extendedRadiusCount = 0;
    const locatedProperties: Property[] = [];

    for (const prop of properties) {
      if (prop.distanceKm <= maxRadius) {
        withinRadiusCount++;
        locatedProperties.push(prop);
      } else if (prop.distanceKm <= extendedRadius) {
        extendedRadiusCount++;
        locatedProperties.push(prop);
      }
    }

    const distances = locatedProperties.map(p => p.distanceKm);
    const closestDistanceKm = distances.length > 0 ? Math.min(...distances) : 0;
    const averageDistanceKm = distances.length > 0 
      ? Number((distances.reduce((acc, d) => acc + d, 0) / distances.length).toFixed(1))
      : 0;

    const event: AgentActivityEvent = {
      id: `evt-${Date.now()}-location`,
      missionId,
      timestamp,
      taskName: 'LocationAgent: Campus Proximity Analysis',
      status: 'success',
      category: 'evaluate',
      description: `Analyzed proximity to "${requirements.targetLocation}": ${withinRadiusCount} within ≤ ${maxRadius}km radius, ${extendedRadiusCount} within ${extendedRadius.toFixed(1)}km buffer. Closest: ${closestDistanceKm}km`,
      dataSnapshot: {
        agent: 'LocationAgent',
        targetLocation: requirements.targetLocation,
        targetRadiusKm: maxRadius,
        withinRadiusCount,
        extendedRadiusCount,
        closestDistanceKm,
        averageDistanceKm
      }
    };

    return {
      locatedProperties,
      withinRadiusCount,
      extendedRadiusCount,
      closestDistanceKm,
      averageDistanceKm,
      event
    };
  }
}
