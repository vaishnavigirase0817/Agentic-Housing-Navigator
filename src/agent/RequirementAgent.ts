import { GoogleGenAI, Type } from '@google/genai';
import { MissionRequirements, AgentActivityEvent, SavedPreferences } from '../types';
import { loadUserPreferencesTool, saveUserPreferenceTool } from '../tools';
import { safeGenerateContent, safeParseJson } from './geminiHelper';

export interface RequirementAgentResult {
  requirements: MissionRequirements;
  rawQuery: string;
  source: 'gemini_adk_agent' | 'deterministic_fallback';
  confidence: number;
  extractedParameters: Record<string, any>;
  appliedMemories: string[];
  event: AgentActivityEvent;
}

export class RequirementAgent {
  private genAI: GoogleGenAI | null;

  constructor(genAI: GoogleGenAI | null) {
    this.genAI = genAI;
  }

  async process(
    rawQuery: string,
    missionId: string,
    existingRequirements?: Partial<MissionRequirements>
  ): Promise<RequirementAgentResult> {
    const timestamp = new Date().toISOString();

    // 1. Tool Call: Load user preferences from long-term memory
    const userPreferences: SavedPreferences = loadUserPreferencesTool.execute();
    const appliedMemories: string[] = [];

    // Analyze query text for persistent memory statements
    const lowerQuery = (rawQuery || '').toLowerCase();
    const memoryUpdates: Partial<SavedPreferences> = {};

    if (
      lowerQuery.includes("don't want ground") ||
      lowerQuery.includes("avoid ground") ||
      lowerQuery.includes("no ground floor") ||
      lowerQuery.includes("not on ground") ||
      lowerQuery.includes("upper floor") ||
      lowerQuery.includes("higher floor")
    ) {
      memoryUpdates.avoidGroundFloor = true;
      appliedMemories.push('Avoid ground floor');
    } else if (userPreferences.avoidGroundFloor && !lowerQuery.includes("ground floor ok") && !lowerQuery.includes("ground floor is fine")) {
      appliedMemories.push('Avoid ground floor (from saved preferences)');
    }

    if (lowerQuery.includes("parking required") || lowerQuery.includes("need car parking") || lowerQuery.includes("need parking")) {
      memoryUpdates.parkingRequired = true;
      appliedMemories.push('Car parking required');
    } else if (userPreferences.parkingRequired && !lowerQuery.includes("no parking")) {
      appliedMemories.push('Vehicle parking (from saved preferences)');
    }

    if (lowerQuery.includes("pet friendly") || lowerQuery.includes("with dog") || lowerQuery.includes("with cat")) {
      memoryUpdates.petFriendly = true;
      appliedMemories.push('Pet friendly unit');
    }

    // Save detected persistent preferences
    if (Object.keys(memoryUpdates).length > 0) {
      saveUserPreferenceTool.execute({ preferences: memoryUpdates });
    }

    // 2. If structured parameters provided
    if (existingRequirements && Object.keys(existingRequirements).length > 2 && !rawQuery) {
      const avoidGround = existingRequirements.avoidGroundFloor ?? (userPreferences.avoidGroundFloor || false);
      if (avoidGround && !appliedMemories.some(m => m.includes('ground floor'))) {
        appliedMemories.push('Avoid ground floor');
      }

      const merged: MissionRequirements = {
        rawQuery: rawQuery || 'Structured mission requirements',
        propertyType: existingRequirements.propertyType || userPreferences.preferredPropertyType || 'Apartment',
        bedrooms: existingRequirements.bedrooms ?? 2,
        maxBudget: existingRequirements.maxBudget || userPreferences.maxBudget || 15000,
        minBudget: existingRequirements.minBudget || userPreferences.minBudget || 8000,
        targetLocation: existingRequirements.targetLocation || userPreferences.targetLocality || 'Near College Campus',
        maxDistanceKm: existingRequirements.maxDistanceKm || userPreferences.preferredDistanceKm || 3.0,
        furnishing: existingRequirements.furnishing || (userPreferences.preferredFurnishing as any) || 'Furnished',
        moveInDate: existingRequirements.moveInDate || 'Next month (1st-5th)',
        preferredAmenities: existingRequirements.preferredAmenities || userPreferences.preferredAmenities || ['Power Backup', 'Lift', 'Wi-Fi'],
        parkingRequired: existingRequirements.parkingRequired ?? userPreferences.parkingRequired,
        preferredFloor: existingRequirements.preferredFloor || (avoidGround ? 'Avoid Ground' : 'Any'),
        avoidGroundFloor: avoidGround,
        petFriendlyRequired: existingRequirements.petFriendlyRequired ?? userPreferences.petFriendly,
        appliedMemoryNotes: appliedMemories,
        additionalNotes: existingRequirements.additionalNotes || 'Direct parameter injection via structured builder'
      };

      const event: AgentActivityEvent = {
        id: `evt-${Date.now()}-req`,
        missionId,
        timestamp,
        taskName: 'RequirementAgent: Constraints Consolidated',
        agent: 'RequirementAgent',
        action: 'parse_and_consolidate_requirements',
        status: 'success',
        category: 'understand',
        description: `Consolidated parameters: ${merged.bedrooms}BHK ${merged.propertyType} under ₹${merged.maxBudget.toLocaleString('en-IN')}${appliedMemories.length > 0 ? ` • Applied Memory: ${appliedMemories.join(', ')}` : ''}`,
        dataSnapshot: {
          agent: 'RequirementAgent',
          toolUsed: 'load_user_preferences',
          appliedMemories,
          requirements: merged
        },
        metadata: {
          appliedMemories,
          avoidGroundFloor: merged.avoidGroundFloor
        }
      };

      return {
        requirements: merged,
        rawQuery: rawQuery || 'Structured input',
        source: 'deterministic_fallback',
        confidence: 0.98,
        extractedParameters: merged,
        appliedMemories,
        event
      };
    }

    // 3. Natural Language extraction using Gemini 3.7 Flash if available
    if (this.genAI) {
      try {
        const prompt = `You are RequirementAgent in the Agentic Housing Navigator system.
Your job is to accurately extract structured housing search parameters from the user's natural language request.
Consider the user's saved preferences as baseline defaults if not explicitly contradicted in the prompt.

User Saved Memory:
- Default Max Budget: ₹${userPreferences.maxBudget}
- Preferred Furnishing: ${userPreferences.preferredFurnishing}
- Default Max Distance: ${userPreferences.preferredDistanceKm} km
- Preferred Locality: ${userPreferences.targetLocality}
- Avoid Ground Floor: ${userPreferences.avoidGroundFloor}
- Parking Required: ${userPreferences.parkingRequired}
- Pet Friendly: ${userPreferences.petFriendly}

User Request: "${rawQuery}"

Extract clean JSON matching the schema. In case of ambiguous specifications:
- BHK: if "2bhk" -> 2, "1bhk" -> 1, "studio" -> 1, "3bhk" -> 3.
- Budget: e.g. "under 15k" / "₹15000" -> maxBudget: 15000.
- Distance: e.g. "within 3 km" -> maxDistanceKm: 3.0.
- Furnishing: "Furnished", "Semi-Furnished", "Unfurnished", or "Any".
- avoidGroundFloor: set true if user says "don't want ground floor", "avoid ground floor", "upper floor", OR if already saved in memory unless negated.`;

        const aiResult = await safeGenerateContent(this.genAI, {
          contents: prompt,
          config: {
            systemInstruction: 'You are RequirementAgent. Always extract accurate, factual parameters in valid JSON format according to the schema.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                propertyType: { type: Type.STRING },
                bedrooms: { type: Type.INTEGER },
                maxBudget: { type: Type.INTEGER },
                minBudget: { type: Type.INTEGER },
                targetLocation: { type: Type.STRING },
                maxDistanceKm: { type: Type.NUMBER },
                furnishing: { type: Type.STRING },
                moveInDate: { type: Type.STRING },
                preferredAmenities: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                parkingRequired: { type: Type.BOOLEAN },
                avoidGroundFloor: { type: Type.BOOLEAN },
                petFriendlyRequired: { type: Type.BOOLEAN },
                additionalNotes: { type: Type.STRING }
              },
              required: ['propertyType', 'bedrooms', 'maxBudget', 'targetLocation', 'maxDistanceKm', 'furnishing']
            }
          }
        });

        if (aiResult && aiResult.text) {
          const parsed = safeParseJson(aiResult.text, {} as any);
          const shouldAvoidGround = parsed.avoidGroundFloor ?? (userPreferences.avoidGroundFloor || false);
          
          if (shouldAvoidGround && !appliedMemories.some((m: string) => m.toLowerCase().includes('ground floor'))) {
            appliedMemories.push('Avoid ground floor');
          }

          const requirements: MissionRequirements = {
            rawQuery,
            propertyType: parsed.propertyType || 'Apartment',
            bedrooms: parsed.bedrooms || 2,
            maxBudget: parsed.maxBudget || 15000,
            minBudget: parsed.minBudget || Math.round((parsed.maxBudget || 15000) * 0.6),
            targetLocation: parsed.targetLocation || userPreferences.targetLocality || 'Near College Campus',
            maxDistanceKm: Number(parsed.maxDistanceKm) || 3.0,
            furnishing: (parsed.furnishing as any) || 'Furnished',
            moveInDate: parsed.moveInDate || 'Next month (1st-5th)',
            preferredAmenities: Array.isArray(parsed.preferredAmenities) && parsed.preferredAmenities.length > 0
              ? parsed.preferredAmenities
              : userPreferences.preferredAmenities,
            parkingRequired: parsed.parkingRequired ?? userPreferences.parkingRequired,
            preferredFloor: shouldAvoidGround ? 'Avoid Ground' : 'Any',
            avoidGroundFloor: shouldAvoidGround,
            petFriendlyRequired: Boolean(parsed.petFriendlyRequired),
            appliedMemoryNotes: appliedMemories,
            additionalNotes: parsed.additionalNotes || `Extracted via RequirementAgent with ${aiResult.modelUsed}`
          };

          const event: AgentActivityEvent = {
            id: `evt-${Date.now()}-req`,
            missionId,
            timestamp,
            taskName: 'RequirementAgent: NLP Extraction Complete',
            agent: 'RequirementAgent',
            action: 'extract_requirements_nlp',
            status: 'success',
            category: 'understand',
            description: `Extracted: ${requirements.bedrooms}BHK ${requirements.propertyType}, Max Rent ₹${requirements.maxBudget.toLocaleString('en-IN')}, Radius ≤ ${requirements.maxDistanceKm}km${appliedMemories.length > 0 ? ` • Applied Memory: ${appliedMemories.join(', ')}` : ''}`,
            dataSnapshot: {
              agent: 'RequirementAgent',
              model: aiResult.modelUsed,
              toolUsed: 'load_user_preferences',
              appliedMemories,
              extracted: requirements
            },
            metadata: {
              appliedMemories,
              avoidGroundFloor: requirements.avoidGroundFloor
            }
          };

          return {
            requirements,
            rawQuery,
            source: 'gemini_adk_agent',
            confidence: 0.95,
            extractedParameters: parsed,
            appliedMemories,
            event
          };
        }
      } catch (err: any) {
        // Suppress unhandled noisy errors; deterministic fallback will engage seamlessly
      }
    }

    // 4. Deterministic rule-based extraction fallback
    const lower = rawQuery.toLowerCase();
    let bedrooms: number | 'Any' = 2;
    let propertyType = 'Apartment';
    if (lower.includes('1bhk') || lower.includes('1 bhk') || lower.includes('1 bedroom') || lower.includes('studio')) {
      bedrooms = 1;
      if (lower.includes('studio')) propertyType = 'Studio';
    } else if (lower.includes('3bhk') || lower.includes('3 bhk') || lower.includes('3 bedroom')) {
      bedrooms = 3;
    } else if (lower.includes('4bhk') || lower.includes('4 bhk')) {
      bedrooms = 4;
    } else if (lower.includes('villa')) {
      propertyType = 'Villa';
    }

    let maxBudget = 15000;
    const kMatch = lower.match(/(?:under|below|max|upto|within)?\s*(?:₹|rs\.?|inr)?\s*(\d+)\s*k\b/i);
    const numMatch = lower.match(/(?:under|below|max|upto|within)?\s*(?:₹|rs\.?|inr)?\s*(\d{4,6})\b/i);
    if (kMatch && kMatch[1]) maxBudget = parseInt(kMatch[1], 10) * 1000;
    else if (numMatch && numMatch[1]) maxBudget = parseInt(numMatch[1], 10);

    let maxDistanceKm = 3.0;
    const distMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:km|kms|kilometers)\b/i);
    if (distMatch && distMatch[1]) maxDistanceKm = parseFloat(distMatch[1]);

    let furnishing: 'Furnished' | 'Semi-Furnished' | 'Unfurnished' | 'Any' = 'Furnished';
    if (lower.includes('semi-furnished') || lower.includes('semi furnished')) furnishing = 'Semi-Furnished';
    else if (lower.includes('unfurnished')) furnishing = 'Unfurnished';

    const avoidGroundFloorExplicit = lower.includes('avoid ground') || lower.includes('not on ground') || lower.includes('no ground') || lower.includes("don't want ground");
    const avoidGroundFloor = avoidGroundFloorExplicit || (userPreferences.avoidGroundFloor && !lower.includes('ground floor ok'));
    
    if (avoidGroundFloor && !appliedMemories.some(m => m.toLowerCase().includes('ground floor'))) {
      appliedMemories.push('Avoid ground floor');
    }

    const parkingRequired = lower.includes('parking') || lower.includes('car') || userPreferences.parkingRequired;
    const petFriendlyRequired = lower.includes('pet') || lower.includes('dog') || userPreferences.petFriendly;

    const fallbackReq: MissionRequirements = {
      rawQuery,
      propertyType,
      bedrooms,
      maxBudget,
      minBudget: Math.round(maxBudget * 0.6),
      targetLocation: lower.includes('koramangala') ? 'Koramangala' : (lower.includes('bellandur') ? 'Bellandur' : 'Near College Campus'),
      maxDistanceKm,
      furnishing,
      moveInDate: 'Next month (1st-5th)',
      preferredAmenities: ['Power Backup', 'Lift', 'Wi-Fi', '24/7 Security'],
      parkingRequired,
      preferredFloor: avoidGroundFloor ? 'Avoid Ground' : 'Any',
      avoidGroundFloor,
      petFriendlyRequired,
      appliedMemoryNotes: appliedMemories,
      additionalNotes: 'Extracted via RequirementAgent rule-based engine'
    };

    const event: AgentActivityEvent = {
      id: `evt-${Date.now()}-req`,
      missionId,
      timestamp,
      taskName: 'RequirementAgent: Rule-Based Parse Active',
      agent: 'RequirementAgent',
      action: 'extract_requirements_rules',
      status: 'info',
      category: 'understand',
      description: `RequirementAgent parsed: ${fallbackReq.bedrooms}BHK, Max ₹${fallbackReq.maxBudget.toLocaleString('en-IN')}, Distance ≤ ${fallbackReq.maxDistanceKm}km${appliedMemories.length > 0 ? ` • Applied Memory: ${appliedMemories.join(', ')}` : ''}`,
      dataSnapshot: {
        agent: 'RequirementAgent',
        method: 'deterministic_nlp_rules',
        appliedMemories,
        extracted: fallbackReq
      },
      metadata: {
        appliedMemories,
        avoidGroundFloor: fallbackReq.avoidGroundFloor
      }
    };

    return {
      requirements: fallbackReq,
      rawQuery,
      source: 'deterministic_fallback',
      confidence: 0.88,
      extractedParameters: fallbackReq,
      appliedMemories,
      event
    };
  }
}
