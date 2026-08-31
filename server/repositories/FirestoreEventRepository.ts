import { getFirestore, firestoreManager } from '../firestore/FirestoreClient';
import { AgentActivityEvent } from '../../src/types';

export class FirestoreEventRepository {
  private collectionName = 'agent_events';

  async getEvents(missionId?: string, limit = 150, userId?: string): Promise<AgentActivityEvent[]> {
    const firestore = getFirestore();
    if (firestore && firestoreManager.isUsingCloud()) {
      try {
        let query = firestore.collection(this.collectionName).orderBy('timestamp', 'desc');
        if (missionId) {
          query = query.where('missionId', '==', missionId) as any;
        }
        if (userId) {
          query = query.where('userId', '==', userId) as any;
        }
        const snapshot = await query.limit(limit).get();
        return snapshot.docs.map(doc => doc.data() as AgentActivityEvent);
      } catch (e) {
        firestoreManager.markCloudUnavailable(e);
      }
    }

    const memCol = firestoreManager.getInMemoryCollection(this.collectionName);
    let all = Array.from(memCol.values()) as Array<AgentActivityEvent & { userId?: string }>;
    if (missionId) {
      all = all.filter(e => e.missionId === missionId);
    }
    if (userId) {
      all = all.filter(e => e.userId === userId || !e.userId);
    }
    all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return all.slice(0, limit);
  }

  async addEvent(event: AgentActivityEvent, userId?: string): Promise<AgentActivityEvent> {
    const formatted: AgentActivityEvent & { userId?: string } = {
      ...event,
      id: event.id || `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: userId || (event as any).userId,
      timestamp: event.timestamp || new Date().toISOString()
    };

    const firestore = getFirestore();
    if (firestore && firestoreManager.isUsingCloud()) {
      try {
        await firestore.collection(this.collectionName).doc(formatted.id).set(formatted);
      } catch (e) {
        firestoreManager.markCloudUnavailable(e);
      }
    }

    const memCol = firestoreManager.getInMemoryCollection(this.collectionName);
    memCol.set(formatted.id, formatted);
    return formatted;
  }

  async addEvents(events: AgentActivityEvent[], userId?: string): Promise<AgentActivityEvent[]> {
    if (!events || events.length === 0) return [];
    
    const formattedList = events.map(e => ({
      ...e,
      id: e.id || `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: userId || (e as any).userId,
      timestamp: e.timestamp || new Date().toISOString()
    }));

    const firestore = getFirestore();
    if (firestore && firestoreManager.isUsingCloud()) {
      try {
        const batch = firestore.batch();
        for (const evt of formattedList) {
          const docRef = firestore.collection(this.collectionName).doc(evt.id);
          batch.set(docRef, evt, { merge: true });
        }
        await batch.commit();
      } catch (e) {
        firestoreManager.markCloudUnavailable(e);
      }
    }

    const memCol = firestoreManager.getInMemoryCollection(this.collectionName);
    for (const evt of formattedList) {
      memCol.set(evt.id, evt);
    }

    return formattedList;
  }

  async clearEvents(userId?: string): Promise<void> {
    const firestore = getFirestore();
    if (firestore && firestoreManager.isUsingCloud()) {
      try {
        let query = firestore.collection(this.collectionName) as any;
        if (userId) {
          query = query.where('userId', '==', userId);
        }
        const snapshot = await query.get();
        const batch = firestore.batch();
        snapshot.docs.forEach((doc: any) => batch.delete(doc.ref));
        await batch.commit();
      } catch (e) {
        firestoreManager.markCloudUnavailable(e);
      }
    }

    const memCol = firestoreManager.getInMemoryCollection(this.collectionName);
    if (userId) {
      for (const [key, val] of memCol.entries()) {
        if ((val as any).userId === userId) {
          memCol.delete(key);
        }
      }
    } else {
      memCol.clear();
    }
  }
}

export const firestoreEventRepository = new FirestoreEventRepository();
