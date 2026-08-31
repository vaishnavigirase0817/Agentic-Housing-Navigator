import { GoogleGenAI, Type } from '@google/genai';
import { Property, MissionRequirements, MatchEvaluation, AgentActivityEvent } from '../types';
import { calculateMatchScoreTool, comparePropertiesTool } from '../tools';
import { safeGenerateContent, safeParseJson } from './geminiHelper';

export interface TopMatchEntry {
  property: Property;
  evaluation: MatchEvaluation;
  aiExplanation?: string;
  verdict?: string;
}

export interface RankingAgentResult {
  rankedProperties: Property[];
  rankedScores: Record<string, MatchEvaluation>;
  topMatches: TopMatchEntry[];
  topScore: number;
  averageScore: number;
  recommendationReasoning: string[];
  comparativeHighlights: Record<string, any>;
  event: AgentActivityEvent;
}

export class RankingAgent {
  private genAI: GoogleGenAI | null;

  constructor(genAI: GoogleGenAI | null) {
    this.genAI = genAI;
  }

  async rankAndExplain(
    allProperties: Property[],
    requirements: MissionRequirements,
    missionId: string
  ): Promise<RankingAgentResult> {
    const timestamp = new Date().toISOString();
    const rankedScores: Record<string, MatchEvaluation> = {};

    // 1. Tool Call: calculate_match_score on each property (Deterministic 7-factor scoring)
    for (const prop of allProperties) {
      const scoreResult = calculateMatchScoreTool.execute({
        propertyId: prop.id,
        requirements
      });

      if ('totalScore' in scoreResult) {
        rankedScores[prop.id] = {
          totalScore: scoreResult.totalScore,
          breakdown: scoreResult.breakdown,
          matchReasons: scoreResult.matchReasons,
          drawbacks: scoreResult.drawbacks,
          isStrongMatch: scoreResult.isStrongMatch,
          affordabilityStatus: scoreResult.affordabilityStatus
        };
      }
    }

    // 2. Sort properties by deterministic score descending
    const rankedProperties = [...allProperties].sort((a, b) => {
      const scoreA = rankedScores[a.id]?.totalScore || 0;
      const scoreB = rankedScores[b.id]?.totalScore || 0;
      return scoreB - scoreA;
    });

    const topScore = rankedScores[rankedProperties[0]?.id]?.totalScore || 0;
    const allScoresArray = Object.values(rankedScores).map(s => s.totalScore);
    const averageScore = allScoresArray.length > 0
      ? Math.round(allScoresArray.reduce((a, b) => a + b, 0) / allScoresArray.length)
      : 0;

    // 3. Select top 3-5 candidates for deep comparative analysis
    const topCandidates = rankedProperties.slice(0, 4);

    // Tool Call: compare_properties
    const comparativeHighlights = comparePropertiesTool.execute({
      propertyIds: topCandidates.map(p => p.id),
      requirements
    });

    // 4. Generate AI explanations & trade-off rationale using Gemini (or deterministic template fallback)
    const topMatches: TopMatchEntry[] = [];
    const recommendationReasoning: string[] = [];

    for (let i = 0; i < topCandidates.length; i++) {
      const prop = topCandidates[i];
      const evaluation = rankedScores[prop.id];
      let aiExplanation = '';
      let verdict = evaluation.totalScore >= 85 ? 'Strong Match' : (evaluation.totalScore >= 75 ? 'Recommended' : 'Worth Considering');

      if (this.genAI && i < 3) {
        try {
          const prompt = `You are RankingAgent in the Agentic Housing Navigator architecture.
Provide a concise 2-sentence factual explanation of why this property scored ${evaluation.totalScore}% for the user's mission.
Do NOT invent facts or change the score. Ground your reasoning strictly in the provided data.

User Mission:
- Target: ${requirements.propertyType}, ${requirements.bedrooms}BHK, ${requirements.furnishing}
- Max Budget: ₹${requirements.maxBudget}/month
- Location: ≤ ${requirements.maxDistanceKm}km from ${requirements.targetLocation}
- Avoid Ground Floor: ${requirements.avoidGroundFloor ? 'Yes' : 'No'}

Property Data:
- Title: ${prop.title}
- Rent: ₹${prop.monthlyRent}/month
- Distance: ${prop.distanceKm} km from campus
- Floor: ${prop.floor} of ${prop.totalFloors}
- Furnishing: ${prop.furnishing}
- Amenities: ${prop.amenities.slice(0, 5).join(', ')}
- Score Factors: ${JSON.stringify(evaluation.breakdown)}
- Match Strengths: ${evaluation.matchReasons.join('; ')}
- Trade-offs: ${evaluation.drawbacks.join('; ')}

Output clean JSON with "explanation" (string, max 50 words) and "verdict" (string: Strong Match / Top Value / Balanced Pick).`;

          const aiRes = await safeGenerateContent(this.genAI, {
            contents: prompt,
            config: {
              systemInstruction: 'You are RankingAgent. Produce concise, factual, grounded explanations strictly adhering to provided numeric facts.',
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  explanation: { type: Type.STRING },
                  verdict: { type: Type.STRING }
                },
                required: ['explanation', 'verdict']
              }
            }
          });

          if (aiRes && aiRes.text) {
            const parsed = safeParseJson(aiRes.text, {} as any);
            aiExplanation = parsed.explanation || '';
            if (parsed.verdict) verdict = parsed.verdict;
          }
        } catch {
          // Handled gracefully with fallback formatting below
        }
      }

      if (!aiExplanation) {
        const diff = requirements.maxBudget - prop.monthlyRent;
        const diffStr = diff >= 0 ? `₹${diff.toLocaleString('en-IN')}/mo under budget` : `₹${Math.abs(diff).toLocaleString('en-IN')}/mo over budget`;
        aiExplanation = `Scored ${evaluation.totalScore}% deterministic match. Located ${prop.distanceKm} km from campus, ${prop.furnishing.toLowerCase()} at ${diffStr}, offering ${prop.amenities.slice(0, 3).join(', ')}.`;
      }

      evaluation.aiExplanation = aiExplanation;
      topMatches.push({
        property: prop,
        evaluation,
        aiExplanation,
        verdict
      });

      recommendationReasoning.push(`Match #${i + 1} (${prop.title}): ${aiExplanation}`);
    }

    const event: AgentActivityEvent = {
      id: `evt-${Date.now()}-rank`,
      missionId,
      timestamp,
      taskName: 'RankingAgent: Multi-Factor Scoring & Ranking',
      status: 'success',
      category: 'rank',
      description: `Deterministic 7-factor scoring completed for ${allProperties.length} listings. Top match: "${rankedProperties[0]?.title}" (${topScore}%). Average: ${averageScore}%`,
      dataSnapshot: {
        agent: 'RankingAgent',
        toolsUsed: ['calculate_match_score', 'compare_properties'],
        propertiesScored: allProperties.length,
        highestScore: topScore,
        averageScore,
        topRecommendations: topMatches.map(t => ({
          id: t.property.id,
          title: t.property.title,
          rent: t.property.monthlyRent,
          score: t.evaluation.totalScore,
          verdict: t.verdict
        }))
      }
    };

    return {
      rankedProperties,
      rankedScores,
      topMatches,
      topScore,
      averageScore,
      recommendationReasoning,
      comparativeHighlights,
      event
    };
  }
}
