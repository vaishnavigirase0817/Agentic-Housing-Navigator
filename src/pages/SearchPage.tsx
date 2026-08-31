import React, { useState, useMemo } from 'react';
import { AppRoute, Property, PropertyFilterState, MatchEvaluation } from '../types';
import { PropertyCard } from '../components/PropertyCard';
import { propertyService } from '../services/propertyService';
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  LayoutGrid,
  List,
  MapPin,
  Building2,
  BedDouble,
  DollarSign,
  ShieldCheck,
  Sparkles,
  Layers,
  Database
} from 'lucide-react';

interface SearchPageProps {
  onNavigate: (route: AppRoute) => void;
  properties: Property[];
  scores: Record<string, MatchEvaluation>;
  shortlist: string[];
  onToggleShortlist: (id: string) => void;
  onViewDetails: (id: string) => void;
}

const DEFAULT_FILTERS: PropertyFilterState = {
  searchQuery: '',
  propertyType: 'All',
  bedrooms: 'All',
  minRent: 0,
  maxRent: 40000,
  maxDistance: 10,
  furnishing: 'All',
  parking: 'All',
  amenities: [],
  ownerVerifiedOnly: false,
  petFriendlyOnly: false,
  sortBy: 'match_score'
};

export const SearchPage: React.FC<SearchPageProps> = ({
  onNavigate,
  properties,
  scores,
  shortlist,
  onToggleShortlist,
  onViewDetails
}) => {
  const [filters, setFilters] = useState<PropertyFilterState>(DEFAULT_FILTERS);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const availableAmenities = [
    'Power Backup',
    'Lift',
    'Wi-Fi',
    '24/7 Security',
    'Modular Kitchen',
    'AC',
    'Covered Parking',
    'Geyser',
    'Balcony',
    'Gym'
  ];

  const filteredProperties = useMemo(() => {
    const scoreMap: Record<string, number> = {};
    for (const key of Object.keys(scores)) {
      const item = scores[key];
      if (item && typeof item.totalScore === 'number') {
        scoreMap[key] = item.totalScore;
      }
    }
    return propertyService.filterAndSortProperties(
      properties,
      filters,
      scoreMap
    );
  }, [properties, filters, scores]);

  const handleToggleAmenity = (am: string) => {
    if (filters.amenities.includes(am)) {
      setFilters({ ...filters, amenities: filters.amenities.filter((a) => a !== am) });
    } else {
      setFilters({ ...filters, amenities: [...filters.amenities, am] });
    }
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  return (
    <div id="search-page" className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Property Search
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono font-semibold">
              {filteredProperties.length} of {properties.length} Listings
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Filter by budget, proximity, furnishing, or multi-factor match score
          </p>
        </div>

        {/* Controls (Search input + Sort + View toggle) */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Quick Search */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-properties"
              type="text"
              value={filters.searchQuery}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              placeholder="Search locality, title..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-indigo-500 shadow-xs"
            />
          </div>

          {/* Sort By Dropdown */}
          <select
            id="select-sort-by"
            value={filters.sortBy}
            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
            className="py-2 px-3 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold shadow-xs"
          >
            <option value="match_score">Sort: Match Score (High to Low)</option>
            <option value="rent_asc">Sort: Rent (Low to High)</option>
            <option value="rent_desc">Sort: Rent (High to Low)</option>
            <option value="distance_asc">Sort: Distance (Closest First)</option>
            <option value="newest">Sort: Newly Listed</option>
          </select>

          {/* Mobile Filters Toggle Button */}
          <button
            type="button"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="md:hidden p-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:text-slate-900 shadow-xs"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        {/* Quick Row: Property Type, Bedrooms, Furnishing, Max Rent */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
          {/* Property Type */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold text-slate-600 uppercase">Property Type</label>
            <select
              value={filters.propertyType}
              onChange={(e) => setFilters({ ...filters, propertyType: e.target.value })}
              className="w-full p-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Types</option>
              <option value="Apartment">Apartment</option>
              <option value="Studio">Studio</option>
              <option value="Independent House">Independent House</option>
              <option value="Villa">Villa</option>
              <option value="Gated Community">Gated Community</option>
              <option value="PG / Co-living">PG / Co-living</option>
            </select>
          </div>

          {/* Bedrooms */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold text-slate-600 uppercase">Bedrooms</label>
            <select
              value={filters.bedrooms}
              onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })}
              className="w-full p-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All BHK</option>
              <option value="1">1 BHK</option>
              <option value="2">2 BHK</option>
              <option value="3">3 BHK</option>
              <option value="4">4 BHK</option>
            </select>
          </div>

          {/* Furnishing */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold text-slate-600 uppercase">Furnishing</label>
            <select
              value={filters.furnishing}
              onChange={(e) => setFilters({ ...filters, furnishing: e.target.value })}
              className="w-full p-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Furnishing</option>
              <option value="Furnished">Furnished</option>
              <option value="Semi-Furnished">Semi-Furnished</option>
              <option value="Unfurnished">Unfurnished</option>
            </select>
          </div>

          {/* Max Rent */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-slate-700">
              <span className="font-bold">MAX RENT</span>
              <span className="text-indigo-700 font-bold">₹{filters.maxRent.toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range"
              min={6000}
              max={40000}
              step={1000}
              value={filters.maxRent}
              onChange={(e) => setFilters({ ...filters, maxRent: Number(e.target.value) })}
              className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          {/* Max Distance */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-slate-700">
              <span className="font-bold">MAX DISTANCE</span>
              <span className="text-indigo-700 font-bold">≤ {filters.maxDistance} km</span>
            </div>
            <input
              type="range"
              min={1}
              max={15}
              step={1}
              value={filters.maxDistance}
              onChange={(e) => setFilters({ ...filters, maxDistance: Number(e.target.value) })}
              className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          {/* Verification & Reset */}
          <div className="flex items-end gap-2">
            <label className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 border border-slate-300 cursor-pointer text-xs text-slate-700 w-full hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={filters.ownerVerifiedOnly}
                onChange={(e) => setFilters({ ...filters, ownerVerifiedOnly: e.target.checked })}
                className="w-3.5 h-3.5 accent-indigo-600 rounded"
              />
              <span className="text-[11px] font-semibold">Verified Only</span>
            </label>

            <button
              type="button"
              onClick={handleResetFilters}
              className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-300 transition-colors shrink-0 cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Amenities Bar */}
        <div className="pt-3 border-t border-slate-200 flex items-center gap-2 flex-wrap text-xs">
          <span className="text-[10px] font-mono font-bold text-slate-600 uppercase mr-1">Must-Have Amenities:</span>
          {availableAmenities.map((am) => {
            const isSel = filters.amenities.includes(am);
            return (
              <button
                key={am}
                type="button"
                onClick={() => handleToggleAmenity(am)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors cursor-pointer ${
                  isSel
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-800 font-semibold'
                    : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {am}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Results Grid */}
      {filteredProperties.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              evaluation={scores[property.id]}
              isShortlisted={shortlist.includes(property.id)}
              onToggleShortlist={onToggleShortlist}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <Database className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No Properties Match Filter Criteria</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try adjusting your maximum rent range, distance radius, or unchecking specific amenity constraints.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      )}
    </div>
  );
};
