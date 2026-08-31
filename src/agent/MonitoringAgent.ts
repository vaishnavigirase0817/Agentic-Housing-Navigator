import { Mission, MissionRequirements, AgentActivityEvent } from '../types';
import { createMissionTool, updateMissionTool, createNotificationTool } from '../tools';

export interface MonitoringActivationResult {
  mission: Mission;
  isDaemonActive: boolean;
  checkFrequencyMinutes: number;
  event: AgentActivityEvent;
}

export class MonitoringAgent {
  async activate(
    missionId: string,
    requirements: MissionRequirements,
    matchedPropertyIds: string[],
    rankedScores: Record<string, any>,
    topMatchesCount: number
  ): Promise<MonitoringActivationResult> {
    const timestamp = new Date().toISOString();
    const checkFrequencyMinutes = 15;

    // 1. Tool Call: create_mission / update_mission
    const initRes = createMissionTool.execute({ requirements });
    const mission = initRes.mission;
    mission.id = missionId;
    mission.status = 'MONITORING';
    mission.matchedPropertyIds = matchedPropertyIds;
    mission.rankedScores = rankedScores;
    mission.monitoring = {
      isActive: true,
      lastChecked: timestamp,
      nextCheck: new Date(Date.now() + checkFrequencyMinutes * 60000).toISOString(),
      totalEvaluated: matchedPropertyIds.length,
      newMatchesFound: 0,
      checkFrequencyMinutes
    };

    updateMissionTool.execute({
      missionId,
      updates: mission
    });

    // 2. Tool Call: create_notification
    createNotificationTool.execute({
      title: 'Housing Mission Monitoring Active',
      message: `Autonomous mission deployed! Identified ${topMatchesCount} high-ranking matches. Background listener active for new listings.`,
      type: 'mission',
      missionId
    });

    const event: AgentActivityEvent = {
      id: `evt-${Date.now()}-mon`,
      missionId,
      timestamp,
      taskName: 'MonitoringAgent: Autonomous Daemon Deployed',
      status: 'active',
      category: 'monitor',
      description: `Continuous background listener active. Polling frequency: every ${checkFrequencyMinutes} minutes. Instant match notification triggers armed.`,
      dataSnapshot: {
        agent: 'MonitoringAgent',
        toolsUsed: ['create_mission', 'update_mission', 'create_notification'],
        missionId,
        monitoringActive: true,
        pollingIntervalMinutes: checkFrequencyMinutes,
        initialCandidatesMonitored: matchedPropertyIds.length
      }
    };

    return {
      mission,
      isDaemonActive: true,
      checkFrequencyMinutes,
      event
    };
  }
}
