import { useState, useEffect, useRef } from 'react';
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
  const animRef = useRef(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    fetchCategories(city)
      .then(d => setCategories(d.categories || []))
      .catch(() => {});
  }, [city]);

  // Auto-scroll animation
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let speed = 0.4; // px per frame

    const tick = () => {
      if (!pausedRef.current && el.scrollWidth > el.clientWidth) {
        el.scrollLeft += speed;
        // Loop: if scrolled to end, jump back to start
        if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 1) {
          el.scrollLeft = 0;
        }
      }
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [categories]);

  const handleEnter = () => { pausedRef.current = true; };
  const handleLeave = () => { pausedRef.current = false; };

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
