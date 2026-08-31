import { getFirestore, firestoreManager } from '../firestore/FirestoreClient';

export interface MonitoringJobRecord {
  id: string;
  missionId: string;
  userId: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  frequencyMinutes: number;
  lastRunAt: string | null;
  nextRunAt: string;
  evaluationCount: number;
  matchesFoundCount: number;
  targetCriteria: {
    bedrooms: number | string;
    maxBudget: number;
    targetLocation: string;
    maxDistanceKm: number;
    furnishing: string;
    avoidGroundFloor: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export class FirestoreMonitoringJobRepository {
  private collectionName = 'monitoring_jobs';

  async getJob(id: string, userId?: string): Promise<MonitoringJobRecord | null> {
    const firestore = getFirestore();
    if (firestore && firestoreManager.isUsingCloud()) {
      try {
        const doc = await firestore.collection(this.collectionName).doc(id).get();
        if (doc.exists) {
          const data = doc.data() as MonitoringJobRecord;
          if (userId && data.userId && data.userId !== userId) {
            return null;
          }
          return data;
        }
      } catch (e) {
        firestoreManager.markCloudUnavailable(e);
      }
    }

    const memCol = firestoreManager.getInMemoryCollection(this.collectionName);
    const item = memCol.get(id);
    if (!item) return null;
    if (userId && item.userId && item.userId !== userId) return null;
    return item;
  }

  async getJobsForUser(userId: string): Promise<MonitoringJobRecord[]> {
    const firestore = getFirestore();
    if (firestore && firestoreManager.isUsingCloud()) {
      try {
        const snapshot = await firestore
          .collection(this.collectionName)
          .where('userId', '==', userId)
          .get();
        return snapshot.docs.map(doc => doc.data() as MonitoringJobRecord);
      } catch (e) {
        firestoreManager.markCloudUnavailable(e);
      }
    }

    const memCol = firestoreManager.getInMemoryCollection(this.collectionName);
    const all = Array.from(memCol.values()) as MonitoringJobRecord[];
    return all.filter(j => j.userId === userId);
  }

  async getAllActiveJobs(): Promise<MonitoringJobRecord[]> {
    const firestore = getFirestore();
    if (firestore && firestoreManager.isUsingCloud()) {
      try {
        const snapshot = await firestore
          .collection(this.collectionName)
          .where('status', '==', 'ACTIVE')
          .get();
        return snapshot.docs.map(doc => doc.data() as MonitoringJobRecord);
      } catch (e) {
        firestoreManager.markCloudUnavailable(e);
      }
    }

    const memCol = firestoreManager.getInMemoryCollection(this.collectionName);
    const all = Array.from(memCol.values()) as MonitoringJobRecord[];
    return all.filter(j => j.status === 'ACTIVE');
  }

  async saveJob(job: MonitoringJobRecord): Promise<MonitoringJobRecord> {
    const record: MonitoringJobRecord = {
      ...job,
      updatedAt: new Date().toISOString()
    };

    const firestore = getFirestore();
    if (firestore && firestoreManager.isUsingCloud()) {
      try {
        await firestore.collection(this.collectionName).doc(job.id).set(record, { merge: true });
      } catch (e) {
        firestoreManager.markCloudUnavailable(e);
      }
    }

    const memCol = firestoreManager.getInMemoryCollection(this.collectionName);
    memCol.set(job.id, record);
    return record;
  }

  async updateJobStats(id: string, evaluatedDelta: number, matchesFoundDelta: number): Promise<void> {
    const existing = await this.getJob(id);
    if (!existing) return;

    existing.evaluationCount = (existing.evaluationCount || 0) + evaluatedDelta;
    existing.matchesFoundCount = (existing.matchesFoundCount || 0) + matchesFoundDelta;
    existing.lastRunAt = new Date().toISOString();
    existing.nextRunAt = new Date(Date.now() + (existing.frequencyMinutes || 15) * 60000).toISOString();

    await this.saveJob(existing);
  }

  async deleteJob(id: string, userId?: string): Promise<boolean> {
    const existing = await this.getJob(id, userId);
    if (!existing) return false;

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
    return true;
  }
}

export const firestoreMonitoringJobRepository = new FirestoreMonitoringJobRepository();
