import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { searchProducts } from '../../api';
import { uiStore, closeSearch, cityStore } from '../../store';
import Icon from '../Icon/Icon';
import s from './SearchModal.module.css';

export default function SearchModal() {
  const isOpen = uiStore.useStore(st => st.searchOpen);
  const city = cityStore.useStore(st => st.city);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    if (!isOpen) {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && isOpen) closeSearch();
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        uiStore.setState(s => ({ searchOpen: !s.searchOpen }));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen]);

  const doSearch = useCallback(async (q) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data = await searchProducts({ search: q, city, limit: 20, sort: 'price_asc' });
      setResults(data.products || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [city]);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(val), 300);
  };

  if (!isOpen) return null;

  return (
    <div className={s.overlay} onClick={(e) => { if (e.target === e.currentTarget) closeSearch(); }}>
      <div className={s.modal}>
        <div className={s.searchRow}>
          <span className={s.searchIcon}><Icon name="search" size={20} /></span>
          <input
            ref={inputRef}
            className={s.input}
            type="text"
            value={query}
            onChange={handleChange}
            placeholder="Поиск товаров..."
          />
          <button className={s.closeBtn} onClick={closeSearch}><Icon name="close" size={20} /></button>
        </div>

        <div className={s.results}>
          {loading && <div className={s.loading}>Поиск...</div>}

          {!loading && query.length < 2 && (
            <div className={s.hint}>
              <div className={s.hintIcon}><Icon name="search" size={40} /></div>
              <p>Начните вводить название продукта</p>
              <p style={{ marginTop: 8, fontSize: 12, opacity: 0.6 }}>⌘K для быстрого поиска</p>
            </div>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <div className={s.hint}>
              <div className={s.hintIcon}><Icon name="alert-circle" size={40} /></div>
              <p>Ничего не найдено по запросу «{query}»</p>
            </div>
          )}

          {results.map(product => (
            <Link
              key={product._id}
              to={`/product/${product._id}`}
              className={s.resultItem}
              onClick={closeSearch}
            >
              <img
                className={s.resultImage}
                src={product.imageUrl?.replace('%w', '96').replace('%h', '96')}
                alt=""
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div className={s.resultInfo}>
                <div className={s.resultTitle}>{product.title}</div>
                <div className={s.resultMeta}>{product.storeName} · {product.measure}</div>
              </div>
              <span className={s.resultPrice}>{product.cost?.toLocaleString()} ₸</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
