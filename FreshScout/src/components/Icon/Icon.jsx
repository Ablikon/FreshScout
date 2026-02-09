import s from './Icon.module.css';

// All SVG icons used throughout the app — replaces emoji for a professional look.
// Usage: <Icon name="cart" size={20} className={s.myIcon} />

const paths = {
  // ── Navigation / UI ──
  cart: (
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6zM3 6h18M16 10a4 4 0 01-8 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  search: (
    <path d="M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  'map-pin': (
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1118 0z M12 13a3 3 0 100-6 3 3 0 000 6z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  heart: (
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  'heart-filled': (
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  home: (
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M9 22V12h6v10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  trash: (
    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  close: (
    <path d="M18 6L6 18M6 6l12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  'chevron-right': (
    <path d="M9 18l6-6-6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  'external-link': (
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  package: (
    <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  tag: (
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z M7 7h.01" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  'trending-up': (
    <path d="M23 6l-9.5 9.5-5-5L1 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  star: (
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  fire: (
    <path d="M12 23c-4.97 0-9-3.58-9-8 0-3.19 2.13-6.16 4-8 0 3 2 5.5 4 6.5C9.77 11.75 10 9.5 11.5 7c1.25 3 4.5 5.5 4.5 8.5 2-1 3-3.5 3-5.5 1.87 1.84 4 4.81 4 8 0 4.42-4.03 5-9 5z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  'alert-circle': (
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 8v4M12 16h.01" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  check: (
    <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  shield: (
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),

  // ── Category icons ──
  'cat-vegetables': (
    <>
      <path d="M7 17.5a5.5 5.5 0 015.5-5.5h0A5.5 5.5 0 0118 17.5v0a2.5 2.5 0 01-2.5 2.5h-6A2.5 2.5 0 017 17.5z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 12V6M10 8l2-2 2 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  'cat-dairy': (
    <>
      <rect x="7" y="4" width="10" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M7 10h10M7 14h10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  'cat-meat': (
    <>
      <ellipse cx="12" cy="13" rx="7" ry="6" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="13" r="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7V5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  'cat-fish': (
    <path d="M6.5 12C6.5 12 9 7 14 7c3 0 5 2.5 6 5-1 2.5-3 5-6 5-5 0-7.5-5-7.5-5z M4 12c0 0-1.5-1-2-1.5M4 12c0 0-1.5 1-2 1.5M18 10.5a1 1 0 100-2 1 1 0 000 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  'cat-bread': (
    <path d="M5 12c0-3.87 3.13-7 7-7s7 3.13 7 7v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6zM5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  'cat-sausage': (
    <>
      <rect x="3" y="9" width="18" height="6" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M8 9v6M13 9v6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  'cat-frozen': (
    <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  'cat-grains': (
    <>
      <path d="M4 20h16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 20v-4a2 2 0 012-2h8a2 2 0 012 2v4" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 14V6M9 9l3-3 3 3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  'cat-canned': (
    <>
      <rect x="6" y="6" width="12" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M8 4h8M6 12h12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  'cat-oil': (
    <path d="M10 2h4l1 4H9l1-4zM9 6v2a1 1 0 00-1 1v10a3 3 0 003 3h2a3 3 0 003-3V9a1 1 0 00-1-1V6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  'cat-drinks': (
    <>
      <path d="M8 2h8l-1 18H9L8 2z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 8h8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  'cat-sweets': (
    <>
      <rect x="4" y="8" width="16" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M4 13h16M10 8V6M14 8V6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  'cat-alcohol': (
    <path d="M8 22h8M12 18v4M8 2l4 8 4-8M7 10c0 2.76 2.24 5 5 5s5-2.24 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  'cat-ready': (
    <>
      <circle cx="12" cy="14" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M5 14h14M9 3h6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 7v3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  'cat-baby': (
    <>
      <circle cx="12" cy="10" r="5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 15v4M9 22h6M7 10c0-2.76 2.24-5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  'cat-home': (
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M9 22V12h6v10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  'cat-hygiene': (
    <path d="M10 2h4l1 4H9l1-4zM9 6v2a1 1 0 00-1 1v10a3 3 0 003 3h2a3 3 0 003-3V9a1 1 0 00-1-1V6M9 14h6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  'cat-pets': (
    <path d="M12 18c-3.87 0-7-1.34-7-3s3.13-3 7-3 7 1.34 7 3-3.13 3-7 3zM7 7a2 2 0 11-4 0 2 2 0 014 0zM13 5a2 2 0 11-4 0 2 2 0 014 0zM21 7a2 2 0 11-4 0 2 2 0 014 0zM19 13a2 2 0 11-4 0 2 2 0 014 0z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
};

// Map category names to icon keys for rendering category icons from server data
export const CATEGORY_ICON_MAP = {
  'Фрукты и овощи': 'cat-vegetables',
  'Молочные продукты': 'cat-dairy',
  'Мясо и птица': 'cat-meat',
  'Рыба и морепродукты': 'cat-fish',
  'Хлеб и выпечка': 'cat-bread',
  'Колбасы и деликатесы': 'cat-sausage',
  'Замороженные продукты': 'cat-frozen',
  'Крупы и макароны': 'cat-grains',
  'Консервы': 'cat-canned',
  'Масло, соусы, специи': 'cat-oil',
  'Напитки': 'cat-drinks',
  'Сладости и снеки': 'cat-sweets',
  'Алкоголь': 'cat-alcohol',
  'Готовая еда': 'cat-ready',
  'Детские товары': 'cat-baby',
  'Для дома': 'cat-home',
  'Гигиена и красота': 'cat-hygiene',
  'Для животных': 'cat-pets',
  'Другое': 'package',
};

export default function Icon({ name, size = 24, className = '', style = {}, ...rest }) {
  const content = paths[name];
  if (!content) return null;

  return (
    <svg
      className={`${s.icon} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
      {...rest}
    >
      {content}
    </svg>
  );
}
