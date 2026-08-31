import { pubsubService } from '../pubsub/PubSubService';

export interface SchedulerJobConfig {
  jobName: string;
  schedule: string; // e.g. '*/15 * * * *'
  targetTopic: 'housing-monitoring';
  httpTargetUrl: string;
  timeZone: string;
  lastRunTimestamp: string | null;
  nextScheduledRunTimestamp: string;
  runCount: number;
  status: 'ENABLED' | 'PAUSED';
}

class CloudSchedulerService {
  private job: SchedulerJobConfig = {
    jobName: 'agentic-housing-monitoring-daemon',
    schedule: '*/15 * * * *', // Every 15 minutes
    targetTopic: 'housing-monitoring',
    httpTargetUrl: '/api/scheduler/cron',
    timeZone: 'UTC',
    lastRunTimestamp: null,
    nextScheduledRunTimestamp: new Date(Date.now() + 15 * 60000).toISOString(),
    runCount: 0,
    status: 'ENABLED'
  };

  private timer: any = null;

  constructor() {
    this.startLocalSchedulerLoop();
  }

  private startLocalSchedulerLoop() {
    // Run an internal daemon check simulation every 15 minutes (or on startup check)
    // to keep background autonomous monitoring operational in container environments
    if (this.timer) clearInterval(this.timer);
    
    // 15-minute interval
    this.timer = setInterval(async () => {
      try {
        await this.triggerJob('cloud_scheduler_cron');
      } catch (err) {
        console.error('[CloudScheduler] Periodic cron error:', err);
      }
    }, 15 * 60 * 1000);
  }

  public async triggerJob(source: 'cloud_scheduler_cron' | 'manual_trigger' | 'demo_trigger' = 'demo_trigger') {
    const timestamp = new Date().toISOString();
    this.job.lastRunTimestamp = timestamp;
    this.job.nextScheduledRunTimestamp = new Date(Date.now() + 15 * 60000).toISOString();
    this.job.runCount++;

    console.log(`[Cloud Scheduler] ⏰ Triggering job "${this.job.jobName}" (Run #${this.job.runCount}) [Source: ${source}]`);

    // Publish event to Pub/Sub topic
    const pubsubMessage = await pubsubService.publish(
      'housing-monitoring',
      'MONITOR_ACTIVE_MISSIONS',
      {
        jobName: this.job.jobName,
        schedule: this.job.schedule,
        triggeredAt: timestamp,
        source
      },
      source as any,
      {
        'scheduler.jobName': this.job.jobName,
        'scheduler.schedule': this.job.schedule
      }
    );

    return {
      success: true,
      jobName: this.job.jobName,
      triggeredAt: timestamp,
      nextScheduled: this.job.nextScheduledRunTimestamp,
      pubsubMessageId: pubsubMessage.id
    };
  }

  public getStatus() {
    return {
      ...this.job,
      schedulerService: 'Google Cloud Scheduler',
      cronExpression: '*/15 * * * *',
      frequency: 'Every 15 minutes',
      activeTarget: 'Cloud Run / Pub/Sub (housing-monitoring)'
    };
  }
}

export const cloudSchedulerService = new CloudSchedulerService();
