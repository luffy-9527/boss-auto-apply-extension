import { JobFilterConfig, ApplyState, ApplyLog, DEFAULT_CONFIG, DEFAULT_STATE } from '../types';

export const isExtension = typeof chrome !== 'undefined' && Boolean(chrome.storage?.local);

export async function getStorageItem<T>(key: string, defaultValue: T): Promise<T> {
  if (isExtension) {
    try {
      const res = await chrome.storage.local.get(key);
      return res[key] !== undefined ? res[key] : defaultValue;
    } catch {
      return defaultValue;
    }
  } else {
    try {
      const raw = localStorage.getItem(`boss_${key}`);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch {
      return defaultValue;
    }
  }
}

export async function setStorageItem<T>(key: string, value: T): Promise<void> {
  if (isExtension) {
    try {
      await chrome.storage.local.set({ [key]: value });
    } catch (e) {
      console.warn('chrome.storage.set error', e);
    }
  } else {
    try {
      localStorage.setItem(`boss_${key}`, JSON.stringify(value));
    } catch (e) {
      console.warn('localStorage.set error', e);
    }
  }
}

export async function sendExtensionMessage(message: { action: string; [key: string]: unknown }) {
  if (isExtension && chrome.tabs) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        return await chrome.tabs.sendMessage(tab.id, message);
      }
    } catch (e) {
      console.log('SendMessage to tab failed (probably not on target page):', e);
    }
  }
  return null;
}
