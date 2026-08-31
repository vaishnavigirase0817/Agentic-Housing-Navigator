import { Property, PropertyFilterState } from '../types';
import { INITIAL_DEMO_PROPERTIES, SIMULATED_PROPERTY_TEMPLATES } from '../data/properties';

const STORAGE_KEY = 'agentic_housing_properties_v1';
const SIM_INDEX_KEY = 'agentic_housing_sim_index_v1';

export interface IPropertyService {
  getAllProperties(): Promise<Property[]>;
  getPropertyById(id: string): Promise<Property | null>;
  filterAndSortProperties(
    properties: Property[],
    filters: PropertyFilterState,
    scores?: Record<string, number>
  ): Property[];
  simulateNewListing(): Promise<Property>;
  resetToInitialDemoData(): Promise<Property[]>;
}

class PropertyServiceImpl implements IPropertyService {
  private properties: Property[] = [];

  constructor() {
    this.initData();
  }

  private initData() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.properties = JSON.parse(stored);
      } else {
        this.properties = [...INITIAL_DEMO_PROPERTIES];
        this.persist();
      }
    } catch {
      this.properties = [...INITIAL_DEMO_PROPERTIES];
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.properties));
    } catch (e) {
      console.error('Failed to persist properties', e);
    }
  }

  async getAllProperties(): Promise<Property[]> {
    if (this.properties.length === 0) {
      this.initData();
    }
    return [...this.properties];
  }

  async getPropertyById(id: string): Promise<Property | null> {
    const props = await this.getAllProperties();
    return props.find((p) => p.id === id) || null;
  }

  filterAndSortProperties(
    properties: Property[],
    filters: PropertyFilterState,
    scores: Record<string, number> = {}
  ): Property[] {
    let result = properties.filter((p) => {
      // Search query (title, locality, description)
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesLoc = p.locality.toLowerCase().includes(q);
        const matchesDesc = p.description.toLowerCase().includes(q);
        if (!matchesTitle && !matchesLoc && !matchesDesc) return false;
      }

      // Property type
      if (filters.propertyType && filters.propertyType !== 'All' && filters.propertyType !== 'Any') {
        if (p.propertyType !== filters.propertyType) return false;
      }

      // Bedrooms
      if (filters.bedrooms && filters.bedrooms !== 'All' && filters.bedrooms !== 'Any') {
        if (p.bedrooms !== parseInt(filters.bedrooms, 10)) return false;
      }

      // Min / Max Rent
      if (p.monthlyRent < filters.minRent) return false;
      if (filters.maxRent > 0 && p.monthlyRent > filters.maxRent) return false;

      // Furnishing
      if (filters.furnishing && filters.furnishing !== 'All' && filters.furnishing !== 'Any') {
        if (p.furnishing !== filters.furnishing) return false;
      }

      // Distance
      if (filters.maxDistance > 0 && p.distanceKm > filters.maxDistance) return false;

      // Parking
      if (filters.parking && filters.parking !== 'All') {
        if (filters.parking === 'Covered' && p.parking !== 'Covered') return false;
        if (filters.parking === 'Any Four Wheeler' && p.parking === 'None') return false;
      }

      // Amenities
      if (filters.amenities.length > 0) {
        const hasAll = filters.amenities.every((reqAmenity) =>
          p.amenities.some((a) => a.toLowerCase().includes(reqAmenity.toLowerCase()))
        );
        if (!hasAll) return false;
      }

      // Owner Verified Only
      if (filters.ownerVerifiedOnly && !p.ownerVerified) return false;

      // Pet Friendly Only
      if (filters.petFriendlyOnly && !p.petFriendly) return false;

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (filters.sortBy === 'match_score') {
        const scoreA = scores[a.id] ?? 0;
        const scoreB = scores[b.id] ?? 0;
        return scoreB - scoreA;
      }
      if (filters.sortBy === 'rent_asc') {
        return a.monthlyRent - b.monthlyRent;
      }
      if (filters.sortBy === 'rent_desc') {
        return b.monthlyRent - a.monthlyRent;
      }
      if (filters.sortBy === 'distance_asc') {
        return a.distanceKm - b.distanceKm;
      }
      if (filters.sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });

    return result;
  }

  async simulateNewListing(): Promise<Property> {
    let simIndex = 0;
    try {
      const storedIdx = localStorage.getItem(SIM_INDEX_KEY);
      if (storedIdx) simIndex = parseInt(storedIdx, 10);
    } catch {}

    const template = SIMULATED_PROPERTY_TEMPLATES[simIndex % SIMULATED_PROPERTY_TEMPLATES.length];
    const newId = `prop-sim-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newProperty: Property = {
      id: newId,
      title: template.title || '⚡ [NEW LISTED] Modern 2BHK Near College Hub',
      propertyType: template.propertyType || 'Apartment',
      bedrooms: template.bedrooms || 2,
      bathrooms: template.bathrooms || 2,
      monthlyRent: template.monthlyRent || 13600,
      securityDeposit: template.securityDeposit || 27200,
      maintenance: template.maintenance || 1000,
      estimatedUtilities: template.estimatedUtilities || 1400,
      furnishing: template.furnishing || 'Furnished',
      locality: template.locality || 'Green Glen Layout / Near Campus Gate',
      city: 'Bengaluru',
      latitude: template.latitude || 12.926,
      longitude: template.longitude || 77.675,
      distanceKm: template.distanceKm || 0.9,
      availableFrom: template.availableFrom || new Date().toISOString().split('T')[0],
      amenities: template.amenities || [
        'Power Backup',
        'Lift',
        'Wi-Fi',
        '24/7 Security',
        'AC',
        'Modular Kitchen',
        'Geyser',
        'Balcony',
        'Covered Parking'
      ],
      floor: template.floor || 3,
      totalFloors: template.totalFloors || 5,
      parking: template.parking || 'Covered',
      ownerVerified: template.ownerVerified !== undefined ? template.ownerVerified : true,
      images: template.images || [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80'
      ],
      description: template.description || 'Freshly detected by Agent Monitoring pipeline.',
      petFriendly: template.petFriendly !== undefined ? template.petFriendly : true,
      preferredTenants: template.preferredTenants || 'Students',
      squareFeet: template.squareFeet || 980,
      source: 'simulated_feed',
      createdAt: new Date().toISOString()
    };

    // Prepend to properties list
    this.properties.unshift(newProperty);
    this.persist();

    // Increment sim index
    try {
      localStorage.setItem(SIM_INDEX_KEY, ((simIndex + 1) % SIMULATED_PROPERTY_TEMPLATES.length).toString());
    } catch {}

    return newProperty;
  }

  async resetToInitialDemoData(): Promise<Property[]> {
    this.properties = [...INITIAL_DEMO_PROPERTIES];
    this.persist();
    try {
      localStorage.removeItem(SIM_INDEX_KEY);
    } catch {}
    return [...this.properties];
  }
}

export const propertyService = new PropertyServiceImpl();
