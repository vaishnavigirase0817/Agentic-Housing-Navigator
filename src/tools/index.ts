import { 
  Property, 
  MissionRequirements, 
  MatchEvaluation, 
  SavedPreferences, 
  AppNotification, 
  Mission,
  AgentApprovalRequest
} from '../types';
import { INITIAL_DEMO_PROPERTIES } from '../data/properties';
import { calculateMatchScore, calculateAffordability } from '../services/scoringService';

/**
 * In-memory repository for server-side / tool-level operations.
 * Holds properties, preferences, missions, and notifications.
 */
class AgentToolDataContext {
  private properties: Property[] = [...INITIAL_DEMO_PROPERTIES];
  private preferences: SavedPreferences = {
    maxBudget: 15000,
    minBudget: 8000,
    preferredPropertyType: 'Apartment',
    preferredFurnishing: 'Furnished',
    preferredDistanceKm: 3.0,
    avoidGroundFloor: true,
    parkingRequired: true,
    preferredAmenities: ['Power Backup', 'Lift', 'Wi-Fi', '24/7 Security'],
    targetLocality: 'Near College Campus',
    petFriendly: false,
    updatedAt: new Date().toISOString()
  };
  private shortlist: string[] = [];
  private missions: Map<string, Mission> = new Map();
  private notifications: AppNotification[] = [];

  getProperties(): Property[] {
    return [...this.properties];
  }

  getProperty(id: string): Property | null {
    return this.properties.find(p => p.id === id) || null;
  }

  addProperty(property: Property): void {
    this.properties.unshift(property);
  }

  getPreferences(): SavedPreferences {
    return { ...this.preferences };
  }

  savePreferences(prefs: Partial<SavedPreferences>): SavedPreferences {
    this.preferences = {
      ...this.preferences,
      ...prefs,
      updatedAt: new Date().toISOString()
    };
    return { ...this.preferences };
  }

  getShortlist(): string[] {
    return [...this.shortlist];
  }

  toggleShortlist(propertyId: string): { shortlist: string[]; added: boolean } {
    const idx = this.shortlist.indexOf(propertyId);
    let added = false;
    if (idx >= 0) {
      this.shortlist.splice(idx, 1);
      added = false;
    } else {
      this.shortlist.push(propertyId);
      added = true;
    }
    return { shortlist: [...this.shortlist], added };
  }

  saveMission(mission: Mission): void {
    this.missions.set(mission.id, mission);
  }

  getMission(id: string): Mission | null {
    return this.missions.get(id) || null;
  }

  addNotification(notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>): AppNotification {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      read: false
    };
    this.notifications.unshift(newNotif);
    return newNotif;
  }

  getNotifications(): AppNotification[] {
    return [...this.notifications];
  }

  reset(): void {
    this.properties = [...INITIAL_DEMO_PROPERTIES];
    this.shortlist = [];
    this.missions.clear();
    this.notifications = [];
  }
}

export const agentToolDataContext = new AgentToolDataContext();

// ==========================================
// AGENT TOOL DEFINITIONS & IMPLEMENTATIONS
// ==========================================

export interface ToolDefinition<TArgs = any, TResult = any> {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required: string[];
  };
  execute: (args: TArgs) => Promise<TResult> | TResult;
}

/**
 * 1. search_properties
 * Searches candidate properties based on bedrooms, budget, property type, location, and furnishing.
 */
