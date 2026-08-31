import React, { useState } from 'react';
import { 
  X, 
  User, 
  Mail, 
  MapPin, 
  Briefcase, 
  Phone, 
  Check, 
  LogOut, 
  Sparkles, 
  ShieldCheck,
  Building2,
  Wallet
} from 'lucide-react';
import { authService, DEMO_PERSONAS } from '../services/authService';
import { UserProfile } from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onProfileUpdated: (user: UserProfile) => void;
  onOpenAuthModal: (mode: 'signin' | 'signup') => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onProfileUpdated,
  onOpenAuthModal
}) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [city, setCity] = useState(user.city || 'Bengaluru');
  const [occupation, setOccupation] = useState(user.occupation || 'Software Engineer');
  const [phone, setPhone] = useState(user.phone || '+91 98765 43210');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await authService.updateProfile({
        name,
        email,
        city,
        occupation,
        phone
      });
      onProfileUpdated(updated);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 900);
    } catch (e) {
      console.error('Failed to save profile', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePersonaSwitch = (personaId: string) => {
    const updated = authService.switchPersona(personaId);
    setName(updated.name);
    setEmail(updated.email);
    setCity(updated.city || 'Bengaluru');
    setOccupation(updated.occupation || 'Engineer');
    setPhone(updated.phone || '');
    onProfileUpdated(updated);
  };

  const handleLogout = async () => {
    await authService.logout();
    onClose();
    onOpenAuthModal('signin');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`} 
              alt={user.name}
              className="w-10 h-10 rounded-full border-2 border-emerald-500/50 object-cover" 
            />
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                {user.name}
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[10px] text-emerald-300 font-mono">
                  {user.personaType || 'Active User'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Quick Switch Personas */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Switch Test Persona
              </span>
              <span className="text-[10px] text-slate-400">Preserves distinct Firestore memory</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_PERSONAS.map(p => {
                const isActive = user.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePersonaSwitch(p.id)}
                    className={`p-2 rounded-lg border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                      isActive 
                        ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-400 shadow-xs' 
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <img src={p.avatarUrl} alt={p.name} className="w-5 h-5 rounded-full object-cover shrink-0" />
                      <span className="text-[10px] font-bold text-slate-800 truncate">{p.name.split(' ')[0]}</span>
                    </div>
                    <span className="text-[9px] text-slate-500 truncate">{p.city.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">City / Region</label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Phone</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Occupation & Role</label>
              <div className="relative">
                <Briefcase className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-emerald-600 outline-none"
                />
              </div>
            </div>

            {/* Cloud Firestore User Isolation Info */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800 text-[11px]">User Record Isolation Active</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Your missions, shortlist, notifications, and learned memory constraints are scoped to ID: <code className="font-mono bg-slate-200 px-1 py-0.5 rounded text-slate-700">{user.id}</code>.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleLogout}
                className="py-2 px-3 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>

              <button
                id="btn-save-user-profile"
                type="submit"
                disabled={isSaving}
                className="py-2 px-5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Saved!</span>
                  </>
                ) : isSaving ? (
                  <span>Saving...</span>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
