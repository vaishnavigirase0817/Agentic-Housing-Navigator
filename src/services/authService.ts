import { UserProfile, UserSession, PasswordStrength } from '../types';

const AUTH_STORAGE_KEY = 'agentic_housing_auth_session_v1';
const USERS_STORAGE_KEY = 'agentic_housing_known_users_v1';

export const DEMO_PERSONAS: UserProfile[] = [
  {
    id: 'user-vaishnavi-student',
    name: 'Vaishnavi Girase',
    email: 'girasevaishnavi28@gmail.com',
    phone: '+91 98765 43210',
    city: 'Bengaluru (Koramangala)',
    occupation: 'Graduate CS Student',
    personaType: 'student',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    preferredCurrency: 'INR (₹)',
    createdAt: '2026-01-15T08:00:00.000Z',
    lastActive: new Date().toISOString()
  },
  {
    id: 'user-rohan-engineer',
    name: 'Rohan Mehta',
    email: 'rohan.mehta.tech@example.com',
    phone: '+91 98123 45678',
    city: 'Pune (Hinjawadi IT Park)',
    occupation: 'Senior Backend Engineer',
    personaType: 'professional',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    preferredCurrency: 'INR (₹)',
    createdAt: '2026-02-01T10:00:00.000Z',
    lastActive: new Date().toISOString()
  },
  {
    id: 'user-priya-family',
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    phone: '+91 99234 56789',
    city: 'Mumbai (Powai / Hiranandani)',
    occupation: 'Architect & Parent',
    personaType: 'family',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    preferredCurrency: 'INR (₹)',
    createdAt: '2026-02-10T14:30:00.000Z',
    lastActive: new Date().toISOString()
  }
];

export function calculatePasswordStrength(password: string): PasswordStrength {
  let score = 0;
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);

  if (password.length >= 6) score += 1;
  if (hasMinLength) score += 1;
  if (hasNumber && hasUpperCase) score += 1;
  if (hasSymbol && password.length >= 10) score += 1;

  if (score > 4) score = 4;

  const labels: Record<number, PasswordStrength['label']> = {
    0: 'Very Weak',
    1: 'Weak',
    2: 'Fair',
    3: 'Strong',
    4: 'Very Strong'
  };

  const colors: Record<number, string> = {
    0: 'bg-rose-500',
    1: 'bg-orange-500',
    2: 'bg-amber-500',
    3: 'bg-emerald-500',
    4: 'bg-teal-500'
  };

  return {
    score,
    label: labels[score] || 'Very Weak',
    color: colors[score] || 'bg-rose-500',
    hasMinLength,
    hasNumber,
    hasSymbol,
    hasUpperCase
  };
}

class AuthService {
  private currentSession: UserSession;
  private subscribers: Array<(session: UserSession) => void> = [];

  constructor() {
    this.currentSession = this.loadSession();
  }

