/**
 * User Preference Service Implementation
 */

import {
  UserPreference,
  STORAGE_KEYS,
} from '@/lib/contracts/types/user-preference';
import { IUserPreferenceService } from '@/lib/contracts/interfaces/user-preference-service';

class UserPreferenceService implements IUserPreferenceService {
  private getFromStorage(): UserPreference {
    if (typeof window === 'undefined') {
      return { hiddenSites: [], favoriteSites: [] };
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCE);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }

    return { hiddenSites: [], favoriteSites: [] };
  }

  private saveToStorage(preferences: UserPreference): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(
        STORAGE_KEYS.USER_PREFERENCE,
        JSON.stringify(preferences)
      );
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  }

  getPreferences(): UserPreference {
    return this.getFromStorage();
  }

  favoriteSite(siteId: string): void {
    const prefs = this.getFromStorage();
    if (!prefs.favoriteSites.includes(siteId)) {
      prefs.favoriteSites.push(siteId);
      this.saveToStorage(prefs);
    }
  }

  unfavoriteSite(siteId: string): void {
    const prefs = this.getFromStorage();
    prefs.favoriteSites = prefs.favoriteSites.filter((id) => id !== siteId);
    this.saveToStorage(prefs);
  }

  hideSite(siteId: string): void {
    const prefs = this.getFromStorage();
    if (!prefs.hiddenSites.includes(siteId)) {
      prefs.hiddenSites.push(siteId);
      this.saveToStorage(prefs);
    }
  }

  unhideSite(siteId: string): void {
    const prefs = this.getFromStorage();
    prefs.hiddenSites = prefs.hiddenSites.filter((id) => id !== siteId);
    this.saveToStorage(prefs);
  }

  isFavorite(siteId: string): boolean {
    const prefs = this.getFromStorage();
    return prefs.favoriteSites.includes(siteId);
  }

  isHidden(siteId: string): boolean {
    const prefs = this.getFromStorage();
    return prefs.hiddenSites.includes(siteId);
  }

  clearPreferences(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.USER_PREFERENCE);
  }
}

export const userPreferenceService = new UserPreferenceService();
