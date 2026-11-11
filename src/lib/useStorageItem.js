import { useSyncExternalStore } from 'react';

function subscribe(callback) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

/** localStorage value: undefined while server/hydrating, '' when absent. */
export default function useStorageItem(key) {
  return useSyncExternalStore(
    subscribe,
    () => {
      try { return localStorage.getItem(key) ?? ''; } catch { return ''; }
    },
    () => undefined,
  );
}
