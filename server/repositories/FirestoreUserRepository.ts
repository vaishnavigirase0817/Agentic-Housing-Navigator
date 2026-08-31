import { getFirestore, firestoreManager } from '../firestore/FirestoreClient';
import { UserProfile } from '../../src/types';

export class FirestoreUserRepository {
  private collectionName = 'users';

  async getUser(userId = 'user-vaishnavi-student'): Promise<UserProfile> {
    const firestore = getFirestore();
    if (firestore && firestoreManager.isUsingCloud()) {
      try {
        const doc = await firestore.collection(this.collectionName).doc(userId).get();
        if (doc.exists) {
          return doc.data() as UserProfile;
        }
      } catch (e) {
        firestoreManager.markCloudUnavailable(e);
      }
    }

    const memCol = firestoreManager.getInMemoryCollection(this.collectionName);
    let user = memCol.get(userId);
    if (!user) {
      user = {
        id: userId,
        name: userId.includes('rohan') ? 'Rohan Mehta' : userId.includes('priya') ? 'Priya Sharma' : 'Vaishnavi Girase',
        email: userId.includes('rohan') ? 'rohan.mehta.tech@example.com' : userId.includes('priya') ? 'priya.sharma@example.com' : 'girasevaishnavi28@gmail.com',
        phone: '+91 98765 43210',
        city: userId.includes('rohan') ? 'Pune' : userId.includes('priya') ? 'Mumbai' : 'Bengaluru',
        occupation: userId.includes('rohan') ? 'Senior Backend Engineer' : userId.includes('priya') ? 'Architect & Parent' : 'Graduate CS Student',
        personaType: userId.includes('rohan') ? 'professional' : userId.includes('priya') ? 'family' : 'student',
        avatarUrl: userId.includes('rohan') 
          ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
          : userId.includes('priya')
          ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        preferredCurrency: 'INR (₹)',
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
      };
      memCol.set(userId, user);
    }
    return user;
  }

  async updateUser(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    const current = await this.getUser(userId);
    const updated: UserProfile = {
      ...current,
      ...data,
      lastActive: new Date().toISOString()
    };

    const firestore = getFirestore();
    if (firestore && firestoreManager.isUsingCloud()) {
      try {
        await firestore.collection(this.collectionName).doc(userId).set(updated, { merge: true });
      } catch (e) {
        firestoreManager.markCloudUnavailable(e);
      }
    }

    const memCol = firestoreManager.getInMemoryCollection(this.collectionName);
    memCol.set(userId, updated);
    return updated;
  }

  async getAllUsers(): Promise<UserProfile[]> {
    const firestore = getFirestore();
    if (firestore && firestoreManager.isUsingCloud()) {
      try {
        const snapshot = await firestore.collection(this.collectionName).get();
        if (!snapshot.empty) {
          return snapshot.docs.map(doc => doc.data() as UserProfile);
        }
      } catch (e) {
        firestoreManager.markCloudUnavailable(e);
      }
    }

    const memCol = firestoreManager.getInMemoryCollection(this.collectionName);
    return Array.from(memCol.values()) as UserProfile[];
  }
}

export const firestoreUserRepository = new FirestoreUserRepository();

