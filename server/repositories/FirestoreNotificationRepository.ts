import { getFirestore, firestoreManager } from '../firestore/FirestoreClient';
import { AppNotification } from '../../src/types';

export class FirestoreNotificationRepository {
  private collectionName = 'notifications';

  async getNotifications(userId = 'default_user'): Promise<AppNotification[]> {
    const firestore = getFirestore();
    if (firestore && firestoreManager.isUsingCloud()) {
      try {
        const snapshot = await firestore
          .collection(this.collectionName)
          .where('userId', '==', userId)
          .orderBy('timestamp', 'desc')
          .limit(100)
          .get();

        return snapshot.docs.map(doc => doc.data() as AppNotification);
      } catch (e) {
        firestoreManager.markCloudUnavailable(e);
      }
    }

    const memCol = firestoreManager.getInMemoryCollection(this.collectionName);
    const all = Array.from(memCol.values()) as AppNotification[];
    const userNotifs = all.filter(n => (n as any).userId === userId || !(n as any).userId);
    userNotifs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return userNotifs;
  }

  async addNotification(
    item: Omit<AppNotification, 'id' | 'timestamp' | 'read'> & { read?: boolean },
    userId = 'default_user'
  ): Promise<AppNotification> {
    const notif: AppNotification = {
      ...item,
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      read: item.read ?? false
    };

    const docData = { ...notif, userId };

    const firestore = getFirestore();
    if (firestore && firestoreManager.isUsingCloud()) {
      try {
        await firestore.collection(this.collectionName).doc(notif.id).set(docData);
      } catch (e) {
        firestoreManager.markCloudUnavailable(e);
      }
    }

    const memCol = firestoreManager.getInMemoryCollection(this.collectionName);
    memCol.set(notif.id, docData);
    return notif;
  }

  async markAsRead(id: string, userId = 'default_user'): Promise<void> {
    const firestore = getFirestore();
    if (firestore && firestoreManager.isUsingCloud()) {
      try {
        await firestore.collection(this.collectionName).doc(id).update({ read: true });
      } catch (e) {
        firestoreManager.markCloudUnavailable(e);
      }
    }

    const memCol = firestoreManager.getInMemoryCollection(this.collectionName);
    const existing = memCol.get(id);
    if (existing) {
      memCol.set(id, { ...existing, read: true });
    }
  }

  async markAllAsRead(userId = 'default_user'): Promise<void> {
    const firestore = getFirestore();
    if (firestore && firestoreManager.isUsingCloud()) {
      try {
        const snapshot = await firestore
          .collection(this.collectionName)
          .where('userId', '==', userId)
          .where('read', '==', false)
          .get();

        const batch = firestore.batch();
        snapshot.docs.forEach(doc => batch.update(doc.ref, { read: true }));
        await batch.commit();
      } catch (e) {
        firestoreManager.markCloudUnavailable(e);
      }
    }

    const memCol = firestoreManager.getInMemoryCollection(this.collectionName);
    for (const [key, val] of memCol.entries()) {
      if ((val as any).userId === userId || !(val as any).userId) {
        memCol.set(key, { ...val, read: true });
      }
    }
  }

  async clearAll(userId = 'default_user'): Promise<void> {
    const firestore = getFirestore();
    if (firestore && firestoreManager.isUsingCloud()) {
      try {
        const snapshot = await firestore
          .collection(this.collectionName)
          .where('userId', '==', userId)
          .get();

        const batch = firestore.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      } catch (e) {
        firestoreManager.markCloudUnavailable(e);
      }
    }

    const memCol = firestoreManager.getInMemoryCollection(this.collectionName);
    for (const [key, val] of Array.from(memCol.entries())) {
      if ((val as any).userId === userId || !(val as any).userId) {
        memCol.delete(key);
      }
    }
  }
}

export const firestoreNotificationRepository = new FirestoreNotificationRepository();
