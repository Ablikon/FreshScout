import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { fetchCategories, fetchStores, fetchProducts } from '../../api';
import { cityStore } from '../../store';
import Icon, { CATEGORY_ICON_MAP } from '../../components/Icon/Icon';
import STORE_ICONS from '../../components/Icon/storeIcons';
import ProductGrid from '../../components/ProductGrid/ProductGrid';
import s from './Home.module.css';

const CATEGORY_GRADIENTS = {
  'cat-vegetables': ['#E8F5E9', '#C8E6C9', '#43A047'],
  'cat-dairy': ['#E3F2FD', '#BBDEFB', '#1E88E5'],
  'cat-meat': ['#FCE4EC', '#F8BBD0', '#E53935'],
  'cat-fish': ['#E0F7FA', '#B2EBF2', '#00ACC1'],
  'cat-bread': ['#FFF3E0', '#FFE0B2', '#FB8C00'],
  'cat-sausage': ['#FBE9E7', '#FFCCBC', '#F4511E'],
  'cat-frozen': ['#E8EAF6', '#C5CAE9', '#5C6BC0'],
  'cat-grains': ['#FFF8E1', '#FFECB3', '#FFB300'],
  'cat-canned': ['#EFEBE9', '#D7CCC8', '#8D6E63'],
  'cat-oil': ['#F3E5F5', '#E1BEE7', '#AB47BC'],
  'cat-drinks': ['#E0F2F1', '#B2DFDB', '#009688'],
  'cat-sweets': ['#FCE4EC', '#F48FB1', '#EC407A'],
  'cat-alcohol': ['#F3E5F5', '#CE93D8', '#9C27B0'],
  'cat-ready': ['#FFF3E0', '#FFCC80', '#FF9800'],
  'cat-baby': ['#E8F5E9', '#A5D6A7', '#66BB6A'],
  'cat-home': ['#ECEFF1', '#CFD8DC', '#78909C'],
  'cat-hygiene': ['#FCE4EC', '#F8BBD0', '#EC407A'],
  'cat-pets': ['#E8F5E9', '#A5D6A7', '#43A047'],
  'package': ['#F5F5F5', '#E0E0E0', '#9E9E9E'],
};

const HERO_SLIDES = [
  {
    title: 'Лучшие цены\nиз всех магазинов',
    subtitle: 'Сравниваем цены в 5 магазинах — собирайте самую выгодную корзину',
    gradient: 'linear-gradient(135deg, #009DE0 0%, #00C853 100%)',
    icon: 'cart',
    link: '/category/all',
    btnText: 'Все товары',
  },
  {
    title: 'Скидки до 70%\nкаждый день',
    subtitle: 'Находим лучшие акции в Arbuz, Magnum, Wolt, Yandex Lavka и Airba Fresh',
    gradient: 'linear-gradient(135deg, #FF6B35 0%, #E53935 100%)',
    icon: 'fire',
    link: '/category/all?sort=discount',
    btnText: 'Смотреть скидки',
  },
  {
    title: 'Свежие фрукты\nи овощи',
    subtitle: 'Самые свежие продукты с доставкой прямо к вашей двери',
    gradient: 'linear-gradient(135deg, #43A047 0%, #66BB6A 100%)',
    icon: 'cat-vegetables',
    link: '/category/%D0%A4%D1%80%D1%83%D0%BA%D1%82%D1%8B%20%D0%B8%20%D0%BE%D0%B2%D0%BE%D1%89%D0%B8',
    btnText: 'К фруктам',
  },
  {
    title: 'Молочные\nпродукты',
    subtitle: 'Молоко, сыр, йогурты и многое другое от лучших производителей',
    gradient: 'linear-gradient(135deg, #1E88E5 0%, #42A5F5 100%)',
    icon: 'cat-dairy',
    link: '/category/%D0%9C%D0%BE%D0%BB%D0%BE%D1%87%D0%BD%D1%8B%D0%B5%20%D0%BF%D1%80%D0%BE%D0%B4%D1%83%D0%BA%D1%82%D1%8B',
    btnText: 'Смотреть',
  },
];

