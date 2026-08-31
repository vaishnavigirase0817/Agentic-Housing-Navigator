import { getFirestore, firestoreManager } from '../firestore/FirestoreClient';
import { Property } from '../../src/types';
import { INITIAL_DEMO_PROPERTIES } from '../../src/data/properties';

export class FirestorePropertyRepository {
  private collectionName = 'properties';
  private seeded = false;

  constructor() {
    this.seedInitialProperties();
  }

  private seedInitialProperties() {
    if (this.seeded) return;
    this.seeded = true;
    const memCol = firestoreManager.getInMemoryCollection(this.collectionName);
    for (const prop of INITIAL_DEMO_PROPERTIES) {
      if (!memCol.has(prop.id)) {
        memCol.set(prop.id, prop);
      }
    }
  }

  async getProperty(id: string): Promise<Property | null> {
    const firestore = getFirestore();
    if (firestore && firestoreManager.isUsingCloud()) {
      try {
        const doc = await firestore.collection(this.collectionName).doc(id).get();
        if (doc.exists) {
          return doc.data() as Property;
        }
      } catch (e) {
        firestoreManager.markCloudUnavailable(e);
      }
    }

    const memCol = firestoreManager.getInMemoryCollection(this.collectionName);
    return memCol.get(id) || null;
  }

  async getAllProperties(): Promise<Property[]> {
    const firestore = getFirestore();
    if (firestore && firestoreManager.isUsingCloud()) {
      try {
        const snapshot = await firestore.collection(this.collectionName).get();
        if (!snapshot.empty) {
          return snapshot.docs.map(doc => doc.data() as Property);
        }
      } catch (e) {
        firestoreManager.markCloudUnavailable(e);
      }
    }

    const memCol = firestoreManager.getInMemoryCollection(this.collectionName);
    return Array.from(memCol.values()) as Property[];
  }

  async saveProperty(property: Property): Promise<Property> {
    const firestore = getFirestore();
    if (firestore && firestoreManager.isUsingCloud()) {
      try {
        await firestore.collection(this.collectionName).doc(property.id).set(property, { merge: true });
      } catch (e) {
        firestoreManager.markCloudUnavailable(e);
      }
    }

    const memCol = firestoreManager.getInMemoryCollection(this.collectionName);
    memCol.set(property.id, property);
    return property;
  }

  async deleteProperty(id: string): Promise<void> {
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
}

export const firestorePropertyRepository = new FirestorePropertyRepository();
