import { useSyncExternalStore } from "react";

const KEY = "seller_service_favorites_v1";

let state = read();
const listeners = new Set();

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? [];
  } catch {
    return [];
  }
}

function emit() {
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

export function toggleFavorite(id) {
  state = state.includes(id)
    ? state.filter((x) => x !== id)
    : [...state, id];
  emit();
}

export function clearFavorites() {
  state = [];
  emit();
}

export function useFavorites() {
  const ids = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state
  );

  return {
    ids,
    has: (id) => ids.includes(id),
    toggle: (p) => toggleFavorite(p.id),
    clear: clearFavorites,
    count: ids.length,
  };
}
