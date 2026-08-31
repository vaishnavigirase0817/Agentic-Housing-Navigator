import { AppNotification } from '../types';
import { authService } from './authService';

const NOTIFICATIONS_STORAGE_KEY = 'agentic_housing_notifications_v1';

export interface INotificationService {
  getNotifications(): Promise<AppNotification[]>;
  addNotification(notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>): Promise<AppNotification>;
  markAsRead(id: string): Promise<void>;
  markAllAsRead(): Promise<void>;
  clearAll(): Promise<void>;
}

class NotificationServiceImpl implements INotificationService {
  private notifications: AppNotification[] = [];

  constructor() {
    this.loadLocal();
    this.syncFromBackend();
  }

  private loadLocal() {
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (stored) {
        this.notifications = JSON.parse(stored);
      } else {
        this.notifications = [
          {
            id: 'notif-welcome',
            title: 'Welcome to Housing Mission Control',
            message: 'Your Google ADK multi-agent cluster is online and backed by Cloud Firestore.',
            type: 'system',
            timestamp: new Date().toISOString(),
            read: false
          }
        ];
        this.persistLocal();
      }
    } catch {
      this.notifications = [];
    }
  }

  private persistLocal() {
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(this.notifications));
    } catch (e) {
      console.error('Failed to persist notifications locally', e);
    }
  }

  private async syncFromBackend(): Promise<void> {
    try {
      const res = await fetch('/api/notifications', {
        headers: authService.getAuthHeaders()
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          this.notifications = json.data;
          this.persistLocal();
        }
      }
    } catch (err) {
      console.warn('[NotificationService] Backend sync deferred:', err);
    }
  }

  async getNotifications(): Promise<AppNotification[]> {
    await this.syncFromBackend();
    return [...this.notifications];
  }

  async addNotification(
    item: Omit<AppNotification, 'id' | 'timestamp' | 'read'>
  ): Promise<AppNotification> {
    const notif: AppNotification = {
      ...item,
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      read: false
    };

    this.notifications.unshift(notif);
    this.persistLocal();

    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authService.getAuthHeaders() },
        body: JSON.stringify(notif)
      });
    } catch (e) {
      console.warn('[NotificationService] Backend add deferred:', e);
    }

    return notif;
  }

  async markAsRead(id: string): Promise<void> {
    this.notifications = this.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    this.persistLocal();

    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: authService.getAuthHeaders()
      });
    } catch (e) {
      console.warn('[NotificationService] Backend markAsRead deferred:', e);
    }
  }

  async markAllAsRead(): Promise<void> {
    this.notifications = this.notifications.map((n) => ({ ...n, read: true }));
    this.persistLocal();

    try {
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: authService.getAuthHeaders()
      });
    } catch (e) {
      console.warn('[NotificationService] Backend markAllAsRead deferred:', e);
    }
  }

  async clearAll(): Promise<void> {
    this.notifications = [];
    this.persistLocal();

    try {
      await fetch('/api/notifications', {
        method: 'DELETE',
        headers: authService.getAuthHeaders()
      });
    } catch (e) {
      console.warn('[NotificationService] Backend clearAll deferred:', e);
    }
  }
}

export const notificationService = new NotificationServiceImpl();
