import { getFirestore, firestoreManager } from '../firestore/FirestoreClient';
import { SavedPreferences } from '../../src/types';

export const DEFAULT_USER_PREFERENCES: SavedPreferences = {
  maxBudget: 15000,
  minBudget: 8000,
  preferredPropertyType: 'Apartment',
  preferredFurnishing: 'Furnished',
  preferredDistanceKm: 3.0,
  avoidGroundFloor: true,
  parkingRequired: true,
  preferredAmenities: ['Power Backup', 'Lift', 'Wi-Fi', '24/7 Security', 'Modular Kitchen'],
  targetLocality: 'Near College Campus / Tech Park Corridor',
  petFriendly: false,
  updatedAt: new Date().toISOString()
};

export class FirestoreMemoryRepository {
  private collectionName = 'preferences';

  /**
   * Retrieves long-term memory preferences for a given user
   */
  async getPreferences(userId = 'default_user'): Promise<SavedPreferences> {
    const firestore = getFirestore();
    if (firestore && firestoreManager.isUsingCloud()) {
      try {
        const doc = await firestore.collection(this.collectionName).doc(userId).get();
        if (doc.exists) {
          const data = doc.data();
          return {
            ...DEFAULT_USER_PREFERENCES,
            ...data
          } as SavedPreferences;
        }
      } catch (e) {
        firestoreManager.markCloudUnavailable(e);
      }
    }

    const memCol = firestoreManager.getInMemoryCollection(this.collectionName);
    const existing = memCol.get(userId);
    if (existing) {
      return { ...DEFAULT_USER_PREFERENCES, ...existing };
    }

    // Default initialization
    const initial = { ...DEFAULT_USER_PREFERENCES, updatedAt: new Date().toISOString() };
    memCol.set(userId, initial);
    return initial;
  }

  /**
   * Saves or updates persistent memory preferences in Firestore
   */
  async savePreferences(prefs: Partial<SavedPreferences>, userId = 'default_user'): Promise<SavedPreferences> {
    const current = await this.getPreferences(userId);
    const updated: SavedPreferences = {
      ...current,
      ...prefs,
      updatedAt: new Date().toISOString()
    };

    const firestore = getFirestore();
    if (firestore && firestoreManager.isUsingCloud()) {
      try {
        await firestore
          .collection(this.collectionName)
          .doc(userId)
          .set(updated, { merge: true });
      } catch (e) {
        firestoreManager.markCloudUnavailable(e);
      }
    }

    const memCol = firestoreManager.getInMemoryCollection(this.collectionName);
    memCol.set(userId, updated);
    return updated;
  }

  /**
   * Extracts implicit or explicit preference memories from user query text and persists to Firestore
   */
  async extractAndPersistMemoryFromText(queryText: string, userId = 'default_user'): Promise<{
    updatedPreferences: SavedPreferences;
    appliedMemories: string[];
  }> {
    const current = await this.getPreferences(userId);
    const lower = queryText.toLowerCase();
    const updates: Partial<SavedPreferences> = {};
    const appliedMemories: string[] = [];

    // Check "avoid ground floor" or "no ground floor"
    if (
      lower.includes("don't want ground") ||
      lower.includes("no ground") ||
      lower.includes("avoid ground") ||
      lower.includes("not on ground") ||
      lower.includes("upper floor") ||
      lower.includes("higher floor")
    ) {
      updates.avoidGroundFloor = true;
      appliedMemories.push('Avoid ground floor');
    } else if (lower.includes("ground floor is fine") || lower.includes("ground floor ok")) {
      updates.avoidGroundFloor = false;
    } else if (current.avoidGroundFloor) {
      appliedMemories.push('Avoid ground floor (from saved memory)');
    }

    // Check parking requirement
    if (lower.includes("must have parking") || lower.includes("need car parking") || lower.includes("need parking")) {
      updates.parkingRequired = true;
      appliedMemories.push('Parking required');
    }

    // Check pet friendly
    if (lower.includes("pet friendly") || lower.includes("have a dog") || lower.includes("have a cat") || lower.includes("with pets")) {
      updates.petFriendly = true;
      appliedMemories.push('Pet friendly unit');
    }

    // Check furnishing
    if (lower.includes("fully furnished") || (lower.includes("furnished") && !lower.includes("unfurnished") && !lower.includes("semi"))) {
      updates.preferredFurnishing = 'Furnished';
      appliedMemories.push('Furnished apartment');
    } else if (lower.includes("semi-furnished") || lower.includes("semi furnished")) {
      updates.preferredFurnishing = 'Semi-Furnished';
      appliedMemories.push('Semi-Furnished apartment');
    }

    // Check budget extraction
    const kMatch = lower.match(/(?:under|below|max|budget|upto)\s*(?:₹|rs\.?|inr)?\s*(\d+)\s*k\b/i);
    const numMatch = lower.match(/(?:under|below|max|budget|upto)\s*(?:₹|rs\.?|inr)?\s*(\d{4,6})\b/i);
    if (kMatch && kMatch[1]) {
      const budget = parseInt(kMatch[1], 10) * 1000;
      updates.maxBudget = budget;
      appliedMemories.push(`Max Budget ₹${budget.toLocaleString('en-IN')}`);
    } else if (numMatch && numMatch[1]) {
      const budget = parseInt(numMatch[1], 10);
      updates.maxBudget = budget;
      appliedMemories.push(`Max Budget ₹${budget.toLocaleString('en-IN')}`);
    }

    let saved = current;
    if (Object.keys(updates).length > 0) {
      saved = await this.savePreferences(updates, userId);
    }

    return {
      updatedPreferences: saved,
      appliedMemories: Array.from(new Set(appliedMemories))
    };
  }

  /**
   * Resets preferences to defaults
   */
  async resetPreferences(userId = 'default_user'): Promise<SavedPreferences> {
    const initial = { ...DEFAULT_USER_PREFERENCES, updatedAt: new Date().toISOString() };
    const firestore = getFirestore();
    if (firestore && firestoreManager.isUsingCloud()) {
      try {
        await firestore.collection(this.collectionName).doc(userId).set(initial);
      } catch (e) {
        firestoreManager.markCloudUnavailable(e);
      }
    }

    const memCol = firestoreManager.getInMemoryCollection(this.collectionName);
    memCol.set(userId, initial);
    return initial;
  }
}

export const firestoreMemoryRepository = new FirestoreMemoryRepository();