export const searchPropertiesTool: ToolDefinition<{
  bedrooms?: number | 'Any';
  maxBudget?: number;
  minBudget?: number;
  propertyType?: string;
  targetLocation?: string;
  maxDistanceKm?: number;
  furnishing?: string;
  avoidGroundFloor?: boolean;
  parkingRequired?: boolean;
}> = {
  name: 'search_properties',
  description: 'Search and filter active property listings from the data service using structural criteria.',
  parameters: {
    type: 'object',
    properties: {
      bedrooms: { type: 'string', description: 'Number of bedrooms (e.g. 1, 2, 3) or "Any"' },
      maxBudget: { type: 'number', description: 'Upper monthly rent threshold in INR' },
      minBudget: { type: 'number', description: 'Lower monthly rent threshold in INR' },
      propertyType: { type: 'string', description: 'Type of property (e.g. Apartment, Studio, Villa, Any)' },
      targetLocation: { type: 'string', description: 'Target locality name or reference point' },
      maxDistanceKm: { type: 'number', description: 'Maximum distance from target in kilometers' },
      furnishing: { type: 'string', description: 'Furnishing status (Furnished, Semi-Furnished, Unfurnished, Any)' },
      avoidGroundFloor: { type: 'boolean', description: 'Whether to filter out floor 0 units' },
      parkingRequired: { type: 'boolean', description: 'Whether dedicated vehicle parking is required' }
    },
    required: []
  },
  execute: (args) => {
    let list = agentToolDataContext.getProperties();

    if (args.bedrooms && args.bedrooms !== 'Any') {
      const bhk = Number(args.bedrooms);
      if (!isNaN(bhk)) {
        list = list.filter(p => p.bedrooms === bhk);
      }
    }

    if (args.maxBudget && args.maxBudget > 0) {
      // Allow slight ceiling buffer (15%) for initial candidate pool retrieval
      list = list.filter(p => p.monthlyRent <= (args.maxBudget! * 1.2));
    }

    if (args.propertyType && args.propertyType !== 'Any' && args.propertyType !== 'All') {
      const typeLower = args.propertyType.toLowerCase();
      list = list.filter(p => p.propertyType.toLowerCase().includes(typeLower) || typeLower.includes(p.propertyType.toLowerCase()));
    }

    if (args.maxDistanceKm && args.maxDistanceKm > 0) {
      list = list.filter(p => p.distanceKm <= (args.maxDistanceKm! * 1.5));
    }

    if (args.furnishing && args.furnishing !== 'Any') {
      if (args.furnishing === 'Furnished') {
        list = list.filter(p => p.furnishing === 'Furnished' || p.furnishing === 'Semi-Furnished');
      } else if (args.furnishing === 'Semi-Furnished') {
        list = list.filter(p => p.furnishing === 'Semi-Furnished' || p.furnishing === 'Furnished');
      }
    }

    if (args.avoidGroundFloor) {
      list = list.filter(p => p.floor > 0);
    }

    if (args.parkingRequired) {
      list = list.filter(p => p.parking === 'Covered' || p.parking === 'Open');
    }

    return {
      totalFound: list.length,
      properties: list
    };
  }
};

/**
 * 2. get_property
 * Fetches verified factual data for a specific property.
 */
export const getPropertyTool: ToolDefinition<{ propertyId: string }> = {
  name: 'get_property',
  description: 'Retrieve complete factual details and verified metadata for a specific property ID.',
  parameters: {
    type: 'object',
    properties: {
      propertyId: { type: 'string', description: 'The unique ID of the property' }
    },
    required: ['propertyId']
  },
  execute: ({ propertyId }) => {
    const prop = agentToolDataContext.getProperty(propertyId);
    if (!prop) {
      return { found: false, error: `Property not found for ID: ${propertyId}` };
    }
    return { found: true, property: prop };
  }
};

/**
 * 3. calculate_affordability
 * Calculates financial affordability breakdown.
 */
export const calculateAffordabilityTool: ToolDefinition<{ propertyId: string; userMonthlyBudget?: number }> = {
  name: 'calculate_affordability',
  description: 'Compute total monthly living cost (rent + maintenance + utilities) and upfront move-in cash required.',
  parameters: {
    type: 'object',
    properties: {
      propertyId: { type: 'string', description: 'The property ID to analyze' },
      userMonthlyBudget: { type: 'number', description: 'The user monthly maximum budget in INR' }
    },
    required: ['propertyId']
  },
  execute: ({ propertyId, userMonthlyBudget = 15000 }) => {
    const prop = agentToolDataContext.getProperty(propertyId);
    if (!prop) {
      return { error: `Property ${propertyId} not found` };
    }

    const breakdown = calculateAffordability(prop);
    const savings = userMonthlyBudget - prop.monthlyRent;
    const isUnderBudget = savings >= 0;
    const rentToBudgetRatio = Number((prop.monthlyRent / userMonthlyBudget).toFixed(2));

    return {
      propertyId,
      monthlyRent: breakdown.monthlyRent,
      maintenance: breakdown.maintenance,
      estimatedUtilities: breakdown.estimatedUtilities,
      totalMonthlyHousingCost: breakdown.monthlyHousingCost,
      securityDeposit: breakdown.securityDeposit,
      initialMoveInCost: breakdown.initialMoveInCost,
      budgetComparison: {
        userMonthlyBudget,
        savingsOrOverage: Math.abs(savings),
        isUnderBudget,
        rentToBudgetRatio,
        financialStatus: isUnderBudget ? (savings > 2000 ? 'Comfortably Under Budget' : 'Within Target Budget') : 'Budget Stretch'
      }
    };
  }
};

