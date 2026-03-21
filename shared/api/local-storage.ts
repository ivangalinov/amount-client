import { isBrowser } from "@/shared/lib/runtime";
import type { IKeyValueStorage } from "@/shared/api/types";

// A thin Promise-based wrapper around window.localStorage.
// On the server (SSR) it becomes a no-op in-memory store.

class BrowserLocalStorage implements IKeyValueStorage {
  async getItem(key: string): Promise<string | null> {
    if (!isBrowser) return null;
    return window.localStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    if (!isBrowser) return;
    window.localStorage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    if (!isBrowser) return;
    window.localStorage.removeItem(key);
  }
}

// Simple in-memory fallback (used on server or if window.localStorage is unavailable)
class MemoryStorage implements IKeyValueStorage {
  private store = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.store.delete(key);
  }
}

export const keyValueStorage: IKeyValueStorage = isBrowser
  ? new BrowserLocalStorage()
  : new MemoryStorage();

