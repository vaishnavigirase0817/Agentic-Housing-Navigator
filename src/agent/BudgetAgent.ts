import { Property, MissionRequirements, AgentActivityEvent } from '../types';
import { calculateAffordabilityTool } from '../tools';

export interface BudgetEvaluationResult {
  qualifiedProperties: Property[];
  affordabilityBreakdowns: Record<string, any>;
  withinStrictBudgetCount: number;
  bufferStretchCount: number;
  rejectedCount: number;
  event: AgentActivityEvent;
}

export class BudgetAgent {
  async evaluate(
    candidates: Property[],
    requirements: MissionRequirements,
    missionId: string
  ): Promise<BudgetEvaluationResult> {
    const timestamp = new Date().toISOString();
    const affordabilityBreakdowns: Record<string, any> = {};

    let withinStrictBudgetCount = 0;
    let bufferStretchCount = 0;
    let rejectedCount = 0;
    const qualifiedProperties: Property[] = [];

    // Max budget ceiling with 15% flexible buffer
    const maxBudget = requirements.maxBudget || 15000;
    const allowedCeiling = maxBudget * 1.15;

    for (const prop of candidates) {
      // 1. Tool Call: calculate_affordability
      const aff = calculateAffordabilityTool.execute({
        propertyId: prop.id,
        userMonthlyBudget: maxBudget
      });

      affordabilityBreakdowns[prop.id] = aff;

      if (prop.monthlyRent <= maxBudget) {
        withinStrictBudgetCount++;
        qualifiedProperties.push(prop);
      } else if (prop.monthlyRent <= allowedCeiling) {
        bufferStretchCount++;
        qualifiedProperties.push(prop);
      } else {
        rejectedCount++;
      }
    }

    const event: AgentActivityEvent = {
      id: `evt-${Date.now()}-budget`,
      missionId,
      timestamp,
      taskName: 'BudgetAgent: Financial & Affordability Audit',
      status: 'success',
      category: 'evaluate',
      description: `Evaluated ${candidates.length} listings: ${withinStrictBudgetCount} comfortably under ₹${maxBudget.toLocaleString('en-IN')}/mo, ${bufferStretchCount} within 15% stretch ceiling, ${rejectedCount} over budget`,
      dataSnapshot: {
        agent: 'BudgetAgent',
        toolUsed: 'calculate_affordability',
        userMaxBudget: maxBudget,
        qualifiedCount: qualifiedProperties.length,
        withinStrictBudgetCount,
        bufferStretchCount,
        rejectedCount,
        averageRent: qualifiedProperties.length > 0 
          ? Math.round(qualifiedProperties.reduce((acc, p) => acc + p.monthlyRent, 0) / qualifiedProperties.length)
          : 0
      }
    };

    return {
      qualifiedProperties,
      affordabilityBreakdowns,
      withinStrictBudgetCount,
      bufferStretchCount,
      rejectedCount,
      event
    };
  }
}
