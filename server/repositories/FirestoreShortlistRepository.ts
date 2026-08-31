import { getFirestore, firestoreManager } from '../firestore/FirestoreClient';

export class FirestoreShortlistRepository {
  private collectionName = 'shortlists';

  async getShortlist(userId = 'default_user'): Promise<string[]> {
    const firestore = getFirestore();
    if (firestore && firestoreManager.isUsingCloud()) {
      try {
        const doc = await firestore.collection(this.collectionName).doc(userId).get();
        if (doc.exists) {
          const data = doc.data();
          return Array.isArray(data?.propertyIds) ? data.propertyIds : [];
        }
      } catch (e) {
        firestoreManager.markCloudUnavailable(e);
      }
    }

    const memCol = firestoreManager.getInMemoryCollection(this.collectionName);
    const data = memCol.get(userId);
    return Array.isArray(data?.propertyIds) ? data.propertyIds : [];
  }

  async setShortlist(propertyIds: string[], userId = 'default_user'): Promise<string[]> {
    const payload = {
      userId,
      propertyIds: Array.from(new Set(propertyIds)),
      updatedAt: new Date().toISOString()
    };

    const firestore = getFirestore();
    if (firestore && firestoreManager.isUsingCloud()) {
      try {
        await firestore.collection(this.collectionName).doc(userId).set(payload);
      } catch (e) {
        firestoreManager.markCloudUnavailable(e);
      }
    }

    const memCol = firestoreManager.getInMemoryCollection(this.collectionName);
    memCol.set(userId, payload);
    return payload.propertyIds;
  }

  async toggleShortlist(propertyId: string, userId = 'default_user'): Promise<{ isShortlisted: boolean; propertyIds: string[] }> {
    const current = await this.getShortlist(userId);
    const index = current.indexOf(propertyId);
    let isShortlisted = false;
    let updated: string[];

    if (index >= 0) {
      updated = current.filter(id => id !== propertyId);
      isShortlisted = false;
    } else {
      updated = [...current, propertyId];
      isShortlisted = true;
    }

    await this.setShortlist(updated, userId);
    return { isShortlisted, propertyIds: updated };
  }

  async clearShortlist(userId = 'default_user'): Promise<void> {
    await this.setShortlist([], userId);
  }
}

export const firestoreShortlistRepository = new FirestoreShortlistRepository();
