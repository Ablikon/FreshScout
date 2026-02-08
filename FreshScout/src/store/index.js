import { useSyncExternalStore } from 'react';

function createStore(initialState) {
  let state = initialState;
  const listeners = new Set();

  const getState = () => state;

  const setState = (updater) => {
    const next = typeof updater === 'function' ? updater(state) : updater;
    state = { ...state, ...next };
    listeners.forEach(l => l());
  };

  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const useStore = (selector) => {
    return useSyncExternalStore(
      subscribe,
      () => selector(getState()),
      () => selector(getState()),
    );
  };

  return { getState, setState, subscribe, useStore };
}

// ── Cart Store ──
const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');

export const cartStore = createStore({
  items: savedCart,
});

function persistCart() {
  localStorage.setItem('cart', JSON.stringify(cartStore.getState().items));
}

export function addToCart(product) {
  const { items } = cartStore.getState();
  const existing = items.find(i => i._id === product._id);
  if (existing) {
    cartStore.setState({
      items: items.map(i => i._id === product._id ? { ...i, quantity: i.quantity + 1 } : i),
    });
  } else {
    cartStore.setState({
      items: [...items, { ...product, quantity: 1 }],
    });
  }
  persistCart();
}

export function removeFromCart(productId) {
  const { items } = cartStore.getState();
  cartStore.setState({
    items: items.filter(i => i._id !== productId),
  });
  persistCart();
}

export function updateQuantity(productId, quantity) {
  if (quantity <= 0) {
    removeFromCart(productId);
    return;
  }
  const { items } = cartStore.getState();
  cartStore.setState({
    items: items.map(i => i._id === productId ? { ...i, quantity } : i),
  });
  persistCart();
}

export function clearCart() {
  cartStore.setState({ items: [] });
  persistCart();
}

export function getCartTotal() {
  const { items } = cartStore.getState();
  return items.reduce((sum, i) => sum + i.cost * i.quantity, 0);
}

export function getCartCount() {
  const { items } = cartStore.getState();
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

// ── City Store ──
const savedCity = localStorage.getItem('city') || 'almaty';

export const cityStore = createStore({
  city: savedCity,
});

export function setCity(city) {
  cityStore.setState({ city });
  localStorage.setItem('city', city);
}

// ── UI Store ──
export const uiStore = createStore({
  cartOpen: false,
  searchOpen: false,
  mobileMenuOpen: false,
});

export function toggleCart() {
  uiStore.setState(s => ({ cartOpen: !s.cartOpen }));
}

export function openCart() {
  uiStore.setState({ cartOpen: true });
}

export function closeCart() {
  uiStore.setState({ cartOpen: false });
}

export function toggleSearch() {
  uiStore.setState(s => ({ searchOpen: !s.searchOpen }));
}

export function openSearch() {
  uiStore.setState({ searchOpen: true });
}

export function closeSearch() {
  uiStore.setState({ searchOpen: false });
}

// ── Favorites Store ──
const savedFavorites = JSON.parse(localStorage.getItem('favorites') || '[]');

export const favoritesStore = createStore({
  items: savedFavorites,
});

export function toggleFavorite(product) {
  const { items } = favoritesStore.getState();
  const exists = items.find(i => i._id === product._id);
  if (exists) {
    favoritesStore.setState({ items: items.filter(i => i._id !== product._id) });
  } else {
    favoritesStore.setState({ items: [...items, product] });
  }
  localStorage.setItem('favorites', JSON.stringify(favoritesStore.getState().items));
}

export function isFavorite(productId) {
  return favoritesStore.getState().items.some(i => i._id === productId);
}
