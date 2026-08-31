import { Mission, Property, MatchEvaluation, AgentActivityEvent } from '../../src/types';
import { calculateMatchScore } from '../../src/services/scoringService';
import { SIMULATED_PROPERTY_TEMPLATES } from '../../src/data/properties';
import { firestoreMissionRepository } from '../repositories/FirestoreMissionRepository';
import { firestoreMemoryRepository } from '../repositories/FirestoreMemoryRepository';
import { firestoreNotificationRepository } from '../repositories/FirestoreNotificationRepository';
import { firestoreEventRepository } from '../repositories/FirestoreEventRepository';
import { pubsubService, PubSubMessage } from '../pubsub/PubSubService';
import { GoogleGenAI } from '@google/genai';

let simIndexCounter = 0;

export interface MonitoringEvaluationResult {
  success: boolean;
  missionsEvaluatedCount: number;
  propertiesEvaluatedCount: number;
  newMatchesDiscovered: number;
  notificationsCreated: number;
  evaluatedProperty: Property;
  missionResults: Array<{
    missionId: string;
    missionTitle: string;
    matchScore: number;
    isStrongMatch: boolean;
    notificationCreated: boolean;
    alreadyEvaluated: boolean;
    explanation?: string;
  }>;
}

export class MonitoringWorker {
  private genAI: GoogleGenAI | null = null;
  private isListening = false;

  constructor(genAI?: GoogleGenAI | null) {
    this.genAI = genAI || null;
    this.initPubSubListeners();
  }

  public setGenAI(genAI: GoogleGenAI | null) {
    this.genAI = genAI;
  }

  /**
   * Initializes Pub/Sub subscribers for background events
   */
  public initPubSubListeners() {
    if (this.isListening) return;
    this.isListening = true;

    // 1. Subscribe to housing-monitoring topic (e.g. from Cloud Scheduler)
    pubsubService.subscribe('housing-monitoring', async (msg: PubSubMessage) => {
      console.log(`[MonitoringWorker] 📥 Received Pub/Sub message from "${msg.topic}": ${msg.eventType}`);
      if (msg.eventType === 'MONITOR_ACTIVE_MISSIONS' || msg.eventType === 'SCHEDULER_TICK') {
        await this.runBackgroundMonitoringCheck(msg.payload?.property, msg.source);
      }
    });

    // 2. Subscribe to property-updates topic
    pubsubService.subscribe('property-updates', async (msg: PubSubMessage) => {
      console.log(`[MonitoringWorker] 📥 Received new property event:`, msg.payload);
      if (msg.eventType === 'PROPERTY_CREATED' && msg.payload) {
        await this.runBackgroundMonitoringCheck(msg.payload, 'property_feed');
      }
    });

    console.log('[MonitoringWorker] ADK Background Monitoring Worker subscribed to Pub/Sub topics');
  }

