import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchCategories } from '../../api';
import { cityStore } from '../../store';
import Icon from '../Icon/Icon';
import s from './CategoryBar.module.css';

export default function CategoryBar() {
  const { slug } = useParams();
  const city = cityStore.useStore(st => st.city);
  const [categories, setCategories] = useState([]);
  const scrollRef = useRef(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    fetchCategories(city)
      .then(d => setCategories(d.categories || []))
      .catch(() => {});
  }, [city]);

  // Manual JS scroll animation using interval — most reliable approach
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || categories.length === 0) return;

    const intervalId = setInterval(() => {
      if (el.scrollWidth <= el.clientWidth) return; // no overflow
      if (el.matches(':hover')) return; // paused on hover
      el.scrollLeft += 1;
      if (el.scrollLeft >= el.scrollWidth - el.clientWidth) {
        el.scrollLeft = 0;
      }
    }, 30);

    return () => clearInterval(intervalId);
  }, [categories]);

  const handleEnter = useCallback(() => setPaused(true), []);
  const handleLeave = useCallback(() => setPaused(false), []);

  if (!categories || categories.length === 0) return null;

  const activeSlug = slug ? decodeURIComponent(slug) : null;

  return (
    <nav className={s.bar}>
      <div
        className={s.inner}
        ref={scrollRef}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onTouchStart={handleEnter}
        onTouchEnd={handleLeave}
      >
        <Link to="/" className={!activeSlug ? s.itemActive : s.allBtn}>
          <Icon name="home" size={18} className={s.icon} />
          <span>Все</span>
        </Link>
        {categories.map(cat => (
          <Link
            key={cat.name}
            to={`/category/${encodeURIComponent(cat.name)}`}
            className={activeSlug === cat.name ? s.itemActive : s.item}
          >
            <Icon name={cat.icon || 'package'} size={18} className={s.icon} />
            <span>{cat.name}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
