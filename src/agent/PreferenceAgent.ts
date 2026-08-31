import { Property, MissionRequirements, AgentActivityEvent } from '../types';

export interface PreferenceEvaluationResult {
  preferredProperties: Property[];
  floorMatches: number;
  furnishingMatches: number;
  parkingMatches: number;
  amenitiesMatchMap: Record<string, number>;
  event: AgentActivityEvent;
}

export class PreferenceAgent {
  async evaluate(
    properties: Property[],
    requirements: MissionRequirements,
    missionId: string
  ): Promise<PreferenceEvaluationResult> {
    const timestamp = new Date().toISOString();

    let floorMatches = 0;
    let furnishingMatches = 0;
    let parkingMatches = 0;
    const amenitiesMatchMap: Record<string, number> = {};
    const preferredProperties: Property[] = [];

    for (const prop of properties) {
      // 1. Floor check (avoid ground floor if requested)
      const satisfiesFloor = !requirements.avoidGroundFloor || prop.floor > 0;
      if (satisfiesFloor) floorMatches++;

      // 2. Furnishing check
      const reqFurn = requirements.furnishing;
      const satisfiesFurnishing = 
        reqFurn === 'Any' || 
        reqFurn === prop.furnishing || 
        (reqFurn === 'Furnished' && prop.furnishing === 'Semi-Furnished');
      if (satisfiesFurnishing) furnishingMatches++;

      // 3. Parking check
      const satisfiesParking = !requirements.parkingRequired || (prop.parking === 'Covered' || prop.parking === 'Open');
      if (satisfiesParking) parkingMatches++;

      // 4. Amenities matching
      let matchedAmenityCount = 0;
      if (requirements.preferredAmenities && requirements.preferredAmenities.length > 0) {
        for (const am of requirements.preferredAmenities) {
          if (prop.amenities.some(a => a.toLowerCase().includes(am.toLowerCase()))) {
            matchedAmenityCount++;
          }
        }
      }
      amenitiesMatchMap[prop.id] = matchedAmenityCount;

      // Keep property if it satisfies core lifestyle rules
      if (satisfiesFloor) {
        preferredProperties.push(prop);
      }
    }

    const event: AgentActivityEvent = {
      id: `evt-${Date.now()}-pref`,
      missionId,
      timestamp,
      taskName: 'PreferenceAgent: Lifestyle & Amenities Match',
      status: 'success',
      category: 'evaluate',
      description: `Screened preferences: ${floorMatches}/${properties.length} passed floor constraint (avoid ground: ${requirements.avoidGroundFloor ? 'Yes' : 'No'}), ${furnishingMatches} furnishing matches, ${parkingMatches} parking matches`,
      dataSnapshot: {
        agent: 'PreferenceAgent',
        avoidGroundFloor: requirements.avoidGroundFloor,
        floorMatches,
        furnishingMatches,
        parkingMatches,
        preferredCount: preferredProperties.length
      }
    };

    return {
      preferredProperties,
      floorMatches,
      furnishingMatches,
      parkingMatches,
      amenitiesMatchMap,
      event
    };
  }
}