/**
 * 4. calculate_match_score
 * Runs the deterministic 7-factor scoring engine (0-100%).
 */
export const calculateMatchScoreTool: ToolDefinition<{ propertyId: string; requirements: MissionRequirements }> = {
  name: 'calculate_match_score',
  description: 'Calculate a verifiable, deterministic match score (0-100%) and factor breakdown based on spatial, budget, and lifestyle requirements.',
  parameters: {
    type: 'object',
    properties: {
      propertyId: { type: 'string', description: 'The property ID' },
      requirements: { type: 'object', description: 'The mission requirements object' }
    },
    required: ['propertyId', 'requirements']
  },
  execute: ({ propertyId, requirements }) => {
    const prop = agentToolDataContext.getProperty(propertyId);
    if (!prop) {
      return { error: `Property ${propertyId} not found` };
    }

    const scoreEvaluation = calculateMatchScore(prop, requirements);
    return {
      propertyId,
      totalScore: scoreEvaluation.totalScore,
      breakdown: scoreEvaluation.breakdown,
      matchReasons: scoreEvaluation.matchReasons,
      drawbacks: scoreEvaluation.drawbacks,
      isStrongMatch: scoreEvaluation.isStrongMatch,
      affordabilityStatus: scoreEvaluation.affordabilityStatus
    };
  }
};

/**
 * 5. compare_properties
 * Compares two or more properties side-by-side across key dimensions.
 */
export const comparePropertiesTool: ToolDefinition<{ propertyIds: string[]; requirements?: MissionRequirements }> = {
  name: 'compare_properties',
  description: 'Perform side-by-side comparative analysis between 2 to 4 properties.',
  parameters: {
    type: 'object',
    properties: {
      propertyIds: { type: 'array', description: 'Array of property IDs to compare' },
      requirements: { type: 'object', description: 'Optional mission requirements for contextual comparison' }
    },
    required: ['propertyIds']
  },
  execute: ({ propertyIds, requirements }) => {
    const properties = propertyIds
      .map(id => agentToolDataContext.getProperty(id))
      .filter((p): p is Property => p !== null);

    if (properties.length === 0) {
      return { error: 'No valid properties found for comparison' };
    }

    const comparisonItems = properties.map(p => {
      const affordability = calculateAffordability(p);
      const score = requirements ? calculateMatchScore(p, requirements) : null;
      return {
        id: p.id,
        title: p.title,
        monthlyRent: p.monthlyRent,
        distanceKm: p.distanceKm,
        bedrooms: p.bedrooms,
        furnishing: p.furnishing,
        floor: `${p.floor} / ${p.totalFloors}`,
        parking: p.parking,
        ownerVerified: p.ownerVerified,
        amenitiesCount: p.amenities.length,
        totalMonthlyCost: affordability.monthlyHousingCost,
        initialMoveInCost: affordability.initialMoveInCost,
        matchScore: score ? score.totalScore : undefined
      };
    });

    const cheapest = [...properties].sort((a, b) => a.monthlyRent - b.monthlyRent)[0];
    const closest = [...properties].sort((a, b) => a.distanceKm - b.distanceKm)[0];

    return {
      count: properties.length,
      properties: comparisonItems,
      highlights: {
        mostAffordable: { id: cheapest.id, title: cheapest.title, rent: cheapest.monthlyRent },
        closestToCampus: { id: closest.id, title: closest.title, distanceKm: closest.distanceKm }
      }
    };
  }
};

/**
 * 6. save_to_shortlist
 * Adds or toggles a property on the user shortlist.
 */
export const saveToShortlistTool: ToolDefinition<{ propertyId: string }> = {
  name: 'save_to_shortlist',
  description: 'Save or toggle a property in the user shortlist for deep consideration and comparison.',
  parameters: {
    type: 'object',
    properties: {
      propertyId: { type: 'string', description: 'The property ID to toggle' }
    },
    required: ['propertyId']
  },
  execute: ({ propertyId }) => {
    const result = agentToolDataContext.toggleShortlist(propertyId);
    const prop = agentToolDataContext.getProperty(propertyId);
    return {
      propertyId,
      added: result.added,
      totalShortlisted: result.shortlist.length,
      propertyTitle: prop?.title || 'Unknown Property'
    };
  }
};

