import { resetDatabase } from '../db';
import { useSettingsStore } from '../state/useSettingsStore';
import { useUIStore } from '../state/useUIStore';
import { scheduleHomeScreenWidgetSync } from './homeScreenWidgetSync';

let resetPromise: Promise<void> | null = null;

async function performDataReset(): Promise<void> {
  await resetDatabase();
  useUIStore.getState().resetAfterDataDeletion();
  useSettingsStore.getState().resetAfterDataDeletion();
  scheduleHomeScreenWidgetSync();
}

export function deleteAllUserData(): Promise<void> {
  if (!resetPromise) {
    resetPromise = performDataReset().finally(() => {
      resetPromise = null;
    });
  }
  return resetPromise;
}
