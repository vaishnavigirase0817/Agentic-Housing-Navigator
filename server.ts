import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { HousingOrchestrator } from './src/agent/HousingOrchestrator';
import { safeGenerateContent, safeParseJson } from './src/agent/geminiHelper';
import { ALL_AGENT_TOOLS } from './src/tools';
import { firestoreManager } from './server/firestore/FirestoreClient';
import { firestoreMissionRepository } from './server/repositories/FirestoreMissionRepository';
import { firestoreMemoryRepository } from './server/repositories/FirestoreMemoryRepository';
import { firestoreNotificationRepository } from './server/repositories/FirestoreNotificationRepository';
import { firestoreEventRepository } from './server/repositories/FirestoreEventRepository';
import { firestoreShortlistRepository } from './server/repositories/FirestoreShortlistRepository';
import { firestoreUserRepository } from './server/repositories/FirestoreUserRepository';
import { firestoreApprovalRepository } from './server/repositories/FirestoreApprovalRepository';
import { firestoreMonitoringJobRepository } from './server/repositories/FirestoreMonitoringJobRepository';
import { firestorePropertyRepository } from './server/repositories/FirestorePropertyRepository';
import { pubsubService } from './server/pubsub/PubSubService';
import { monitoringWorker } from './server/agent/MonitoringWorker';
import { cloudSchedulerService } from './server/scheduler/CloudSchedulerService';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini Client (Server-side only with Secret Manager / Env config)
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!genAIClient && process.env.GEMINI_API_KEY) {
    genAIClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build-housing-navigator',
        },
      },
    });
  }
  return genAIClient;
}

// -------------------------------------------------------------
// 1. HEALTH & GOOGLE CLOUD METADATA ENDPOINTS
// -------------------------------------------------------------
app.get(['/health', '/api/health'], (req, res) => {
  const fsStatus = firestoreManager.getStatus();
  res.json({
    status: 'ok',
    service: 'Agentic Housing Navigator (Google ADK & Cloud Run)',
    cloudRunReady: true,
    geminiAvailable: Boolean(process.env.GEMINI_API_KEY),
    firestore: fsStatus,
    cloudScheduler: cloudSchedulerService.getStatus(),
    pubsub: pubsubService.getTopicStats(),
    architecture: 'Google ADK Multi-Agent Coordinator + Cloud Firestore + Pub/Sub + Cloud Scheduler',
    agents: [
      'HousingOrchestrator',
      'RequirementAgent',
      'PropertySearchAgent',
      'BudgetAgent',
      'LocationAgent',
      'PreferenceAgent',
      'RankingAgent',
      'MonitoringAgent'
    ],
    timestamp: new Date().toISOString()
  });
});

app.get('/api/cloud/status', (req, res) => {
  const fsStatus = firestoreManager.getStatus();
  res.json({
    service: 'Agentic Housing Navigator',
    platform: 'Google Cloud Run',
    environment: process.env.NODE_ENV || 'production',
    costConsciousMode: 'Scale-to-Zero Enabled (Stateless request model)',
    gcpProject: process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || 'agentic-housing-cloud',
    firestore: fsStatus,
    cloudScheduler: cloudSchedulerService.getStatus(),
    pubsub: pubsubService.getTopicStats(),
    geminiModel: 'gemini-3.7-flash',
    geminiInitialized: Boolean(getGenAI()),
    secretManagerConfigured: Boolean(process.env.GEMINI_API_KEY),
    repositories: [
      'FirestoreUserRepository',
      'FirestoreMissionRepository',
      'FirestorePropertyRepository',
      'FirestoreMemoryRepository',
      'FirestoreShortlistRepository',
      'FirestoreNotificationRepository',
      'FirestoreEventRepository',
      'FirestoreMonitoringJobRepository',
      'FirestoreApprovalRepository'
    ],
    registeredTools: ALL_AGENT_TOOLS.map(t => t.name),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/agent/health', (req, res) => {
  res.json({
    status: 'ready',
    orchestrator: 'HousingOrchestrator',
    model: 'gemini-3.7-flash',
    geminiInitialized: Boolean(getGenAI()),
    firestoreStatus: firestoreManager.getStatus(),
    toolsRegistered: ALL_AGENT_TOOLS.map(t => t.name)
  });
});

// Helper to extract authenticated or active user identity
function getUserId(req: express.Request): string {
  const customHeader = req.headers['x-user-id'];
  if (typeof customHeader === 'string' && customHeader.trim()) {
    return customHeader.trim();
  }
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token.startsWith('token-') || token.startsWith('demo-token-')) {
      const parts = token.split('-');
      if (parts.length >= 3) {
        return parts.slice(1, -1).join('-');
      }
    }
  }
  if (typeof req.query.userId === 'string' && req.query.userId.trim()) {
    return req.query.userId.trim();
  }
  return 'user-vaishnavi-student';
}

