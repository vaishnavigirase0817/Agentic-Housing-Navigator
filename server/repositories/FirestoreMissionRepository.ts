import { getFirestore, firestoreManager } from '../firestore/FirestoreClient';
import { Mission } from '../../src/types';

export class FirestoreMissionRepository {
  private collectionName = 'missions';

  /**
   * Retrieves a mission by its unique ID
   */
  async getMission(id: string): Promise<Mission | null> {
    const firestore = getFirestore();
    if (firestore && firestoreManager.isUsingCloud()) {
      try {
        const doc = await firestore.collection(this.collectionName).doc(id).get();
        if (doc.exists) {
          return doc.data() as Mission;
        }
      } catch (e) {
        firestoreManager.markCloudUnavailable(e);
      }
    }

    // Fallback store
    const memCol = firestoreManager.getInMemoryCollection(this.collectionName);
    return memCol.get(id) || null;
  }

  /**
   * Retrieves the currently active mission for a user
   */
  async getActiveMission(userId?: string): Promise<Mission | null> {
    const firestore = getFirestore();
    if (firestore && firestoreManager.isUsingCloud()) {
      try {
        let query = firestore.collection(this.collectionName).orderBy('updatedAt', 'desc');
        if (userId) {
          query = query.where('userId', '==', userId) as any;
        }
        const snapshot = await query.limit(1).get();

        if (!snapshot.empty) {
          return snapshot.docs[0].data() as Mission;
        }
      } catch (e) {
        firestoreManager.markCloudUnavailable(e);
      }
    }

    const memCol = firestoreManager.getInMemoryCollection(this.collectionName);
    let all = Array.from(memCol.values()) as Array<Mission & { userId?: string }>;
    if (userId) {
      all = all.filter(m => m.userId === userId || !m.userId);
    }
    if (all.length === 0) return null;
    all.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return all[0];
  }

  /**
   * Saves or updates a mission with userId
   */
  async saveMission(mission: Mission, userId?: string): Promise<Mission> {
    const updatedMission: Mission & { updatedAt: string; userId?: string } = {
      ...mission,
      userId: userId || (mission as any).userId,
      updatedAt: new Date().toISOString()
    };

    const firestore = getFirestore();
    if (firestore && firestoreManager.isUsingCloud()) {
      try {
        await firestore
          .collection(this.collectionName)
          .doc(mission.id)
          .set(updatedMission, { merge: true });
      } catch (e) {
        firestoreManager.markCloudUnavailable(e);
      }
    }

    const memCol = firestoreManager.getInMemoryCollection(this.collectionName);
    memCol.set(mission.id, updatedMission);
    return updatedMission;
  }

  /**
   * Updates partial fields of an existing mission
   */
  async updateMission(id: string, updates: Partial<Mission>, userId?: string): Promise<Mission | null> {
    const existing = await this.getMission(id);
    if (!existing) return null;

    const merged: Mission = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    } as Mission;

    return this.saveMission(merged, userId || (existing as any).userId);
  }

  /**
   * Deletes a mission
   */
  async deleteMission(id: string): Promise<void> {
    const firestore = getFirestore();
    if (firestore && firestoreManager.isUsingCloud()) {
      try {
        await firestore.collection(this.collectionName).doc(id).delete();
      } catch (e) {
        firestoreManager.markCloudUnavailable(e);
      }
    }

    const memCol = firestoreManager.getInMemoryCollection(this.collectionName);
    memCol.delete(id);
  }

  /**
   * Retrieves all missions for a user
   */
  async getAllMissions(userId?: string): Promise<Mission[]> {
    const firestore = getFirestore();
    if (firestore && firestoreManager.isUsingCloud()) {
      try {
        let query = firestore.collection(this.collectionName).orderBy('createdAt', 'desc');
        if (userId) {
          query = query.where('userId', '==', userId) as any;
        }
        const snapshot = await query.get();

        return snapshot.docs.map(doc => doc.data() as Mission);
      } catch (e) {
        firestoreManager.markCloudUnavailable(e);
      }
    }

    const memCol = firestoreManager.getInMemoryCollection(this.collectionName);
    let all = Array.from(memCol.values()) as Array<Mission & { userId?: string }>;
    if (userId) {
      all = all.filter(m => m.userId === userId || !m.userId);
    }
    return all;
  }

  /**
   * Wipes all missions (for reset testing)
   */
  async clearAll(): Promise<void> {
    const firestore = getFirestore();
    if (firestore && firestoreManager.isUsingCloud()) {
      try {
        const snapshot = await firestore.collection(this.collectionName).get();
        const batch = firestore.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      } catch (e) {
        firestoreManager.markCloudUnavailable(e);
      }
    }

    const memCol = firestoreManager.getInMemoryCollection(this.collectionName);
    memCol.clear();
  }
}

export const firestoreMissionRepository = new FirestoreMissionRepository();