/**
 * 7. load_user_preferences
 * Loads persistent user lifestyle preferences from memory service.
 */
export const loadUserPreferencesTool: ToolDefinition<void> = {
  name: 'load_user_preferences',
  description: 'Load long-term user lifestyle constraints, preferred budget, campus location, and floor rules.',
  parameters: {
    type: 'object',
    properties: {},
    required: []
  },
  execute: () => {
    return agentToolDataContext.getPreferences();
  }
};

/**
 * 8. save_user_preference
 * Saves or updates user lifestyle preferences.
 */
export const saveUserPreferenceTool: ToolDefinition<{ preferences: Partial<SavedPreferences> }> = {
  name: 'save_user_preference',
  description: 'Persist updated user preferences and lifestyle constraints to agent memory.',
  parameters: {
    type: 'object',
    properties: {
      preferences: { type: 'object', description: 'Updated preferences object' }
    },
    required: ['preferences']
  },
  execute: ({ preferences }) => {
    const updated = agentToolDataContext.savePreferences(preferences);
    return {
      success: true,
      preferences: updated
    };
  }
};

/**
 * 9. create_mission
 * Creates a structured autonomous search mission.
 */
export const createMissionTool: ToolDefinition<{ requirements: MissionRequirements }> = {
  name: 'create_mission',
  description: 'Initialize a new autonomous housing mission record with requirement parameters.',
  parameters: {
    type: 'object',
    properties: {
      requirements: { type: 'object', description: 'Extracted mission requirements' }
    },
    required: ['requirements']
  },
  execute: ({ requirements }) => {
    const missionId = `mission-${Date.now()}`;
    const mission: Mission = {
      id: missionId,
      title: `${requirements.bedrooms === 'Any' ? 'Multi' : requirements.bedrooms + 'BHK'} • ₹${requirements.maxBudget.toLocaleString('en-IN')} max • ${requirements.targetLocation}`,
      status: 'THINKING',
      createdAt: new Date().toISOString(),
      requirements,
      currentStageIndex: 0,
      stages: [],
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
      shortlistedPropertyIds: agentToolDataContext.getShortlist(),
      dismissedPropertyIds: []
    };

    agentToolDataContext.saveMission(mission);
    return { missionId, mission };
  }
};

/**
 * 10. update_mission
 * Updates status, stages, scores, and monitoring stats of a mission.
 */
export const updateMissionTool: ToolDefinition<{ missionId: string; updates: Partial<Mission> }> = {
  name: 'update_mission',
  description: 'Update the execution stage, match scores, or monitoring stats of an active mission.',
  parameters: {
    type: 'object',
    properties: {
      missionId: { type: 'string', description: 'The mission ID' },
      updates: { type: 'object', description: 'Partial mission updates' }
    },
    required: ['missionId', 'updates']
  },
  execute: ({ missionId, updates }) => {
    const mission = agentToolDataContext.getMission(missionId);
    if (!mission) {
      return { error: `Mission ${missionId} not found` };
    }

    const updatedMission: Mission = {
      ...mission,
      ...updates
    };
    agentToolDataContext.saveMission(updatedMission);
    return { success: true, missionId, status: updatedMission.status };
  }
};

/**
 * 11. create_notification
 * Dispatches an in-app notification to the user.
 */
export const createNotificationTool: ToolDefinition<{
  title: string;
  message: string;
  type: AppNotification['type'];
  propertyId?: string;
  missionId?: string;
  matchScore?: number;
}> = {
  name: 'create_notification',
  description: 'Emit a real-time notification to the user regarding high-score matches, shortlist actions, or mission alerts.',
  parameters: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Notification title' },
      message: { type: 'string', description: 'Notification body message' },
      type: { type: 'string', description: 'Notification type (match, mission, shortlist, preference, system)' },
      propertyId: { type: 'string', description: 'Optional related property ID' },
      missionId: { type: 'string', description: 'Optional related mission ID' },
      matchScore: { type: 'number', description: 'Optional match score percentage' }
    },
    required: ['title', 'message', 'type']
  },
  execute: (args) => {
    const notif = agentToolDataContext.addNotification(args);
    return { success: true, notification: notif };
  }
};

