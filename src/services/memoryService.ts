import { SavedPreferences } from '../types';

const MEMORY_STORAGE_KEY = 'agentic_housing_preferences_v1';

export const DEFAULT_PREFERENCES: SavedPreferences = {
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

export interface IMemoryService {
  getPreferences(): Promise<SavedPreferences>;
  savePreferences(prefs: Partial<SavedPreferences>): Promise<SavedPreferences>;
  resetPreferences(): Promise<SavedPreferences>;
}

class MemoryServiceImpl implements IMemoryService {
  private preferences: SavedPreferences = DEFAULT_PREFERENCES;
  private isLoadedFromBackend = false;

  constructor() {
    this.loadFromLocalStorage();
    this.syncFromBackend();
  }

  private loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem(MEMORY_STORAGE_KEY);
      if (stored) {
        this.preferences = { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      } else {
        this.preferences = { ...DEFAULT_PREFERENCES };
      }
    } catch {
      this.preferences = { ...DEFAULT_PREFERENCES };
    }
  }

  private persistLocal() {
    try {
      localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(this.preferences));
    } catch (e) {
      console.error('Failed to persist memory preferences locally', e);
    }
  }

  private async syncFromBackend(): Promise<void> {
    try {
      const res = await fetch('/api/preferences');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          this.preferences = { ...DEFAULT_PREFERENCES, ...json.data };
          this.persistLocal();
          this.isLoadedFromBackend = true;
        }
      }
    } catch (err) {
      console.warn('[MemoryService] Backend sync deferred:', err);
    }
  }

  async getPreferences(): Promise<SavedPreferences> {
    if (!this.isLoadedFromBackend) {
      await this.syncFromBackend();
    }
    return { ...this.preferences };
  }

  async savePreferences(prefs: Partial<SavedPreferences>): Promise<SavedPreferences> {
    this.preferences = {
      ...this.preferences,
      ...prefs,
      updatedAt: new Date().toISOString()
    };
    this.persistLocal();

    try {
      const res = await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.preferences)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          this.preferences = { ...DEFAULT_PREFERENCES, ...json.data };
          this.persistLocal();
        }
      }
    } catch (err) {
      console.warn('[MemoryService] Backend save deferred, saved locally:', err);
    }

    return { ...this.preferences };
  }

  async resetPreferences(): Promise<SavedPreferences> {
    this.preferences = { ...DEFAULT_PREFERENCES, updatedAt: new Date().toISOString() };
    this.persistLocal();

    try {
      const res = await fetch('/api/preferences/reset', { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          this.preferences = { ...DEFAULT_PREFERENCES, ...json.data };
          this.persistLocal();
        }
      }
    } catch (err) {
      console.warn('[MemoryService] Backend reset deferred:', err);
    }

    return { ...this.preferences };
  }
}

export const memoryService = new MemoryServiceImpl();
