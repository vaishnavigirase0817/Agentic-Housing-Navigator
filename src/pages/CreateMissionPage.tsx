import React, { useState, useEffect } from 'react';
import { AppRoute, MissionRequirements, SavedPreferences } from '../types';
import {
  Sparkles,
  ArrowRight,
  Brain,
  SlidersHorizontal,
  MapPin,
  Building2,
  BedDouble,
  DollarSign,
  ShieldCheck,
  Check,
  RotateCcw,
  Loader2,
  Layers
} from 'lucide-react';
import { missionService } from '../services/missionService';
import { memoryService } from '../services/memoryService';

interface CreateMissionPageProps {
  onNavigate: (route: AppRoute) => void;
  onLaunchMission: (req: MissionRequirements) => Promise<void>;
  isLaunching: boolean;
}

export const CreateMissionPage: React.FC<CreateMissionPageProps> = ({
  onNavigate,
  onLaunchMission,
  isLaunching
}) => {
  const [inputMode, setInputMode] = useState<'natural' | 'structured'>('natural');
  const [naturalQuery, setNaturalQuery] = useState(
    'Find me a furnished 2BHK under ₹15,000 within 3 km of my college campus, preferably not on ground floor, with parking, available next month.'
  );

  const [isParsing, setIsParsing] = useState(false);
  const [parsedRequirements, setParsedRequirements] = useState<MissionRequirements | null>(null);
  const [loadedPreferences, setLoadedPreferences] = useState<SavedPreferences | null>(null);

  // Structured form state
  const [propertyType, setPropertyType] = useState('Apartment');
  const [bedrooms, setBedrooms] = useState<number | 'Any'>(2);
  const [maxBudget, setMaxBudget] = useState(15000);
  const [minBudget, setMinBudget] = useState(8000);
  const [targetLocation, setTargetLocation] = useState('Near College Campus');
  const [maxDistanceKm, setMaxDistanceKm] = useState(3.0);
  const [furnishing, setFurnishing] = useState<'Furnished' | 'Semi-Furnished' | 'Unfurnished' | 'Any'>('Furnished');
  const [moveInDate, setMoveInDate] = useState('Next Month (1st-5th)');
  const [avoidGroundFloor, setAvoidGroundFloor] = useState(true);
  const [parkingRequired, setParkingRequired] = useState(true);
  const [petFriendlyRequired, setPetFriendlyRequired] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'Power Backup',
    'Lift',
    'Wi-Fi',
    '24/7 Security',
    'Modular Kitchen'
  ]);

  const examplePrompts = [
    'Find me a furnished 2BHK under ₹15,000 within 3 km of my college, available next month.',
    'Looking for a 1BHK apartment under ₹12,000 near Koramangala tech hub with power backup & lift.',
    '3BHK gated community flat under ₹25k near Bellandur with covered parking and high floor.'
  ];

  const availableAmenities = [
    'Power Backup',
    'Lift',
    'Wi-Fi',
    '24/7 Security',
    'Modular Kitchen',
    'Covered Parking',
    'AC',
    'Geyser',
    'Balcony',
    'Gym',
    'Swimming Pool'
  ];

  // Load saved preferences into defaults
  useEffect(() => {
    memoryService.getPreferences().then((prefs) => {
      if (prefs) {
        setLoadedPreferences(prefs);
        setMaxBudget(prefs.maxBudget);
        setMinBudget(prefs.minBudget);
        setPropertyType(prefs.preferredPropertyType);
        setFurnishing(prefs.preferredFurnishing as any);
        setMaxDistanceKm(prefs.preferredDistanceKm);
        setAvoidGroundFloor(prefs.avoidGroundFloor);
        setParkingRequired(prefs.parkingRequired);
        setSelectedAmenities(prefs.preferredAmenities);
        setTargetLocation(prefs.targetLocality);
      }
    });
  }, []);

  const handleParseNaturalLanguage = async () => {
    if (!naturalQuery.trim()) return;
    setIsParsing(true);
    try {
      const parsed = await missionService.parseNaturalLanguage(naturalQuery);
      setParsedRequirements(parsed);
      
      // Also sync structured inputs with parsed values
      setPropertyType(parsed.propertyType);
      setBedrooms(parsed.bedrooms);
      setMaxBudget(parsed.maxBudget);
      setMinBudget(parsed.minBudget || Math.round(parsed.maxBudget * 0.6));
      setTargetLocation(parsed.targetLocation);
      setMaxDistanceKm(parsed.maxDistanceKm);
      setFurnishing(parsed.furnishing);
      setAvoidGroundFloor(parsed.avoidGroundFloor || false);
      setParkingRequired(parsed.parkingRequired || false);
      if (parsed.preferredAmenities && parsed.preferredAmenities.length > 0) {
        setSelectedAmenities(parsed.preferredAmenities);
      }
    } catch (e) {
      console.error('Failed to parse query', e);
    } finally {
      setIsParsing(false);
    }
  };

  const handleToggleAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter((a) => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  const handleStartMissionFromStructured = () => {
    const req: MissionRequirements = {
      rawQuery: naturalQuery,
      propertyType,
      bedrooms,
      maxBudget,
      minBudget,
      targetLocation,
      maxDistanceKm,
      furnishing,
      moveInDate,
      preferredAmenities: selectedAmenities,
      parkingRequired,
      preferredFloor: avoidGroundFloor ? 'Avoid Ground' : 'Any',
      avoidGroundFloor,
      petFriendlyRequired,
      additionalNotes: 'Configured via interactive mission builder'
    };

    onLaunchMission(req);
  };

  return (
    <div id="create-mission-page" className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-mono font-medium">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>AUTONOMOUS AGENT WORKFLOW</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
          Create Housing Mission
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
          Specify your constraints in natural language or use structured controls. Your agent will parse, evaluate, and rank properties.
        </p>
      </div>

      {/* Input Mode Switcher */}
      <div className="flex justify-center">
        <div className="p-1 rounded-xl bg-slate-100 border border-slate-200 flex items-center gap-1 text-xs font-medium">
          <button
            id="tab-mode-natural"
            type="button"
            onClick={() => setInputMode('natural')}
            className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              inputMode === 'natural'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Natural Language</span>
          </button>

          <button
            id="tab-mode-structured"
            type="button"
            onClick={() => setInputMode('structured')}
            className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              inputMode === 'structured'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Structured Builder</span>
          </button>
        </div>
      </div>

      {/* Natural Language Input Mode */}
      {inputMode === 'natural' && (
        <div className="space-y-6">
          {loadedPreferences && (loadedPreferences.avoidGroundFloor || (loadedPreferences.memoryNotes && loadedPreferences.memoryNotes.length > 0)) && (
            <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200 flex items-start gap-2.5 text-xs text-indigo-900 animate-in fade-in shadow-xs">
              <Brain className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-indigo-900 block font-mono text-[11px] uppercase tracking-wider">
                  Agent Memory Applied:
                </span>
                <span className="text-slate-700 font-medium">
                  {loadedPreferences.avoidGroundFloor ? 'Avoid ground floor' : ''}
                  {loadedPreferences.avoidGroundFloor && loadedPreferences.memoryNotes && loadedPreferences.memoryNotes.length > 0 ? ' • ' : ''}
                  {(loadedPreferences.memoryNotes || []).join(' • ')}
                </span>
              </div>
            </div>
          )}

          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
            <label className="block text-xs font-mono font-bold text-indigo-700 uppercase tracking-wider">
              Describe What You Are Looking For
            </label>

            <textarea
              id="input-natural-query"
              rows={4}
              value={naturalQuery}
              onChange={(e) => setNaturalQuery(e.target.value)}
              placeholder="E.g. Find me a furnished 2BHK under ₹15,000 within 3 km of my college, available next month."
              className="w-full p-4 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
            />

            {/* Example Prompt Chips */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono text-slate-500 font-medium">TRY THESE EXAMPLES:</span>
              <div className="flex flex-wrap gap-2">
                {examplePrompts.map((prompt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setNaturalQuery(prompt);
                    }}
                    className="text-left text-xs p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>

            {/* Parse Action Button */}
            <div className="flex justify-end pt-2">
              <button
                id="btn-parse-query"
                type="button"
                onClick={handleParseNaturalLanguage}
                disabled={isParsing || !naturalQuery.trim()}
                className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gemini is understanding mission...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Analyze & Extract Requirements</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Interpreted Requirements Preview Card (If parsed) */}
          {parsedRequirements && (
            <div className="p-6 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-4 shadow-sm animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-indigo-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Interpreted Mission Parameters
                    </h3>
                    <p className="text-[11px] font-mono text-indigo-700">
                      Extracted via {parsedRequirements.parserType === 'gemini_3.7_flash' ? 'Gemini 3.7 Flash' : 'Agent Parser Engine'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setInputMode('structured')}
                  className="text-xs text-indigo-700 hover:text-indigo-900 font-semibold font-mono cursor-pointer"
                >
                  Edit Values in Structured Mode →
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-indigo-100 shadow-sm space-y-0.5">
                  <span className="text-[10px] font-mono text-slate-500">BUDGET CAP</span>
                  <p className="font-bold text-slate-900 font-mono">
                    ₹{parsedRequirements.maxBudget.toLocaleString('en-IN')}/mo
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-indigo-100 shadow-sm space-y-0.5">
                  <span className="text-[10px] font-mono text-slate-500">DISTANCE LIMIT</span>
                  <p className="font-bold text-slate-900 font-mono">
                    ≤ {parsedRequirements.maxDistanceKm} km
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-indigo-100 shadow-sm space-y-0.5">
                  <span className="text-[10px] font-mono text-slate-500">LAYOUT</span>
                  <p className="font-bold text-slate-900">
                    {parsedRequirements.bedrooms}BHK {parsedRequirements.propertyType}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-indigo-100 shadow-sm space-y-0.5">
                  <span className="text-[10px] font-mono text-slate-500">FURNISHING</span>
                  <p className="font-bold text-slate-900">{parsedRequirements.furnishing}</p>
                </div>
              </div>

              {parsedRequirements.preferredAmenities && (
                <div className="text-xs space-y-1">
                  <span className="text-[11px] font-mono text-slate-500 font-medium">EXTRACTED AMENITIES:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {parsedRequirements.preferredAmenities.map((am, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-indigo-100 border border-indigo-200 text-indigo-800 text-[11px] font-medium"
                      >
                        {am}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {parsedRequirements.appliedMemoryNotes && parsedRequirements.appliedMemoryNotes.length > 0 && (
                <div className="p-3 rounded-xl bg-white border border-indigo-200 flex items-center gap-2.5 text-xs text-indigo-900 shadow-xs">
                  <Brain className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <strong className="font-bold text-indigo-800 font-mono text-[11px] uppercase tracking-wider mr-1.5">
                      Agent Memory Applied:
                    </strong>
                    <span className="text-slate-800 font-semibold">
                      {parsedRequirements.appliedMemoryNotes.join(' • ')}
                    </span>
                  </div>
                </div>
              )}

              {/* Start Mission Button */}
              <div className="pt-3 border-t border-indigo-200 flex justify-end">
                <button
                  id="btn-launch-parsed-mission"
                  type="button"
                  onClick={() => onLaunchMission(parsedRequirements)}
                  disabled={isLaunching}
                  className="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLaunching ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Executing Workflow Stages...</span>
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4 text-white" />
                      <span>Start Mission with These Parameters</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Structured Builder Input Mode */}
      {inputMode === 'structured' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-6 shadow-sm">
          {/* Row 1: Property Type & Bedrooms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold text-slate-700">
                PROPERTY TYPE
              </label>
              <select
                id="select-property-type"
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="Apartment">Apartment</option>
                <option value="Studio">Studio Apartment</option>
                <option value="Independent House">Independent House</option>
                <option value="Villa">Villa / Row House</option>
                <option value="Gated Community">Gated Community Flat</option>
                <option value="PG / Co-living">PG / Co-living</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold text-slate-700">
                BEDROOMS (BHK)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((bhk) => (
                  <button
                    key={bhk}
                    type="button"
                    onClick={() => setBedrooms(bhk)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      bedrooms === bhk
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {bhk} BHK
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Budget & Distance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-slate-700">
                <span className="font-bold">MAX MONTHLY RENT</span>
                <span className="text-indigo-700 font-bold">₹{maxBudget.toLocaleString('en-IN')}/mo</span>
              </div>
              <input
                id="range-max-budget"
                type="range"
                min={6000}
                max={40000}
                step={500}
                value={maxBudget}
                onChange={(e) => setMaxBudget(Number(e.target.value))}
                className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>₹6,000</span>
                <span>₹20,000</span>
                <span>₹40,000</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-slate-700">
                <span className="font-bold">MAX DISTANCE FROM CAMPUS</span>
                <span className="text-indigo-700 font-bold">≤ {maxDistanceKm} km</span>
              </div>
              <input
                id="range-max-distance"
                type="range"
                min={0.5}
                max={10.0}
                step={0.5}
                value={maxDistanceKm}
                onChange={(e) => setMaxDistanceKm(Number(e.target.value))}
                className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0.5 km</span>
                <span>3.0 km</span>
                <span>10.0 km</span>
              </div>
            </div>
          </div>

          {/* Row 3: Furnishing & Target Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold text-slate-700">
                FURNISHING
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Furnished', 'Semi-Furnished', 'Unfurnished'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFurnishing(f)}
                    className={`py-2 px-2 text-[11px] font-semibold rounded-lg border transition-colors cursor-pointer ${
                      furnishing === f
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold text-slate-700">
                TARGET LOCALITY / CAMPUS
              </label>
              <input
                id="input-target-location"
                type="text"
                value={targetLocation}
                onChange={(e) => setTargetLocation(e.target.value)}
                placeholder="E.g. Near College Campus / Koramangala"
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Row 4: Key Amenities Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-bold text-slate-700">
              PREFERRED AMENITIES
            </label>
            <div className="flex flex-wrap gap-2">
              {availableAmenities.map((amenity) => {
                const isSelected = selectedAmenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => handleToggleAmenity(amenity)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-800 font-semibold'
                        : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    <span>{amenity}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 5: Toggles (Avoid Ground Floor & Parking) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                id="check-avoid-ground"
                type="checkbox"
                checked={avoidGroundFloor}
                onChange={(e) => setAvoidGroundFloor(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded"
              />
              <div>
                <div className="text-xs font-bold text-slate-800">Avoid Ground Floor</div>
                <div className="text-[11px] text-slate-500">Prefer 1st floor or above for privacy</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                id="check-parking-req"
                type="checkbox"
                checked={parkingRequired}
                onChange={(e) => setParkingRequired(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded"
              />
              <div>
                <div className="text-xs font-bold text-slate-800">Dedicated Vehicle Parking</div>
                <div className="text-[11px] text-slate-500">Four wheeler or covered two wheeler</div>
              </div>
            </label>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              id="btn-launch-structured-mission"
              type="button"
              onClick={handleStartMissionFromStructured}
              disabled={isLaunching}
              className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {isLaunching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Launching Agent Mission...</span>
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  <span>Launch Housing Mission</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