/**
 * 12. calculate_distance
 * Computes commute distance, transit times, and proximity evaluation.
 */
export const calculateDistanceTool: ToolDefinition<{
  originLat?: number;
  originLng?: number;
  originName?: string;
  targetLat?: number;
  targetLng?: number;
  targetName?: string;
  propertyId?: string;
}> = {
  name: 'calculate_distance',
  description: 'Compute precise transit distance, estimated walking/driving duration, and proximity score to target location.',
  parameters: {
    type: 'object',
    properties: {
      originName: { type: 'string', description: 'Origin or property location name' },
      targetName: { type: 'string', description: 'Target destination (e.g., College Campus, Tech Park)' },
      propertyId: { type: 'string', description: 'Optional property ID to look up exact coordinates and distance' }
    },
    required: []
  },
  execute: ({ propertyId, targetName = 'College Campus' }) => {
    let distanceKm = 2.5;
    let locationName = 'Bengaluru Central';
    if (propertyId) {
      const prop = agentToolDataContext.getProperty(propertyId);
      if (prop) {
        distanceKm = prop.distanceKm;
        locationName = prop.locality;
      }
    }
    const walkMins = Math.round(distanceKm * 14);
    const bikeMins = Math.round(distanceKm * 4 + 2);
    const driveMins = Math.round(distanceKm * 5 + 5);

    return {
      propertyId,
      locationName,
      targetDestination: targetName,
      distanceKm,
      transitTimes: {
        walkingMinutes: walkMins,
        twoWheelerMinutes: bikeMins,
        cabOrDrivingMinutes: driveMins
      },
      proximityScore: Math.max(0, Math.min(100, Math.round(100 - (distanceKm / 8) * 60)))
    };
  }
};

/**
 * 13. filter_preferences
 * Evaluates lifestyle rules, floor restrictions, furnishing, and amenity satisfaction.
 */
export const filterPreferencesTool: ToolDefinition<{
  propertyId: string;
  avoidGroundFloor?: boolean;
  preferredFloor?: string;
  furnishing?: string;
  parkingRequired?: boolean;
  petFriendlyRequired?: boolean;
  requiredAmenities?: string[];
}> = {
  name: 'filter_preferences',
  description: 'Evaluate property features against lifestyle rules including floor levels, pet friendliness, parking, and specific amenities.',
  parameters: {
    type: 'object',
    properties: {
      propertyId: { type: 'string', description: 'The property ID' },
      avoidGroundFloor: { type: 'boolean', description: 'Reject or penalize floor 0' },
      furnishing: { type: 'string', description: 'Preferred furnishing level' },
      parkingRequired: { type: 'boolean', description: 'Require dedicated parking' },
      petFriendlyRequired: { type: 'boolean', description: 'Require pet friendly building' },
      requiredAmenities: { type: 'array', description: 'List of required amenities' }
    },
    required: ['propertyId']
  },
  execute: (args) => {
    const prop = agentToolDataContext.getProperty(args.propertyId);
    if (!prop) {
      return { error: `Property ${args.propertyId} not found` };
    }

    const groundFloorPassed = !args.avoidGroundFloor || prop.floor > 0;
    const furnishingPassed = !args.furnishing || args.furnishing === 'Any' || prop.furnishing.toLowerCase().includes(args.furnishing.toLowerCase());
    const parkingPassed = !args.parkingRequired || prop.parking !== 'None';
    const petPassed = !args.petFriendlyRequired || prop.petFriendly;

    const reqAmenities = args.requiredAmenities || [];
    const matchedAmenities = reqAmenities.filter(a => prop.amenities.some(pa => pa.toLowerCase().includes(a.toLowerCase())));
    const amenitySatisfaction = reqAmenities.length > 0 ? (matchedAmenities.length / reqAmenities.length) * 100 : 100;

    const allPassed = groundFloorPassed && furnishingPassed && parkingPassed && petPassed;

    return {
      propertyId: args.propertyId,
      allPassed,
      checks: {
        groundFloorCheck: { passed: groundFloorPassed, actualFloor: prop.floor },
        furnishingCheck: { passed: furnishingPassed, actualFurnishing: prop.furnishing },
        parkingCheck: { passed: parkingPassed, actualParking: prop.parking },
        petFriendlyCheck: { passed: petPassed, actualPetFriendly: prop.petFriendly },
        amenitySatisfactionPercent: Math.round(amenitySatisfaction),
        matchedAmenities
      }
    };
  }
};