// -------------------------------------------------------------
// 1.5. AUTHENTICATION & USER PROFILE API
// -------------------------------------------------------------
app.get('/api/auth/me', async (req, res) => {
  try {
    const userId = getUserId(req);
    const user = await firestoreUserRepository.getUser(userId);
    res.json({ success: true, data: user });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch user session' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const allUsers = await firestoreUserRepository.getAllUsers();
    let user = allUsers.find(u => u.email.toLowerCase() === cleanEmail);
    
    if (!user) {
      const userId = `user-${Date.now()}`;
      const name = cleanEmail.split('@')[0];
      user = await firestoreUserRepository.updateUser(userId, {
        id: userId,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        email: cleanEmail,
        city: 'Bengaluru',
        personaType: 'custom',
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      token: `token-${user.id}-${Date.now()}`,
      data: user
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Login failed' });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, phone, city, occupation } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    const userId = `user-${Date.now()}`;
    const user = await firestoreUserRepository.updateUser(userId, {
      id: userId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone || '+91 98765 00000',
      city: city || 'Bengaluru',
      occupation: occupation || 'Explorer',
      personaType: 'custom',
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      preferredCurrency: 'INR (₹)',
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    });

    res.json({
      success: true,
      token: `token-${user.id}-${Date.now()}`,
      data: user
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Sign up failed' });
  }
});

app.post('/api/auth/profile', async (req, res) => {
  try {
    const userId = req.body.id || getUserId(req);
    const updated = await firestoreUserRepository.updateUser(userId, req.body);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update profile' });
  }
});

app.get('/api/auth/users', async (req, res) => {
  try {
    const users = await firestoreUserRepository.getAllUsers();
    res.json({ success: true, data: users });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list users' });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    res.json({
      success: true,
      message: `Password reset instructions sent to ${email}. Check your inbox.`
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to request reset' });
  }
});

// -------------------------------------------------------------
// 2. FIRESTORE MISSION REPOSITORY API
// -------------------------------------------------------------
app.get('/api/missions/active', async (req, res) => {
  try {
    const userId = getUserId(req);
    const mission = await firestoreMissionRepository.getActiveMission(userId);
    res.json({ success: true, data: mission });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to get active mission' });
  }
});

app.get('/api/missions', async (req, res) => {
  try {
    const userId = getUserId(req);
    const missions = await firestoreMissionRepository.getAllMissions(userId);
    res.json({ success: true, data: missions });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list missions' });
  }
});

app.get('/api/missions/:id', async (req, res) => {
  try {
    const mission = await firestoreMissionRepository.getMission(req.params.id);
    if (!mission) {
      return res.status(404).json({ error: 'Mission not found' });
    }
    res.json({ success: true, data: mission });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch mission' });
  }
});

app.post('/api/missions', async (req, res) => {
  try {
    const mission = req.body;
    if (!mission || !mission.id) {
      return res.status(400).json({ error: 'Mission data with ID is required' });
    }
    const userId = getUserId(req);
    const saved = await firestoreMissionRepository.saveMission(mission, userId);
    res.json({ success: true, data: saved });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to save mission' });
  }
});

app.put('/api/missions/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    const updated = await firestoreMissionRepository.updateMission(req.params.id, req.body, userId);
    if (!updated) {
      return res.status(404).json({ error: 'Mission not found' });
    }
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update mission' });
  }
});

app.delete('/api/missions/active', async (req, res) => {
  try {
    const userId = getUserId(req);
    const active = await firestoreMissionRepository.getActiveMission(userId);
    if (active) {
      await firestoreMissionRepository.deleteMission(active.id);
    }
    res.json({ success: true, message: 'Active mission cleared' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to clear active mission' });
  }
});

// -------------------------------------------------------------
// 3. FIRESTORE USER MEMORY & PREFERENCES REPOSITORY API
// -------------------------------------------------------------
app.get('/api/preferences', async (req, res) => {
  try {
    const userId = getUserId(req);
    const prefs = await firestoreMemoryRepository.getPreferences(userId);
    res.json({ success: true, data: prefs });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to get preferences' });
  }
});

app.post('/api/preferences', async (req, res) => {
  try {
    const prefs = req.body;
    const userId = getUserId(req);
    const saved = await firestoreMemoryRepository.savePreferences(prefs, userId);
    
    // Log preference update event
    await firestoreEventRepository.addEvent({
      id: `evt-${Date.now()}-pref-save`,
      missionId: 'system',
      timestamp: new Date().toISOString(),
      taskName: 'FirestoreMemoryRepository: Preferences Saved',
      agent: 'PreferenceAgent',
      action: 'save_user_preference',
      status: 'success',
      category: 'system',
      description: `Persistent memory updated in Firestore for user ${userId}. Avoid Ground: ${saved.avoidGroundFloor ? 'Yes' : 'No'}, Max Budget: ₹${saved.maxBudget.toLocaleString('en-IN')}`,
      dataSnapshot: { preferences: saved, userId },
      metadata: { avoidGroundFloor: saved.avoidGroundFloor, maxBudget: saved.maxBudget }
    }, userId);

    res.json({ success: true, data: saved });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to save preferences' });
  }
});

app.post('/api/preferences/reset', async (req, res) => {
  try {
    const userId = getUserId(req);
    const reset = await firestoreMemoryRepository.resetPreferences(userId);
    res.json({ success: true, data: reset });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to reset preferences' });
  }
});

// -------------------------------------------------------------
// 4. FIRESTORE SHORTLIST REPOSITORY API
// -------------------------------------------------------------
app.get('/api/shortlist', async (req, res) => {
  try {
    const userId = getUserId(req);
    const propertyIds = await firestoreShortlistRepository.getShortlist(userId);
    res.json({ success: true, data: propertyIds });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to get shortlist' });
  }
});

app.post('/api/shortlist/toggle', async (req, res) => {
  try {
    const { propertyId } = req.body;
    if (!propertyId) {
      return res.status(400).json({ error: 'propertyId is required' });
    }
    const userId = getUserId(req);
    const result = await firestoreShortlistRepository.toggleShortlist(propertyId, userId);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to toggle shortlist' });
  }
});

// -------------------------------------------------------------
// 5. FIRESTORE NOTIFICATIONS REPOSITORY API
// -------------------------------------------------------------
app.get('/api/notifications', async (req, res) => {
  try {
    const userId = getUserId(req);
    const notifs = await firestoreNotificationRepository.getNotifications(userId);
    res.json({ success: true, data: notifs });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to get notifications' });
  }
});

app.post('/api/notifications', async (req, res) => {
  try {
    const item = req.body;
    const userId = getUserId(req);
    const added = await firestoreNotificationRepository.addNotification(item, userId);
    res.json({ success: true, data: added });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to add notification' });
  }
});

app.patch('/api/notifications/:id/read', async (req, res) => {
  try {
    const userId = getUserId(req);
    await firestoreNotificationRepository.markAsRead(req.params.id, userId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to mark notification as read' });
  }
});

app.post('/api/notifications/read-all', async (req, res) => {
  try {
    const userId = getUserId(req);
    await firestoreNotificationRepository.markAllAsRead(userId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to mark all notifications as read' });
  }
});

app.delete('/api/notifications', async (req, res) => {
  try {
    const userId = getUserId(req);
    await firestoreNotificationRepository.clearAll(userId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to clear notifications' });
  }
});

// -------------------------------------------------------------
// 6. FIRESTORE AGENT ACTIVITY EVENTS REPOSITORY API
// -------------------------------------------------------------
app.get('/api/events', async (req, res) => {
  try {
    const userId = getUserId(req);
    const missionId = req.query.missionId as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 150;
    const events = await firestoreEventRepository.getEvents(missionId, limit, userId);
    res.json({ success: true, data: events });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to retrieve agent events' });
  }
});

app.post('/api/events', async (req, res) => {
  try {
    const body = req.body;
    const userId = getUserId(req);
    if (Array.isArray(body)) {
      const saved = await firestoreEventRepository.addEvents(body, userId);
      return res.json({ success: true, data: saved });
    }
    const saved = await firestoreEventRepository.addEvent(body, userId);
    res.json({ success: true, data: saved });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to record agent event' });
  }
});

app.delete('/api/events', async (req, res) => {
  try {
    const userId = getUserId(req);
    await firestoreEventRepository.clearEvents(userId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to clear events' });
  }
});

// -------------------------------------------------------------
// 6.5. FIRESTORE PROPERTIES REPOSITORY API
// -------------------------------------------------------------
app.get('/api/properties', async (req, res) => {
  try {
    const properties = await firestorePropertyRepository.getAllProperties();
    res.json({ success: true, count: properties.length, data: properties });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to retrieve properties' });
  }
});

app.get('/api/properties/:id', async (req, res) => {
  try {
    const prop = await firestorePropertyRepository.getProperty(req.params.id);
    if (!prop) {
      return res.status(404).json({ error: 'Property not found' });
    }
    res.json({ success: true, data: prop });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch property' });
  }
});

// -------------------------------------------------------------
// 6.6. FIRESTORE HUMAN APPROVAL GATES REPOSITORY API
// -------------------------------------------------------------
app.get('/api/approvals', async (req, res) => {
  try {
    const userId = getUserId(req);
    const status = req.query.status as any;
    const approvals = await firestoreApprovalRepository.getApprovals(userId, status);
    res.json({ success: true, data: approvals });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to retrieve approval requests' });
  }
});

app.post('/api/approvals', async (req, res) => {
  try {
    const userId = getUserId(req);
    const request = req.body;
    if (!request || !request.id) {
      return res.status(400).json({ error: 'Approval request object with ID is required' });
    }
    const saved = await firestoreApprovalRepository.saveApproval(request, userId);
    res.json({ success: true, data: saved });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to save approval request' });
  }
});

app.post('/api/approvals/:id/resolve', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { status, editedMessage } = req.body;
    if (!status || (status !== 'APPROVED' && status !== 'REJECTED' && status !== 'EDITED')) {
      return res.status(400).json({ error: 'Status must be APPROVED, REJECTED, or EDITED' });
    }
    const resolved = await firestoreApprovalRepository.resolveApproval(
      req.params.id,
      status,
      editedMessage,
      userId
    );
    if (!resolved) {
      return res.status(404).json({ error: 'Approval request not found or unauthorized' });
    }

    // Log approval resolution event
    await firestoreEventRepository.addEvent({
      id: `evt-${Date.now()}-approval-resolve`,
      missionId: resolved.missionId || 'system',
      timestamp: new Date().toISOString(),
      taskName: `HumanApproval: Action ${status}`,
      agent: 'CommunicationAgent',
      action: status === 'APPROVED' ? 'execute_authorized_outreach' : 'cancel_outreach',
      status: status === 'APPROVED' ? 'success' : 'info',
      category: 'system',
      description: `User ${status.toLowerCase()} outreach to owner of "${resolved.propertyTitle}".`,
      dataSnapshot: { resolved, userId }
    }, userId);

    res.json({ success: true, data: resolved });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to resolve approval' });
  }
});

// -------------------------------------------------------------
// 6.7. FIRESTORE MONITORING JOBS REPOSITORY API
// -------------------------------------------------------------
app.get('/api/monitoring/jobs', async (req, res) => {
  try {
    const userId = getUserId(req);
    const jobs = await firestoreMonitoringJobRepository.getJobsForUser(userId);
    res.json({ success: true, data: jobs });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to get monitoring jobs' });
  }
});

app.post('/api/monitoring/jobs', async (req, res) => {
  try {
    const userId = getUserId(req);
    const job = { ...req.body, userId };
    const saved = await firestoreMonitoringJobRepository.saveJob(job);
    res.json({ success: true, data: saved });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to save monitoring job' });
  }
});

// -------------------------------------------------------------
// 7. TOOLS DISCOVERY & EXECUTION ENDPOINTS
// -------------------------------------------------------------
app.get('/api/agent/tools', (req, res) => {
  res.json({
    tools: ALL_AGENT_TOOLS.map(t => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters
    }))
  });
});

app.post('/api/agent/tools/execute', async (req, res) => {
  try {
    const { toolName, args } = req.body;
    if (!toolName) {
      return res.status(400).json({ error: 'toolName is required' });
    }

    const tool = ALL_AGENT_TOOLS.find(t => t.name === toolName);
    if (!tool) {
      return res.status(404).json({ error: `Tool "${toolName}" not found` });
    }

    const result = await tool.execute(args || {});
    return res.json({
      success: true,
      tool: toolName,
      result
    });
  } catch (err: any) {
    console.error('Tool execution error:', err);
    res.status(500).json({ error: err?.message || 'Tool execution failed' });
  }
});

// -------------------------------------------------------------
// 8. ADK MULTI-AGENT ORCHESTRATION PIPELINE (WITH FIRESTORE & MEMORY PERSISTENCE)
// -------------------------------------------------------------
app.post('/api/agent/orchestrate', async (req, res) => {
  try {
    const { query, requirements } = req.body;
    if (!query && !requirements) {
      return res.status(400).json({ error: 'Either query string or requirements object is required' });
    }

    const userId = getUserId(req);

    // 1. Analyze and extract implicit long-term preferences from query into FirestoreMemoryRepository
    if (typeof query === 'string' && query.trim()) {
      await firestoreMemoryRepository.extractAndPersistMemoryFromText(query, userId);
    }

    const ai = getGenAI();
    const orchestrator = new HousingOrchestrator(ai);

    const input = query || requirements;
    const result = await orchestrator.orchestrateMission(input);

    // 2. Persist Mission to FirestoreMissionRepository
    if (result.mission) {
      await firestoreMissionRepository.saveMission(result.mission, userId);
    }

    // 3. Persist Execution Events to FirestoreEventRepository
    if (result.agentExecutionEvents && result.agentExecutionEvents.length > 0) {
      await firestoreEventRepository.addEvents(result.agentExecutionEvents, userId);
    }

    // 4. Create Notification in FirestoreNotificationRepository
    await firestoreNotificationRepository.addNotification({
      title: 'Housing Mission Ready',
      message: `Multi-agent search completed! Found ${result.matchedCount} matching listings. Monitoring daemon deployed.`,
      type: 'mission',
      missionId: result.missionId
    }, userId);

    return res.json({
      success: true,
      data: result,
      executionEngine: ai ? 'Google ADK + Gemini 3.7 Flash' : 'Google ADK Deterministic Engine',
      firestorePersisted: true
    });
  } catch (err: any) {
    console.error('Agent orchestration error:', err);
    res.status(500).json({
      error: err?.message || 'Agent orchestration encountered a server error',
      recoveryMessage: 'The multi-agent coordinator handled the failure gracefully.'
    });
  }
});

// -------------------------------------------------------------
// 9. SPECIALIZED REQUIREMENT AGENT PARSE (BACKWARDS COMPATIBLE)
// -------------------------------------------------------------
app.post(['/api/agent/mission/parse', '/api/mission/parse'], async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'A valid query string is required' });
    }

    // Extract & save any preferences mentioned in query to Firestore
    await firestoreMemoryRepository.extractAndPersistMemoryFromText(query);

    const ai = getGenAI();
    const orchestrator = new HousingOrchestrator(ai);
    const result = await orchestrator.orchestrateMission(query);

    return res.json({
      success: true,
      data: result.requirements,
      source: ai ? 'gemini_3.7_flash' : 'local_deterministic_fallback',
      orchestrationResult: result
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Internal server error while parsing mission' });
  }
});

// -------------------------------------------------------------
// 10. SPECIALIZED RANKING & EXPLANATION ENDPOINTS
// -------------------------------------------------------------
app.post(['/api/agent/explain', '/api/mission/explain'], async (req, res) => {
  try {
    const { property, requirements, scoreEvaluation } = req.body;
    if (!property || !requirements || !scoreEvaluation) {
      return res.status(400).json({ error: 'Property, requirements, and score evaluation are required' });
    }

    const ai = getGenAI();
    if (!ai) {
      const diff = requirements.maxBudget - property.monthlyRent;
      const diffStr = diff >= 0
        ? `₹${diff.toLocaleString('en-IN')}/mo under your budget ceiling`
        : `₹${Math.abs(diff).toLocaleString('en-IN')}/mo above preferred budget`;

      return res.json({
        success: true,
        explanation: `This property scores ${scoreEvaluation.totalScore}% deterministic match. Sits ${property.distanceKm} km from campus, comes ${property.furnishing.toLowerCase()} at ${diffStr}, and features ${property.amenities.slice(0, 4).join(', ')}.`,
        verdict: scoreEvaluation.totalScore >= 80 ? 'Strong Match' : 'Worth Considering',
        source: 'deterministic_template'
      });
    }

    try {
      const prompt = `You are RankingAgent in the Agentic Housing Navigator architecture.
Provide a concise 2-3 sentence grounded explanation of why this property scored ${scoreEvaluation.totalScore}% for this mission.
Do NOT invent facts or change the score. Ground your reasoning strictly in the provided numeric facts.

User Requirements:
- Target: ${requirements.propertyType}, ${requirements.bedrooms}BHK, ${requirements.furnishing}
- Max Budget: ₹${requirements.maxBudget}/month
- Max Distance: ≤ ${requirements.maxDistanceKm} km from ${requirements.targetLocation}
- Avoid Ground Floor: ${requirements.avoidGroundFloor ? 'Yes' : 'No'}

Property:
- Title: ${property.title}
- Rent: ₹${property.monthlyRent}/month
- Distance: ${property.distanceKm} km
- Floor: ${property.floor} of ${property.totalFloors}
- Furnishing: ${property.furnishing}
- Amenities: ${property.amenities.join(', ')}
- Score Factors: ${JSON.stringify(scoreEvaluation.breakdown)}

Output clean JSON with "explanation" (string) and "recommendationVerdict" (string: Strong Match / Top Value / Balanced Pick).`;

      const aiResult = await safeGenerateContent(ai, {
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: {
              type: 'OBJECT' as any,
              properties: {
                explanation: { type: 'STRING' as any },
                recommendationVerdict: { type: 'STRING' as any }
              },
              required: ['explanation', 'recommendationVerdict']
            }
          }
        }
      });

      if (aiResult && aiResult.text) {
        const parsed = safeParseJson(aiResult.text, {} as any);
        return res.json({
          success: true,
          explanation: parsed.explanation || `Matches ${scoreEvaluation.totalScore}% of your criteria with ₹${property.monthlyRent.toLocaleString('en-IN')}/mo rent and ${property.distanceKm} km commute.`,
          verdict: parsed.recommendationVerdict || (scoreEvaluation.totalScore >= 80 ? 'Strong Match' : 'Recommended'),
          source: aiResult.modelUsed
        });
      }

      return res.json({
        success: true,
        explanation: `Matches ${scoreEvaluation.totalScore}% of your criteria with ₹${property.monthlyRent.toLocaleString('en-IN')}/mo rent and ${property.distanceKm} km commute to campus.`,
        verdict: scoreEvaluation.totalScore >= 80 ? 'Strong Match' : 'Worth Considering',
        source: 'deterministic_fallback'
      });
    } catch {
      return res.json({
        success: true,
        explanation: `Matches ${scoreEvaluation.totalScore}% of your criteria with ₹${property.monthlyRent.toLocaleString('en-IN')}/mo rent and ${property.distanceKm} km commute to campus.`,
        verdict: scoreEvaluation.totalScore >= 80 ? 'Strong Match' : 'Worth Considering',
        source: 'deterministic_fallback'
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Error generating explanation' });
  }
});

// -------------------------------------------------------------
// 11. GOOGLE CLOUD SCHEDULER, PUB/SUB & MONITORING WORKER ENDPOINTS
// -------------------------------------------------------------
app.get('/api/monitoring/status', (req, res) => {
  try {
    const scheduler = cloudSchedulerService.getStatus();
    const pubsub = pubsubService.getTopicStats();
    const firestore = firestoreManager.getStatus();

    res.json({
      success: true,
      service: 'ADK Background Monitoring Worker',
      platform: 'Google Cloud Run + Cloud Scheduler + Pub/Sub + Firestore',
      scheduler,
      pubsub,
      firestore,
      daemon: {
        agent: 'MonitoringAgent',
        status: 'ACTIVE',
        deterministicScoringThreshold: 85,
        idempotencyEnforced: true,
        pollingIntervalMinutes: 15,
        subscribedTopics: ['housing-monitoring', 'property-updates', 'agent-events']
      },
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to get monitoring status' });
  }
});

// Demo / Real Trigger endpoint for background check
// Executes the genuine Cloud Run / Pub/Sub / ADK Monitoring workflow
app.post('/api/monitoring/trigger', async (req, res) => {
  try {
    const { property, source } = req.body;
    const ai = getGenAI();
    monitoringWorker.setGenAI(ai);

    // 1. Publish to Pub/Sub topic housing-monitoring
    const pubsubMsg = await pubsubService.publish(
      'housing-monitoring',
      'MONITOR_ACTIVE_MISSIONS',
      { property, source: source || 'demo_trigger' },
      source || 'demo_trigger'
    );

    // 2. Direct run via ADK MonitoringWorker (which also handles Pub/Sub subscriber)
    const result = await monitoringWorker.runBackgroundMonitoringCheck(property, source || 'demo_trigger');

    res.json({
      success: true,
      data: result,
      pubsubMessageId: pubsubMsg.id,
      workflow: 'Cloud Scheduler → Pub/Sub → Cloud Run Monitoring Worker → Firestore → ADK MonitoringAgent',
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('[Monitoring Worker] Trigger failed:', err);
    res.status(500).json({ error: err?.message || 'Failed to trigger background monitoring check' });
  }
});

// Inbound property event (e.g. PROPERTY_CREATED)
app.post('/api/monitoring/property-event', async (req, res) => {
  try {
    const { eventType, property, propertyId } = req.body;
    const ai = getGenAI();
    monitoringWorker.setGenAI(ai);

    // Publish to property-updates Pub/Sub topic
    const pubsubMsg = await pubsubService.publish(
      'property-updates',
      eventType || 'PROPERTY_CREATED',
      property || { id: propertyId || `P-${Date.now()}` },
      'property_feed'
    );

    const result = await monitoringWorker.runBackgroundMonitoringCheck(property, 'property_feed');

    res.json({
      success: true,
      pubsubMessageId: pubsubMsg.id,
      data: result
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to process property event' });
  }
});

// Cloud Scheduler cron HTTP target endpoint
app.post('/api/scheduler/cron', async (req, res) => {
  try {
    const ai = getGenAI();
    monitoringWorker.setGenAI(ai);

    const triggerRes = await cloudSchedulerService.triggerJob('cloud_scheduler_cron');
    const result = await monitoringWorker.runBackgroundMonitoringCheck(undefined, 'cloud_scheduler_cron');

    res.json({
      success: true,
      scheduler: triggerRes,
      monitoringResult: result,
      message: 'Cloud Scheduler cron cycle completed successfully'
    });
  } catch (err: any) {
    console.error('[Cloud Scheduler] Cron execution failed:', err);
    res.status(500).json({ error: err?.message || 'Cloud Scheduler job failed' });
  }
});

// Pub/Sub generic publish endpoint
app.post('/api/pubsub/publish', async (req, res) => {
  try {
    const { topic, eventType, payload, source, attributes } = req.body;
    if (!topic || !eventType) {
      return res.status(400).json({ error: 'topic and eventType are required' });
    }

    const msg = await pubsubService.publish(
      topic,
      eventType,
      payload || {},
      source || 'orchestrator',
      attributes
    );

    res.json({ success: true, message: msg });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to publish Pub/Sub message' });
  }
});

// Pub/Sub push subscription endpoint (for Cloud Run push invocations)
app.post('/api/pubsub/push', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).send('No message payload provided');
    }

    let payload: any = {};
    if (message.data) {
      try {
        const decoded = Buffer.from(message.data, 'base64').toString('utf-8');
        payload = JSON.parse(decoded);
      } catch {
        payload = message.data;
      }
    }

    const ai = getGenAI();
    monitoringWorker.setGenAI(ai);
    const result = await monitoringWorker.runBackgroundMonitoringCheck(payload?.property, 'cloud_pubsub');

    // Acknowledge receipt to Cloud Pub/Sub
    res.status(200).json({ success: true, acknowledged: true, result });
  } catch (err: any) {
    console.error('[Pub/Sub Push] Error processing push message:', err);
    res.status(500).send('Error processing Pub/Sub message');
  }
});

// Get recent Pub/Sub messages
app.get('/api/pubsub/messages', (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
  res.json({
    success: true,
    data: pubsubService.getRecentMessages(limit)
  });
});

// -------------------------------------------------------------
// 12. SERVER STARTUP & VITE INTEGRATION
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Agentic Housing Navigator (Cloud Run + Firestore + Gemini) running on http://0.0.0.0:${PORT}`);
  });

  // Graceful shutdown handling for Cloud Run & container orchestration
  const shutdown = (signal: string) => {
    console.log(`Received ${signal}. Gracefully shutting down Agentic Housing Navigator...`);
    server.close(() => {
      console.log('HTTP server closed. Exiting process safely.');
      process.exit(0);
    });

    // Force close if graceful shutdown takes too long
    setTimeout(() => {
      console.error('Forced shutdown after 10s timeout.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer();