function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef(null);

  const goTo = useCallback((idx) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrent(idx);
    setTimeout(() => setIsAnimating(false), 600);
  }, [isAnimating]);

  const next = useCallback(() => {
    goTo((current + 1) % HERO_SLIDES.length);
  }, [current, goTo]);

  // Auto-play
  useEffect(() => {
    timerRef.current = setInterval(next, 5000);
    return () => clearInterval(timerRef.current);
  }, [next]);

  const handleDotClick = (idx) => {
    clearInterval(timerRef.current);
    goTo(idx);
    timerRef.current = setInterval(next, 5000);
  };

  const slide = HERO_SLIDES[current];

  return (
    <div className={s.carousel}>
      <Link to={slide.link} className={s.hero} style={{ background: slide.gradient }} key={current}>
        <div className={s.heroContent}>
          <h1 className={s.heroTitle}>{slide.title}</h1>
          <p className={s.heroSubtitle}>{slide.subtitle}</p>
          <span className={s.heroBtn}>{slide.btnText} →</span>
        </div>
        <div className={s.heroPattern}>
          <Icon name={slide.icon} size={140} />
        </div>
      </Link>
      <div className={s.carouselDots}>
        {HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            className={i === current ? s.dotActive : s.dot}
            onClick={() => handleDotClick(i)}
          />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const city = cityStore.useStore(s => s.city);
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [deals, setDeals] = useState([]);
  const [popular, setPopular] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchCategories(city).catch(() => ({ categories: [] })),
      fetchStores(city).catch(() => ({ stores: [] })),
      fetchProducts({ city, sort: 'discount', limit: 12 }).catch(() => ({ products: [] })),
      fetchProducts({ city, sort: 'popular', limit: 12 }).catch(() => ({ products: [] })),
    ]).then(([catData, storeData, dealsData, popularData]) => {
      setCategories(catData.categories || []);
      setStores(storeData.stores || []);
      setDeals(dealsData.products || []);
      setPopular(popularData.products || []);
      setLoading(false);
    });
  }, [city]);

  return (
    <div className={s.page}>
      {/* Hero Carousel */}
      <HeroCarousel />

      {/* Stores */}
      {stores.length > 0 && (
        <div className={s.section}>
          <div className={s.sectionHeader}>
            <h2 className={s.sectionTitle}>Магазины</h2>
          </div>
          <div className={s.storesRow}>
            {stores.map(store => (
              <Link
                key={store.slug}
                to={`/category/all?store=${store.slug}`}
                className={s.storeCard}
              >
                <div className={s.storeLogoWrap}>
                  {STORE_ICONS[store.slug]
                    ? <img className={s.storeLogo} src={STORE_ICONS[store.slug]} alt={store.name} />
                    : <div className={s.storeDot} style={{ background: store.color }}>{store.name[0]}</div>
                  }
                </div>
                <div>
                  <div className={s.storeName}>{store.name}</div>
                  <div className={s.storeCount}>{store.productCount?.toLocaleString()} товаров</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Categories - Wolt-style colorful grid */}
      {categories.length > 0 && (
        <div className={s.section}>
          <div className={s.sectionHeader}>
            <h2 className={s.sectionTitle}>Категории</h2>
          </div>
          <div className={s.categoriesGrid}>
            {categories.map(cat => {
              const gradient = CATEGORY_GRADIENTS[cat.icon] || CATEGORY_GRADIENTS['package'];
              return (
                <Link
                  key={cat.name}
                  to={`/category/${encodeURIComponent(cat.name)}`}
                  className={s.categoryCard}
                  style={{
                    background: `linear-gradient(135deg, ${gradient[0]} 0%, ${gradient[1]} 100%)`,
                  }}
                >
                  <span className={s.categoryIcon} style={{ color: gradient[2] }}>
                    <Icon name={cat.icon || 'package'} size={36} />
                  </span>
                  <span className={s.categoryName}>{cat.name}</span>
                  <span className={s.categoryCount}>{cat.count?.toLocaleString()}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Deals */}
      <div className={s.section}>
        <div className={s.sectionHeader}>
          <h2 className={s.sectionTitle}><Icon name="fire" size={22} style={{ marginRight: 8 }} /> Лучшие скидки</h2>
          <Link to="/category/all?sort=discount" className={s.seeAll}>Все скидки →</Link>
        </div>
        <ProductGrid products={deals} loading={loading} />
      </div>

      {/* Popular */}
      <div className={s.section}>
        <div className={s.sectionHeader}>
          <h2 className={s.sectionTitle}><Icon name="star" size={22} style={{ marginRight: 8 }} /> Популярные товары</h2>
          <Link to="/category/all" className={s.seeAll}>Все товары →</Link>
        </div>
        <ProductGrid products={popular} loading={loading} />
      </div>
    </div>
  );
}
