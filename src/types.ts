export type PropertyType = 'Apartment' | 'Independent House' | 'Studio' | 'Villa' | 'Gated Community' | 'PG / Co-living';
export type FurnishingStatus = 'Furnished' | 'Semi-Furnished' | 'Unfurnished';
export type ParkingType = 'Covered' | 'Open' | 'None' | 'Two-Wheeler Only';
export type FloorPreference = 'Any' | 'Low' | 'Mid' | 'High' | 'Avoid Ground';

export interface Property {
  id: string;
  title: string;
  propertyType: PropertyType;
  bedrooms: number;
  bathrooms: number;
  monthlyRent: number;
  securityDeposit: number;
  maintenance: number;
  estimatedUtilities: number;
  furnishing: FurnishingStatus;
  locality: string;
  city: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  availableFrom: string;
  amenities: string[];
  floor: number;
  totalFloors: number;
  parking: ParkingType;
  ownerVerified: boolean;
  images: string[];
  description: string;
  petFriendly: boolean;
  preferredTenants: 'Anyone' | 'Family' | 'Bachelors' | 'Students';
  squareFeet: number;
  source: 'demo_dataset' | 'simulated_feed';
  createdAt: string;
}

export interface MissionRequirements {
  rawQuery: string;
  propertyType: string;
  bedrooms: number | 'Any';
  maxBudget: number;
  minBudget: number;
  targetLocation: string;
  maxDistanceKm: number;
  furnishing: FurnishingStatus | 'Any';
  moveInDate: string;
  preferredAmenities: string[];
  parkingRequired: boolean;
  preferredFloor: FloorPreference;
  avoidGroundFloor: boolean;
  petFriendlyRequired: boolean;
  appliedMemoryNotes?: string[];
  additionalNotes?: string;
}

export interface ScoreFactorBreakdown {
  budgetScore: number; // 0-30
  locationScore: number; // 0-25
  typeScore: number; // 0-15
  bedroomScore: number; // 0-10
  furnishingScore: number; // 0-10
  availabilityScore: number; // 0-5
  amenitiesScore: number; // 0-5
}

export interface MatchEvaluation {
  totalScore: number; // 0-100
  breakdown: ScoreFactorBreakdown;
  matchReasons: string[];
  drawbacks: string[];
  aiExplanation?: string;
  isStrongMatch: boolean;
  affordabilityStatus: 'Optimal' | 'Stretch' | 'Under Budget' | 'Over Budget';
}

export type MissionStatus = 
  | 'IDLE' 
  | 'THINKING' 
  | 'SEARCHING' 
  | 'EVALUATING' 
  | 'RANKING' 
  | 'MONITORING' 
  | 'COMPLETED' 
  | 'ERROR';

export interface MissionStage {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  detail: string;
  count?: number;
  timestamp?: string;
}

export interface MonitoringStats {
  isActive: boolean;
  lastChecked: string;
  nextCheck: string;
  totalEvaluated: number;
  newMatchesFound: number;
  checkFrequencyMinutes: number;
}

export interface Mission {
  id: string;
  title: string;
  status: MissionStatus;
  createdAt: string;
  updatedAt?: string;
  requirements: MissionRequirements;
  currentStageIndex: number;
  stages: MissionStage[];
  matchedPropertyIds: string[];
  rankedScores: Record<string, MatchEvaluation>;
  monitoring: MonitoringStats;
  shortlistedPropertyIds: string[];
  dismissedPropertyIds: string[];
  appliedMemoryNotes?: string[];
}

export interface AgentActivityEvent {
  id: string;
  missionId: string;
  timestamp: string;
  taskName: string;
  agent?: string;
  action?: string;
  status: 'success' | 'info' | 'warning' | 'error' | 'active';
  description: string;
  category: 'understand' | 'search' | 'evaluate' | 'rank' | 'monitor' | 'system';
  executionDurationMs?: number;
  retryCount?: number;
  errorDetails?: string;
  dataSnapshot?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface AgentApprovalRequest {
  id: string;
  missionId: string;
  propertyId: string;
  propertyTitle: string;
  agent: string;
  actionType: 'contact_owner' | 'schedule_viewing' | 'submit_inquiry' | 'share_contact';
  title: string;
  description: string;
  proposedMessage: string;
  recipientName: string;
  recipientContact: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EDITED';
  createdAt: string;
  resolvedAt?: string;
  editedMessage?: string;
}

export interface SavedPreferences {
  maxBudget: number;
  minBudget: number;
  preferredPropertyType: string;
  preferredFurnishing: string;
  preferredDistanceKm: number;
  avoidGroundFloor: boolean;
  parkingRequired: boolean;
  preferredAmenities: string[];
  targetLocality: string;
  petFriendly: boolean;
  updatedAt: string;
  customRules?: Array<{
    id: string;
    rule: string;
    category: 'floor' | 'budget' | 'amenity' | 'location' | 'lifestyle';
    reason: string;
    active: boolean;
    createdAt: string;
  }>;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  occupation?: string;
  avatarUrl?: string;
  preferredCurrency?: string;
  personaType?: 'student' | 'professional' | 'family' | 'custom';
  createdAt: string;
  lastActive: string;
}

export interface UserSession {
  user: UserProfile;
  token: string;
  isAuthenticated: boolean;
}

export interface PasswordStrength {
  score: number; // 0 to 4
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  color: string;
  hasMinLength: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
  hasUpperCase: boolean;
}

export type ExecutionStateMachineState =
  | 'QUEUED'
  | 'ANALYZING'
  | 'PLANNING'
  | 'SEARCHING'
  | 'FILTERING'
  | 'AFFORDABILITY_CHECK'
  | 'LOCATION_ANALYSIS'
  | 'PREFERENCE_ANALYSIS'
  | 'RANKING'
  | 'MEMORY_UPDATE'
  | 'MONITORING_SETUP'
  | 'COMPLETED'
  | 'RETRYING'
  | 'RECOVERED'
  | 'FAILED';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'match' | 'mission' | 'shortlist' | 'preference' | 'system' | 'approval';
  timestamp: string;
  read: boolean;
  priority?: 'low' | 'medium' | 'high';
  propertyId?: string;
  missionId?: string;
  matchScore?: number;
}

export interface PropertyFilterState {
  searchQuery: string;
  propertyType: string;
  bedrooms: string;
  minRent: number;
  maxRent: number;
  furnishing: string;
  maxDistance: number;
  parking: string;
  amenities: string[];
  ownerVerifiedOnly: boolean;
  petFriendlyOnly: boolean;
  sortBy: 'match_score' | 'rent_asc' | 'rent_desc' | 'distance_asc' | 'newest';
}

export type AppRoute = 
  | 'landing'
  | 'dashboard'
  | 'create-mission'
  | 'active-mission'
  | 'search'
  | 'details'
  | 'property-details'
  | 'shortlist'
  | 'preferences'
  | 'notifications'
  | 'activity'
  | 'settings';
