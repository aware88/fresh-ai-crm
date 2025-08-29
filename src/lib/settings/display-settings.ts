/**
 * Display Settings Utility
 * Provides functions to get and manage display preferences
 */

export interface DisplaySettings {
  emailSort: string;
  emailPreviewLength: number;
  emailView: string;
  dashboardLayout: string;
  showOpportunityBadges: boolean;
  enableSmartSorting: boolean;
  widgets: {
    emails: boolean;
    contacts: boolean;
    tasks: boolean;
    analytics: boolean;
  };
}

export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  emailSort: 'newest',
  emailPreviewLength: 2,
  emailView: 'threaded',
  dashboardLayout: 'grid',
  showOpportunityBadges: true,
  enableSmartSorting: true,
  widgets: {
    emails: true,
    contacts: true,
    tasks: true,
    analytics: true
  }
};

/**
 * Get display settings from localStorage
 */
export function getDisplaySettings(): DisplaySettings {
  try {
    const saved = localStorage.getItem('aris-display-settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with defaults to ensure all properties exist
      return { ...DEFAULT_DISPLAY_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.warn('Failed to parse display settings from localStorage:', error);
  }
  
  return DEFAULT_DISPLAY_SETTINGS;
}

/**
 * Check if opportunity badges should be shown
 */
export function shouldShowOpportunityBadges(): boolean {
  const settings = getDisplaySettings();
  return settings.showOpportunityBadges;
}

/**
 * Check if smart sorting should be enabled
 */
export function shouldEnableSmartSorting(): boolean {
  const settings = getDisplaySettings();
  return settings.enableSmartSorting;
}

/**
 * Save display settings to localStorage
 */
export function saveDisplaySettings(settings: DisplaySettings): void {
  try {
    localStorage.setItem('aris-display-settings', JSON.stringify(settings));
  } catch (error) {
    console.warn('Failed to save display settings to localStorage:', error);
  }
}
