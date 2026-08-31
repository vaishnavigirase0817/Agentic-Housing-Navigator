import React, { useState, useEffect } from 'react';
import { AppRoute, SavedPreferences } from '../types';
import { memoryService, DEFAULT_PREFERENCES } from '../services/memoryService';
import {
  Brain,
  Save,
  RotateCcw,
  Check,
  ShieldCheck,
  Sparkles,
  Database,
  Layers,
  CheckCircle2
} from 'lucide-react';

interface PreferencesPageProps {
  onNavigate: (route: AppRoute) => void;
}

export const PreferencesPage: React.FC<PreferencesPageProps> = ({ onNavigate }) => {
  const [prefs, setPrefs] = useState<SavedPreferences>(DEFAULT_PREFERENCES);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    memoryService.getPreferences().then((p) => {
      if (p) setPrefs(p);
    });
  }, []);

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

  const handleToggleAmenity = (am: string) => {
    if (prefs.preferredAmenities.includes(am)) {
      setPrefs({
        ...prefs,
        preferredAmenities: prefs.preferredAmenities.filter((a) => a !== am)
      });
    } else {
      setPrefs({
        ...prefs,
        preferredAmenities: [...prefs.preferredAmenities, am]
      });
    }
  };

  const handleSave = async () => {
    await memoryService.savePreferences(prefs);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleReset = async () => {
    const res = await memoryService.resetPreferences();
    setPrefs(res);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div id="preferences-page" className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Agent Memory & Saved Preferences
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-mono font-bold border border-indigo-200">
              PERSISTENT
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Your agent remembers your lifestyle constraints and auto-applies them when evaluating future listings
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-save-agent-memory"
            type="button"
            onClick={handleSave}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            {isSaved ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Saved to Memory!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Agent Memory</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer shadow-xs"
            title="Reset to factory defaults"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Settings Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-6 shadow-sm">
        {/* Row 1: Budget & Proximity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono text-slate-700">
              <span className="font-bold">DEFAULT MAX BUDGET</span>
              <span className="text-indigo-700 font-bold">₹{prefs.maxBudget.toLocaleString('en-IN')}/mo</span>
            </div>
            <input
              type="range"
              min={6000}
              max={40000}
              step={500}
              value={prefs.maxBudget}
              onChange={(e) => setPrefs({ ...prefs, maxBudget: Number(e.target.value) })}
              className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 font-mono">Agent will penalize listings exceeding this threshold</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono text-slate-700">
              <span className="font-bold">PREFERRED CAMPUS PROXIMITY</span>
              <span className="text-indigo-700 font-bold">≤ {prefs.preferredDistanceKm} km</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={10.0}
              step={0.5}
              value={prefs.preferredDistanceKm}
              onChange={(e) => setPrefs({ ...prefs, preferredDistanceKm: Number(e.target.value) })}
              className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 font-mono">Geodesic distance calculation from reference location</span>
          </div>
        </div>

        {/* Row 2: Property Type & Furnishing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-mono font-bold text-slate-700 uppercase">
              PREFERRED PROPERTY TYPE
            </label>
            <select
              value={prefs.preferredPropertyType}
              onChange={(e) => setPrefs({ ...prefs, preferredPropertyType: e.target.value })}
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
            <label className="block text-xs font-mono font-bold text-slate-700 uppercase">
              FURNISHING PREFERENCE
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Furnished', 'Semi-Furnished', 'Unfurnished'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setPrefs({ ...prefs, preferredFurnishing: f })}
                  className={`py-2 text-[11px] font-semibold rounded-lg border transition-colors cursor-pointer ${
                    prefs.preferredFurnishing === f
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 3: Target Locality */}
        <div className="space-y-1.5">
          <label className="block text-xs font-mono font-bold text-slate-700 uppercase">
            DEFAULT TARGET LOCATION / CAMPUS
          </label>
          <input
            type="text"
            value={prefs.targetLocality}
            onChange={(e) => setPrefs({ ...prefs, targetLocality: e.target.value })}
            className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-indigo-500 shadow-xs"
          />
        </div>

        {/* Row 4: Lifestyle Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
          <label className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors">
            <input
              type="checkbox"
              checked={prefs.avoidGroundFloor}
              onChange={(e) => setPrefs({ ...prefs, avoidGroundFloor: e.target.checked })}
              className="w-4 h-4 accent-indigo-600 rounded"
            />
            <div>
              <div className="text-xs font-bold text-slate-800">Avoid Ground Floor</div>
              <div className="text-[11px] text-slate-500">Apply scoring penalty to floor 0 units</div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors">
            <input
              type="checkbox"
              checked={prefs.parkingRequired}
              onChange={(e) => setPrefs({ ...prefs, parkingRequired: e.target.checked })}
              className="w-4 h-4 accent-indigo-600 rounded"
            />
            <div>
              <div className="text-xs font-bold text-slate-800">Vehicle Parking Required</div>
              <div className="text-[11px] text-slate-500">Prioritize covered or open dedicated parking</div>
            </div>
          </label>
        </div>

        {/* Row 5: Amenities */}
        <div className="space-y-2 pt-2 border-t border-slate-200">
          <label className="block text-xs font-mono font-bold text-slate-700 uppercase">
            DEFAULT MUST-HAVE AMENITIES
          </label>
          <div className="flex flex-wrap gap-2">
            {availableAmenities.map((am) => {
              const isSel = prefs.preferredAmenities.includes(am);
              return (
                <button
                  key={am}
                  type="button"
                  onClick={() => handleToggleAmenity(am)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSel
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-800 font-semibold shadow-xs'
                      : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {isSel && <Check className="w-3.5 h-3.5 text-indigo-700" />}
                  <span>{am}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cloud Architecture Synchronization Note */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-600 font-mono shadow-xs">
        <Database className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="text-slate-900 font-bold flex items-center gap-2">
            Cloud Firestore Persistent Memory Active
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">LIVE</span>
          </span>
          <p className="text-[11px] leading-relaxed">
            Preferences and implicit lifestyle memories are persisted directly to <code className="text-indigo-700 font-bold">FirestoreMemoryRepository</code>. When you launch missions (e.g. <em>"I don't want ground-floor apartments"</em>), the RequirementAgent retrieves and applies these preferences automatically.
          </p>
        </div>
      </div>
    </div>
  );
};
