import '@testing-library/jest-dom/vitest';

// This jsdom/vitest combination doesn't provide a working window.localStorage
// (silently undefined, not even a throw — verified it's not the documented
// opaque-origin issue since environmentOptions.jsdom.url is already set).
// Anything that touches localStorage (e.g. zustand's persist middleware)
// fails with "Cannot read properties of undefined (reading 'setItem')"
// without this. A minimal, spec-correct in-memory Storage polyfill.
if (typeof window !== 'undefined' && !window.localStorage) {
  class MemoryStorage implements Storage {
    private store = new Map<string, string>();

    get length(): number {
      return this.store.size;
    }
    clear(): void {
      this.store.clear();
    }
    getItem(key: string): string | null {
      return this.store.has(key) ? this.store.get(key)! : null;
    }
    key(index: number): string | null {
      return Array.from(this.store.keys())[index] ?? null;
    }
    removeItem(key: string): void {
      this.store.delete(key);
    }
    setItem(key: string, value: string): void {
      this.store.set(key, String(value));
    }
  }

  Object.defineProperty(window, 'localStorage', {
    value: new MemoryStorage(),
    configurable: true,
  });
  Object.defineProperty(globalThis, 'localStorage', {
    value: window.localStorage,
    configurable: true,
  });
}