/**
 * 14. rank_properties
 * Ranks an array of properties against requirements using deterministic 7-factor weights.
 */
export const rankPropertiesTool: ToolDefinition<{
  propertyIds: string[];
  requirements: MissionRequirements;
}> = {
  name: 'rank_properties',
  description: 'Rank multiple properties using the deterministic 7-factor scoring engine (Budget 30%, Location 25%, Layout 15%, Furnishing 10%, Preferences 10%, Amenities 5%, Verification 5%).',
  parameters: {
    type: 'object',
    properties: {
      propertyIds: { type: 'array', description: 'Array of property IDs to rank' },
      requirements: { type: 'object', description: 'The mission requirements' }
    },
    required: ['propertyIds', 'requirements']
  },
  execute: ({ propertyIds, requirements }) => {
    const props = propertyIds
      .map(id => agentToolDataContext.getProperty(id))
      .filter((p): p is Property => p !== null);

    const scored = props.map(p => {
      const evaluation = calculateMatchScore(p, requirements);
      return {
        property: p,
        evaluation,
        score: evaluation.totalScore
      };
    });

    scored.sort((a, b) => b.score - a.score);

    return {
      totalRanked: scored.length,
      topScore: scored[0]?.score || 0,
      rankedList: scored.map(s => ({
        propertyId: s.property.id,
        title: s.property.title,
        monthlyRent: s.property.monthlyRent,
        distanceKm: s.property.distanceKm,
        totalScore: s.score,
        affordabilityStatus: s.evaluation.affordabilityStatus,
        breakdown: s.evaluation.breakdown,
        isStrongMatch: s.evaluation.isStrongMatch
      }))
    };
  }
};

/**
 * 15. save_mission
 * Alias & durable mission persistence tool.
 */
export const saveMissionTool: ToolDefinition<{ mission: Mission }> = {
  name: 'save_mission',
  description: 'Persist a complete mission object to memory and Firestore.',
  parameters: {
    type: 'object',
    properties: {
      mission: { type: 'object', description: 'The complete mission object' }
    },
    required: ['mission']
  },
  execute: ({ mission }) => {
    agentToolDataContext.saveMission(mission);
    return { success: true, missionId: mission.id };
  }
};

/**
 * 16. load_mission
 * Retrieves a mission by ID.
 */
export const loadMissionTool: ToolDefinition<{ missionId: string }> = {
  name: 'load_mission',
  description: 'Load an existing mission record by ID.',
  parameters: {
    type: 'object',
    properties: {
      missionId: { type: 'string', description: 'The mission ID' }
    },
    required: ['missionId']
  },
  execute: ({ missionId }) => {
    const mission = agentToolDataContext.getMission(missionId);
    if (!mission) {
      return { found: false, error: `Mission ${missionId} not found` };
    }
    return { found: true, mission };
  }
};

/**
 * 17. save_memory
 * Alias & durable memory persistence tool.
 */
export const saveMemoryTool: ToolDefinition<{ key: string; value: any; category?: string }> = {
  name: 'save_memory',
  description: 'Save user lifestyle memory, preferences, or constraints to persistent store.',
  parameters: {
    type: 'object',
    properties: {
      key: { type: 'string', description: 'Memory key or preference name' },
      value: { type: 'string', description: 'The value to remember' },
      category: { type: 'string', description: 'Optional category (budget, location, floor, amenity)' }
    },
    required: ['key', 'value']
  },
  execute: ({ key, value }) => {
    const prefs = agentToolDataContext.getPreferences();
    (prefs as any)[key] = value;
    agentToolDataContext.savePreferences(prefs);
    return { success: true, key, value, storedAt: new Date().toISOString() };
  }
};

/**
 * 18. load_memory
 * Loads persistent memory and user preferences.
 */
export const loadMemoryTool: ToolDefinition<{ key?: string }> = {
  name: 'load_memory',
  description: 'Retrieve stored user memory and lifestyle preferences.',
  parameters: {
    type: 'object',
    properties: {
      key: { type: 'string', description: 'Optional specific memory key to retrieve' }
    },
    required: []
  },
  execute: ({ key }) => {
    const prefs = agentToolDataContext.getPreferences();
    if (key) {
      return { key, value: (prefs as any)[key] };
    }
    return { memory: prefs };
  }
};

