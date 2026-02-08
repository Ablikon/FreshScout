import { useSyncExternalStore } from "react";

const KEY = "seller_service_cart_v1";

let state = read();
const listeners = new Set();

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? [];
  } catch {
    return [];
  }
}

function emit(next) {
  state = next; 
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return state;
}

export function useCart() {
  const items = useSyncExternalStore(subscribe, getSnapshot);

  function add(p) {
    const price = Number(p.price) || 0;

    const idx = state.findIndex((x) => x.productId === p.id);

    if (idx >= 0) {
      const next = state.map((x, i) =>
        i === idx ? { ...x, qty: (Number(x.qty) || 0) + 1, price: Number(x.price) || price } : x
      );
      emit(next);
      return;
    }

    emit([
      ...state,
      {
        productId: p.id,
        title: p.title,
        unit: p.unit,
        price,
        qty: 1,
      },
    ]);
  }

  function inc(id) {
    const idx = state.findIndex((x) => x.productId === id);
    if (idx < 0) return;

    const next = state.map((x, i) =>
      i === idx ? { ...x, qty: (Number(x.qty) || 0) + 1 } : x
    );
    emit(next);
  }

  function dec(id) {
    const next = state
      .map((x) =>
        x.productId === id ? { ...x, qty: (Number(x.qty) || 0) - 1 } : x
      )
      .filter((x) => x.qty > 0);

    emit(next);
  }

  function clear() {
    emit([]);
  }

  const totalCount = items.reduce((s, x) => s + (Number(x.qty) || 0), 0);
  const totalPrice = items.reduce(
    (s, x) => s + (Number(x.qty) || 0) * (Number(x.price) || 0),
    0
  );

  return { items, add, inc, dec, clear, totalCount, totalPrice };
}