  /**
   * Generates or retrieves an inbound property candidate for background evaluation
   */
  public generateInboundProperty(): Property {
    const template = SIMULATED_PROPERTY_TEMPLATES[simIndexCounter % SIMULATED_PROPERTY_TEMPLATES.length];
    simIndexCounter++;

    const newId = `prop-inbound-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newProperty: Property = {
      id: newId,
      title: template.title || '⚡ [NEW LISTED] High-Demand 2BHK Near Tech & Campus Hub',
      propertyType: template.propertyType || 'Apartment',
      bedrooms: template.bedrooms || 2,
      bathrooms: template.bathrooms || 2,
      monthlyRent: template.monthlyRent || 13500,
      securityDeposit: template.securityDeposit || 27000,
      maintenance: template.maintenance || 1000,
      estimatedUtilities: template.estimatedUtilities || 1400,
      furnishing: template.furnishing || 'Furnished',
      locality: template.locality || 'Green Glen Layout / Near Campus Gate',
      city: 'Bengaluru',
      latitude: template.latitude || 12.926,
      longitude: template.longitude || 77.675,
      distanceKm: template.distanceKm || 0.8,
      availableFrom: template.availableFrom || new Date().toISOString().split('T')[0],
      amenities: template.amenities || [
        'Power Backup',
        'Lift',
        'Wi-Fi',
        '24/7 Security',
        'AC',
        'Modular Kitchen',
        'Geyser',
        'Balcony',
        'Covered Parking'
      ],
      floor: template.floor || 3,
      totalFloors: template.totalFloors || 5,
      parking: template.parking || 'Covered',
      ownerVerified: template.ownerVerified !== undefined ? template.ownerVerified : true,
      images: template.images || [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80'
      ],
      description: template.description || 'Detected by Cloud Run Monitoring Worker daemon via Pub/Sub.',
      petFriendly: template.petFriendly !== undefined ? template.petFriendly : true,
      preferredTenants: template.preferredTenants || 'Students',
      squareFeet: template.squareFeet || 980,
      source: 'simulated_feed',
      createdAt: new Date().toISOString()
    };

    return newProperty;
  }

  /**
   * Main ADK MonitoringAgent execution workflow:
   * 1. Find active missions in Firestore
   * 2. Retrieve mission requirements & stored user preferences
   * 3. Identify newly available property
   * 4. Evaluate candidates using tools & deterministic scoring
   * 5. Ask Gemini to explain strong matches (if available)
   * 6. Create notification for qualifying matches (with idempotency check)
   * 7. Update mission monitoring state in Firestore
   * 8. Log telemetry agent events
   */
  public async runBackgroundMonitoringCheck(
    inboundProperty?: Property,
    source: string = 'scheduler'
  ): Promise<MonitoringEvaluationResult> {
    const timestamp = new Date().toISOString();
    const candidateProperty = inboundProperty || this.generateInboundProperty();

    // 1. Load active missions from Firestore
    const allMissions = await firestoreMissionRepository.getAllMissions();
    const activeMissions = allMissions.filter(
      (m) => m.status === 'MONITORING' || m.monitoring?.isActive
    );

    // Also check single active mission if available
    const directActive = await firestoreMissionRepository.getActiveMission();
    if (directActive && !activeMissions.some((m) => m.id === directActive.id)) {
      activeMissions.push(directActive);
    }

    const missionResults: MonitoringEvaluationResult['missionResults'] = [];
    let newMatchesDiscovered = 0;
    let notificationsCreated = 0;

    // Load stored user memory preferences from Firestore
    const userPrefs = await firestoreMemoryRepository.getPreferences();

    for (const mission of activeMissions) {
      try {
        // Enforce user memory constraints (e.g. avoid ground floor)
        if (userPrefs?.avoidGroundFloor) {
          mission.requirements.avoidGroundFloor = true;
        }

        // 4. Evaluate candidate using deterministic multi-factor scoring
        const evaluation: MatchEvaluation = calculateMatchScore(candidateProperty, mission.requirements);
        const matchScore = evaluation.totalScore;
        const isStrongMatch = matchScore >= 85; // High match threshold

        // Idempotency check: Ensure the same property does not repeatedly trigger duplicate notifications
        const alreadyMatched = mission.matchedPropertyIds?.includes(candidateProperty.id);
        const alreadyNotified = (mission as any).notifiedPropertyIds?.includes(candidateProperty.id);

        let notificationCreatedForMission = false;
        let aiExplanation: string | undefined = undefined;

        if (isStrongMatch) {
          newMatchesDiscovered++;

          // 5. Ask Gemini to explain strong matches
          aiExplanation = await this.generateGeminiExplanation(candidateProperty, mission, evaluation);
          evaluation.aiExplanation = aiExplanation;
        }

        // 6. Create notification if strong match and not already notified
        if (isStrongMatch && !alreadyNotified) {
          const notifTitle = `⚡ High Match (${matchScore}%) Found by Agent`;
          const notifMessage = `Your agent discovered "${candidateProperty.title}" (${candidateProperty.distanceKm} km, ₹${candidateProperty.monthlyRent.toLocaleString('en-IN')}/mo) while you were away. Score: ${matchScore}%.`;

          await firestoreNotificationRepository.addNotification({
            title: notifTitle,
            message: notifMessage,
            type: 'match',
            propertyId: candidateProperty.id,
            matchScore,
            missionId: mission.id
          });

          notificationsCreated++;
          notificationCreatedForMission = true;
        }

        // 7. Update mission state in Firestore
        if (!mission.matchedPropertyIds.includes(candidateProperty.id)) {
          mission.matchedPropertyIds.unshift(candidateProperty.id);
        }
        mission.rankedScores[candidateProperty.id] = evaluation;
        mission.monitoring.totalEvaluated = (mission.monitoring.totalEvaluated || 0) + 1;
        mission.monitoring.lastChecked = timestamp;
        mission.monitoring.nextCheck = new Date(Date.now() + (mission.monitoring.checkFrequencyMinutes || 15) * 60000).toISOString();
        if (isStrongMatch) {
          mission.monitoring.newMatchesFound = (mission.monitoring.newMatchesFound || 0) + 1;
        }

        // Record notified property ID for strict idempotency
        if (!Array.isArray((mission as any).notifiedPropertyIds)) {
          (mission as any).notifiedPropertyIds = [];
        }
        if (isStrongMatch && !(mission as any).notifiedPropertyIds.includes(candidateProperty.id)) {
          (mission as any).notifiedPropertyIds.push(candidateProperty.id);
        }

        await firestoreMissionRepository.saveMission(mission);

        missionResults.push({
          missionId: mission.id,
          missionTitle: mission.title,
          matchScore,
          isStrongMatch,
          notificationCreated: notificationCreatedForMission,
          alreadyEvaluated: Boolean(alreadyMatched || alreadyNotified),
          explanation: aiExplanation
        });

        // 8. Log telemetry agent activity event to Firestore
        const event: AgentActivityEvent = {
          id: `evt-${Date.now()}-mon-${candidateProperty.id.slice(-4)}`,
          missionId: mission.id,
          timestamp,
          taskName: isStrongMatch 
            ? `MonitoringAgent: High Match (${matchScore}%) Detected` 
            : `MonitoringAgent: Listing Evaluated (${matchScore}%)`,
          agent: 'MonitoringAgent',
          action: 'evaluate_inbound_property',
          status: isStrongMatch ? 'success' : 'info',
          category: 'monitor',
          description: `Background daemon evaluated "${candidateProperty.title}". Deterministic match: ${matchScore}%. Commute: ${candidateProperty.distanceKm} km, Rent: ₹${candidateProperty.monthlyRent.toLocaleString('en-IN')}/mo. ${isStrongMatch ? 'High match notification dispatched.' : 'Stored in mission index.'}`,
          dataSnapshot: {
            propertyId: candidateProperty.id,
            propertyTitle: candidateProperty.title,
            score: matchScore,
            isStrongMatch,
            source,
            breakdown: evaluation.breakdown,
            notificationCreated: notificationCreatedForMission
          },
          metadata: {
            topic: 'housing-monitoring',
            source,
            idempotent: !notificationCreatedForMission
          }
        };

        await firestoreEventRepository.addEvent(event);
      } catch (missionErr) {
        console.error(`[MonitoringWorker] Error evaluating mission ${mission.id}:`, missionErr);
      }
    }

    // If no active missions were found, log an idle scan event
    if (activeMissions.length === 0) {
      await firestoreEventRepository.addEvent({
        id: `evt-${Date.now()}-mon-idle`,
        missionId: 'system',
        timestamp,
        taskName: 'MonitoringAgent: Background Heartbeat Check',
        agent: 'MonitoringAgent',
        action: 'poll_active_missions',
        status: 'info',
        category: 'monitor',
        description: 'Background worker checked for active missions. 0 active missions currently monitoring.',
        dataSnapshot: { activeMissions: 0, source }
      });
    }

    return {
      success: true,
      missionsEvaluatedCount: activeMissions.length,
      propertiesEvaluatedCount: 1,
      newMatchesDiscovered,
      notificationsCreated,
      evaluatedProperty: candidateProperty,
      missionResults
    };
  }

  /**
   * Gemini explanation generator for strong matches
   */
  private async generateGeminiExplanation(
    property: Property,
    mission: Mission,
    scoreEvaluation: MatchEvaluation
  ): Promise<string> {
    if (!this.genAI) {
      return `Scored ${scoreEvaluation.totalScore}% match with rent of ₹${property.monthlyRent.toLocaleString('en-IN')}/mo and ${property.distanceKm} km commute distance.`;
    }

    try {
      const prompt = `You are the MonitoringAgent in the Agentic Housing Navigator architecture.
Provide a clear 2-sentence explanation of why this newly discovered property is an exceptional match (${scoreEvaluation.totalScore}%) for the user's mission.
Ground your reasoning strictly in these facts:

Mission Requirements:
- Target: ${mission.requirements.propertyType}, ${mission.requirements.bedrooms}BHK, ${mission.requirements.furnishing}
- Max Budget: ₹${mission.requirements.maxBudget}/mo
- Max Distance: ≤ ${mission.requirements.maxDistanceKm} km
- Avoid Ground Floor: ${mission.requirements.avoidGroundFloor ? 'Yes' : 'No'}

New Inbound Property:
- Title: ${property.title}
- Rent: ₹${property.monthlyRent}/mo
- Distance: ${property.distanceKm} km
- Floor: ${property.floor} of ${property.totalFloors}
- Furnishing: ${property.furnishing}
- Amenities: ${property.amenities.slice(0, 4).join(', ')}

Output a concise 2-sentence explanation.`;

      const response = await this.genAI.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt
      });

      return response.text?.trim() || `Scored ${scoreEvaluation.totalScore}% match with rent of ₹${property.monthlyRent.toLocaleString('en-IN')}/mo and ${property.distanceKm} km commute distance.`;
    } catch (e) {
      console.warn('[MonitoringWorker] Gemini explanation failed, falling back to deterministic explanation:', e);
      return `Scored ${scoreEvaluation.totalScore}% match with rent of ₹${property.monthlyRent.toLocaleString('en-IN')}/mo and ${property.distanceKm} km commute distance.`;
    }
  }
}

export const monitoringWorker = new MonitoringWorker();