/**
 * 19. schedule_monitoring
 * Schedules background polling and Pub/Sub checks for new matching listings.
 */
export const scheduleMonitoringTool: ToolDefinition<{
  missionId: string;
  frequencyMinutes?: number;
  criteria?: Record<string, any>;
}> = {
  name: 'schedule_monitoring',
  description: 'Configure autonomous background monitoring frequency and listener daemon for a mission.',
  parameters: {
    type: 'object',
    properties: {
      missionId: { type: 'string', description: 'The mission ID' },
      frequencyMinutes: { type: 'number', description: 'Polling interval in minutes (default: 15)' },
      criteria: { type: 'object', description: 'Target filtering criteria' }
    },
    required: ['missionId']
  },
  execute: ({ missionId, frequencyMinutes = 15 }) => {
    const mission = agentToolDataContext.getMission(missionId);
    if (mission) {
      mission.monitoring = {
        isActive: true,
        lastChecked: new Date().toISOString(),
        nextCheck: new Date(Date.now() + frequencyMinutes * 60000).toISOString(),
        totalEvaluated: mission.monitoring?.totalEvaluated || 0,
        newMatchesFound: mission.monitoring?.newMatchesFound || 0,
        checkFrequencyMinutes: frequencyMinutes
      };
      agentToolDataContext.saveMission(mission);
    }
    return {
      success: true,
      missionId,
      status: 'MONITORING_SCHEDULED',
      frequencyMinutes,
      nextCheck: new Date(Date.now() + frequencyMinutes * 60000).toISOString()
    };
  }
};

/**
 * 20. request_user_approval
 * Creates a formal Human-in-the-Loop approval gate for sensitive actions.
 */
export const requestUserApprovalTool: ToolDefinition<{
  missionId: string;
  propertyId: string;
  actionType: 'contact_owner' | 'schedule_viewing' | 'submit_inquiry' | 'share_contact';
  proposedMessage: string;
  recipientName?: string;
  recipientContact?: string;
}> = {
  name: 'request_user_approval',
  description: 'Create a required human authorization gate before executing sensitive external actions like contacting property owners.',
  parameters: {
    type: 'object',
    properties: {
      missionId: { type: 'string', description: 'The mission ID' },
      propertyId: { type: 'string', description: 'Target property ID' },
      actionType: { type: 'string', description: 'Sensitive action type' },
      proposedMessage: { type: 'string', description: 'The proposed inquiry message text' },
      recipientName: { type: 'string', description: 'Recipient name' },
      recipientContact: { type: 'string', description: 'Recipient contact info' }
    },
    required: ['missionId', 'propertyId', 'actionType', 'proposedMessage']
  },
  execute: (args) => {
    const prop = agentToolDataContext.getProperty(args.propertyId);
    const requestId = `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const approvalRequest: AgentApprovalRequest = {
      id: requestId,
      missionId: args.missionId,
      propertyId: args.propertyId,
      propertyTitle: prop?.title || 'Selected Property',
      agent: 'CommunicationAgent',
      actionType: args.actionType,
      title: `Authorize Outreach: ${prop?.title || 'Property'}`,
      description: 'Human approval required before message dispatch',
      proposedMessage: args.proposedMessage,
      recipientName: args.recipientName || 'Verified Property Owner',
      recipientContact: args.recipientContact || '+91 98450 XXXXX',
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    return {
      success: true,
      requestId,
      approvalRequired: true,
      status: 'PENDING_USER_APPROVAL',
      request: approvalRequest
    };
  }
};

export const ALL_AGENT_TOOLS = [
  searchPropertiesTool,
  getPropertyTool,
  calculateAffordabilityTool,
  calculateDistanceTool,
  filterPreferencesTool,
  rankPropertiesTool,
  calculateMatchScoreTool,
  comparePropertiesTool,
  saveToShortlistTool,
  saveMissionTool,
  loadMissionTool,
  saveMemoryTool,
  loadMemoryTool,
  loadUserPreferencesTool,
  saveUserPreferenceTool,
  createMissionTool,
  updateMissionTool,
  createNotificationTool,
  scheduleMonitoringTool,
  requestUserApprovalTool
];
