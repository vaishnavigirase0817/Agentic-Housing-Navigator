import { AgentActivityEvent } from '../../src/types';

export type PubSubTopic = 'housing-monitoring' | 'property-updates' | 'agent-events';

export type PubSubEventType = 
  | 'MONITOR_ACTIVE_MISSIONS'
  | 'PROPERTY_CREATED'
  | 'PROPERTY_UPDATED'
  | 'AGENT_EVENT_LOGGED'
  | 'SCHEDULER_TICK';

export interface PubSubMessage<T = any> {
  id: string;
  topic: PubSubTopic;
  eventType: PubSubEventType;
  timestamp: string;
  source: 'scheduler' | 'property_feed' | 'orchestrator' | 'demo_trigger' | 'cloud_pubsub';
  payload: T;
  attributes?: Record<string, string>;
}

export type PubSubMessageHandler<T = any> = (message: PubSubMessage<T>) => Promise<void> | void;

class PubSubService {
  private subscribers: Map<PubSubTopic, Set<PubSubMessageHandler>> = new Map();
  private recentMessages: PubSubMessage[] = [];
  private maxHistory = 100;
  private isInitialized = false;

  constructor() {
    this.initTopics();
  }

  private initTopics() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    this.subscribers.set('housing-monitoring', new Set());
    this.subscribers.set('property-updates', new Set());
    this.subscribers.set('agent-events', new Set());
    console.log('[Google Cloud Pub/Sub] Topics initialized: housing-monitoring, property-updates, agent-events');
  }

  public subscribe(topic: PubSubTopic, handler: PubSubMessageHandler): () => void {
    this.initTopics();
    const handlers = this.subscribers.get(topic);
    if (handlers) {
      handlers.add(handler);
    }
    return () => {
      handlers?.delete(handler);
    };
  }

  public async publish<T = any>(
    topic: PubSubTopic,
    eventType: PubSubEventType,
    payload: T,
    source: PubSubMessage['source'] = 'demo_trigger',
    attributes?: Record<string, string>
  ): Promise<PubSubMessage<T>> {
    this.initTopics();

    const message: PubSubMessage<T> = {
      id: `pubsub-msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      topic,
      eventType,
      timestamp: new Date().toISOString(),
      source,
      payload,
      attributes: attributes || {}
    };

    // Store in history
    this.recentMessages.unshift(message);
    if (this.recentMessages.length > this.maxHistory) {
      this.recentMessages.pop();
    }

    console.log(`[Google Cloud Pub/Sub] 📤 Published event "${eventType}" to topic "${topic}" [Msg ID: ${message.id}]`);

    // Dispatch to registered subscriber handlers asynchronously
    const handlers = this.subscribers.get(topic);
    if (handlers && handlers.size > 0) {
      for (const handler of handlers) {
        try {
          await handler(message);
        } catch (err) {
          console.error(`[Google Cloud Pub/Sub] Error in subscriber handler for topic ${topic}:`, err);
        }
      }
    }

    return message;
  }

  public getRecentMessages(limit = 20): PubSubMessage[] {
    return this.recentMessages.slice(0, limit);
  }

  public getTopicStats() {
    return {
      status: 'active',
      topics: [
        {
          name: 'housing-monitoring',
          subscribersCount: this.subscribers.get('housing-monitoring')?.size || 0,
          description: 'Background polling triggers and active mission evaluation events'
        },
        {
          name: 'property-updates',
          subscribersCount: this.subscribers.get('property-updates')?.size || 0,
          description: 'Inbound real-time property listings and feed updates'
        },
        {
          name: 'agent-events',
          subscribersCount: this.subscribers.get('agent-events')?.size || 0,
          description: 'Multi-agent activity and telemetry event stream'
        }
      ],
      totalMessagesPublished: this.recentMessages.length,
      lastEventTimestamp: this.recentMessages[0]?.timestamp || null
    };
  }
}

export const pubsubService = new PubSubService();