  private loadSession(): UserSession {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.user && parsed.token) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[AuthService] Error loading session from storage', e);
    }

    // Default to the first demo persona (Vaishnavi) so preview works seamlessly out-of-the-box
    const defaultUser = DEMO_PERSONAS[0];
    const defaultSession: UserSession = {
      user: defaultUser,
      token: `demo-token-${defaultUser.id}`,
      isAuthenticated: true
    };
    this.saveSession(defaultSession);
    return defaultSession;
  }

  private saveSession(session: UserSession) {
    this.currentSession = session;
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    } catch (e) {
      console.error('[AuthService] Failed to persist session', e);
    }
    this.notifySubscribers();
  }

  private notifySubscribers() {
    for (const sub of this.subscribers) {
      try {
        sub(this.currentSession);
      } catch (err) {
        console.error('[AuthService] Subscriber callback error', err);
      }
    }
  }

  subscribe(callback: (session: UserSession) => void): () => void {
    this.subscribers.push(callback);
    callback(this.currentSession);
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== callback);
    };
  }

  getSession(): UserSession {
    return this.currentSession;
  }

  getUser(): UserProfile {
    return this.currentSession.user;
  }

  getUserId(): string {
    return this.currentSession.user.id;
  }

  getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.currentSession.token}`,
      'x-user-id': this.currentSession.user.id
    };
  }

  async login(email: string, password?: string): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    const trimmedEmail = email.trim().toLowerCase();
    
    // Check known personas first
    const personaMatch = DEMO_PERSONAS.find(p => p.email.toLowerCase() === trimmedEmail);
    if (personaMatch) {
      const session: UserSession = {
        user: { ...personaMatch, lastActive: new Date().toISOString() },
        token: `token-${personaMatch.id}-${Date.now()}`,
        isAuthenticated: true
      };
      this.saveSession(session);
      await this.syncUserToBackend(session.user);
      return { success: true, user: session.user };
    }

    // Check custom local registered users
    try {
      const known = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
      const userMatch = known.find((u: any) => u.email.toLowerCase() === trimmedEmail);
      if (userMatch) {
        const session: UserSession = {
          user: { ...userMatch, lastActive: new Date().toISOString() },
          token: `token-${userMatch.id}-${Date.now()}`,
          isAuthenticated: true
        };
        this.saveSession(session);
        await this.syncUserToBackend(session.user);
        return { success: true, user: session.user };
      }
    } catch {
      // fallback
    }

    // If not existing, create on the fly with friendly name
    const newId = `user-${Date.now()}`;
    const namePart = trimmedEmail.split('@')[0];
    const capitalizedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    
    const newUser: UserProfile = {
      id: newId,
      name: capitalizedName,
      email: trimmedEmail,
      city: 'Bengaluru',
      occupation: 'Explorer',
      personaType: 'custom',
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${newId}`,
      preferredCurrency: 'INR (₹)',
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };

    const session: UserSession = {
      user: newUser,
      token: `token-${newId}`,
      isAuthenticated: true
    };
    this.saveSession(session);
    await this.syncUserToBackend(newUser);
    return { success: true, user: newUser };
  }

  async signup(data: {
    name: string;
    email: string;
    password?: string;
    city?: string;
    occupation?: string;
    phone?: string;
  }): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    const trimmedEmail = data.email.trim().toLowerCase();
    const newId = `user-${Date.now()}`;

    const newUser: UserProfile = {
      id: newId,
      name: data.name.trim(),
      email: trimmedEmail,
      phone: data.phone?.trim() || '+91 98765 00000',
      city: data.city?.trim() || 'Bengaluru',
      occupation: data.occupation?.trim() || 'Professional',
      personaType: 'custom',
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name)}`,
      preferredCurrency: 'INR (₹)',
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };

    // Save to known list
    try {
      const known = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
      known.push(newUser);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(known));
    } catch (e) {
      console.warn('Failed to save to known users', e);
    }

    const session: UserSession = {
      user: newUser,
      token: `token-${newId}`,
      isAuthenticated: true
    };
    this.saveSession(session);
    await this.syncUserToBackend(newUser);
    return { success: true, user: newUser };
  }

  switchPersona(personaId: string): UserProfile {
    const found = DEMO_PERSONAS.find(p => p.id === personaId) || DEMO_PERSONAS[0];
    const session: UserSession = {
      user: { ...found, lastActive: new Date().toISOString() },
      token: `demo-token-${found.id}`,
      isAuthenticated: true
    };
    this.saveSession(session);
    this.syncUserToBackend(session.user);
    return session.user;
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const updated: UserProfile = {
      ...this.currentSession.user,
      ...updates,
      lastActive: new Date().toISOString()
    };

    const session: UserSession = {
      ...this.currentSession,
      user: updated
    };
    this.saveSession(session);
    await this.syncUserToBackend(updated);
    return updated;
  }

  async logout(): Promise<void> {
    // Reset to an unauthenticated or default demo user
    const guestUser: UserProfile = {
      id: 'guest_user',
      name: 'Guest Explorer',
      email: 'guest@example.com',
      city: 'Bengaluru',
      personaType: 'custom',
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };
    const session: UserSession = {
      user: guestUser,
      token: 'guest-token',
      isAuthenticated: false
    };
    this.saveSession(session);
  }

  private async syncUserToBackend(user: UserProfile): Promise<void> {
    try {
      await fetch('/api/auth/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        },
        body: JSON.stringify(user)
      });
    } catch (err) {
      console.warn('[AuthService] Backend profile sync deferred:', err);
    }
  }
}

export const authService = new AuthService();
