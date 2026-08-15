// Genie Experimental Labs Feature Flag Engine
export interface FeatureFlags {
  labs_enabled: boolean;
  permanent_mode: boolean;
  command_palette: boolean;
  speedrun_mode: boolean;
  ai_story_generator: boolean;
  playwright_drawer: boolean;
  dark_mode_theme: boolean;
  flaky_test_healer: boolean;
  browser_automation_runner: boolean;
}

const STORAGE_KEY = 'test_genie_feature_flags_v1';

const DEFAULT_FLAGS: FeatureFlags = {
  labs_enabled: false,
  permanent_mode: false,
  command_palette: true,
  speedrun_mode: false,
  ai_story_generator: true,
  playwright_drawer: true,
  dark_mode_theme: true,
  flaky_test_healer: true,
  browser_automation_runner: true,
};

export const getFeatureFlags = (): FeatureFlags => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_FLAGS;
    const parsed = JSON.parse(stored);
    return { ...DEFAULT_FLAGS, ...parsed };
  } catch (e) {
    return DEFAULT_FLAGS;
  }
};

export const saveFeatureFlags = (flags: FeatureFlags): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
    // Trigger custom event for real-time reactivity across components
    window.dispatchEvent(new CustomEvent('genie_feature_flags_updated', { detail: flags }));
  } catch (e) {
    console.error('Failed to save feature flags:', e);
  }
};

export const toggleFeatureFlag = (key: keyof FeatureFlags): FeatureFlags => {
  const current = getFeatureFlags();
  const updated = {
    ...current,
    labs_enabled: true, // Auto-enable labs mode when user toggles any flag
    [key]: !current[key]
  };
  saveFeatureFlags(updated);
  return updated;
};

export const toggleLabsGlobal = (): FeatureFlags => {
  const current = getFeatureFlags();
  const updated = { ...current, labs_enabled: !current.labs_enabled };
  saveFeatureFlags(updated);
  return updated;
};

export const promoteToPermanent = (): FeatureFlags => {
  const updated: FeatureFlags = {
    labs_enabled: true,
    permanent_mode: true,
    command_palette: true,
    speedrun_mode: true,
    ai_story_generator: true,
    playwright_drawer: true,
    dark_mode_theme: true,
    flaky_test_healer: true,
    browser_automation_runner: true,
  };
  saveFeatureFlags(updated);
  return updated;
};

export const rollbackAllLabs = (): FeatureFlags => {
  const updated: FeatureFlags = {
    ...DEFAULT_FLAGS,
    labs_enabled: false,
    permanent_mode: false,
  };
  saveFeatureFlags(updated);
  return updated;
};

export const isFeatureActive = (flags: FeatureFlags, featureKey: keyof FeatureFlags): boolean => {
  if (flags.permanent_mode) return true;
  if (!flags.labs_enabled) return false;
  return !!flags[featureKey];
};
