import { getFirestore, firestoreManager } from '../firestore/FirestoreClient';
import { AgentApprovalRequest } from '../../src/types';

export class FirestoreApprovalRepository {
  private collectionName = 'approvals';

  /**
   * Retrieves an approval request by its ID
   */
  async getApproval(id: string, userId?: string): Promise<AgentApprovalRequest | null> {
    const firestore = getFirestore();
    if (firestore && firestoreManager.isUsingCloud()) {
      try {
        const doc = await firestore.collection(this.collectionName).doc(id).get();
        if (doc.exists) {
          const data = doc.data() as AgentApprovalRequest & { userId?: string };
          if (userId && data.userId && data.userId !== userId) {
            return null; // Enforce user isolation
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

  /**
   * Retrieves all approval requests for a user, optionally filtered by status
   */
  async getApprovals(userId?: string, status?: AgentApprovalRequest['status']): Promise<AgentApprovalRequest[]> {
    const firestore = getFirestore();
    if (firestore && firestoreManager.isUsingCloud()) {
      try {
        let query = firestore.collection(this.collectionName).orderBy('createdAt', 'desc');
        if (userId) {
          query = query.where('userId', '==', userId) as any;
        }
        if (status) {
          query = query.where('status', '==', status) as any;
        }
        const snapshot = await query.get();
        return snapshot.docs.map(doc => doc.data() as AgentApprovalRequest);
      } catch (e) {
        firestoreManager.markCloudUnavailable(e);
      }
    }

    const memCol = firestoreManager.getInMemoryCollection(this.collectionName);
    let all = Array.from(memCol.values()) as Array<AgentApprovalRequest & { userId?: string }>;
    if (userId) {
      all = all.filter(a => a.userId === userId || !a.userId);
    }
    if (status) {
      all = all.filter(a => a.status === status);
    }
    all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return all;
  }

  /**
   * Creates or saves an approval request
   */
  async saveApproval(request: AgentApprovalRequest, userId?: string): Promise<AgentApprovalRequest> {
    const record = {
      ...request,
      userId: userId || (request as any).userId || 'default-user',
      updatedAt: new Date().toISOString()
    };

    const firestore = getFirestore();
    if (firestore && firestoreManager.isUsingCloud()) {
      try {
        await firestore.collection(this.collectionName).doc(request.id).set(record, { merge: true });
      } catch (e) {
        firestoreManager.markCloudUnavailable(e);
      }
    }

    const memCol = firestoreManager.getInMemoryCollection(this.collectionName);
    memCol.set(request.id, record);
    return record;
  }

  /**
   * Resolves an approval request (APPROVE or REJECT) with optional modified message
   */
  async resolveApproval(
    id: string,
    status: 'APPROVED' | 'REJECTED' | 'EDITED',
    editedMessage?: string,
    userId?: string
  ): Promise<AgentApprovalRequest | null> {
    const existing = await this.getApproval(id, userId);
    if (!existing) return null;

    const resolved: AgentApprovalRequest = {
      ...existing,
      status,
      resolvedAt: new Date().toISOString(),
      ...(editedMessage ? { editedMessage, proposedMessage: editedMessage } : {})
    };

    return this.saveApproval(resolved, userId || (existing as any).userId);
  }

  /**
   * Deletes an approval request
   */
  async deleteApproval(id: string, userId?: string): Promise<boolean> {
    const existing = await this.getApproval(id, userId);
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

export const firestoreApprovalRepository = new FirestoreApprovalRepository();
