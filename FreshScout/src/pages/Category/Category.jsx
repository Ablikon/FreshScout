import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { fetchProducts, fetchCategories, fetchStores } from '../../api';
import { cityStore } from '../../store';
import Icon from '../../components/Icon/Icon';
import ProductGrid from '../../components/ProductGrid/ProductGrid';
import s from './Category.module.css';

const SORT_OPTIONS = [
  { value: 'popular', label: 'Популярные' },
  { value: 'price_asc', label: 'Дешевле' },
  { value: 'price_desc', label: 'Дороже' },
  { value: 'discount', label: 'По скидке' },
];

const STORE_COLORS = {
  airba: '#FF6B35', arbuz: '#00C853', magnum: '#E53935', wolt: '#009DE0', yandex: '#FFCC00',
};

export default function CategoryPage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const city = cityStore.useStore(s => s.city);

  const categoryName = slug ? decodeURIComponent(slug) : '';
  const isAll = slug === 'all';
  const subcategory = searchParams.get('sub');
  const store = searchParams.get('store');
  const sort = searchParams.get('sort') || 'popular';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Load categories & stores
  useEffect(() => {
    fetchCategories(city).then(d => setCategories(d.categories || [])).catch(() => {});
    fetchStores(city).then(d => setStores(d.stores || [])).catch(() => {});
  }, [city]);

  // Load products
  const loadProducts = useCallback(async (pageNum = 1, append = false) => {
    setLoading(true);
    try {
      const params = { city, page: pageNum, limit: 40, sort };
      if (!isAll && categoryName) params.category = categoryName;
      if (subcategory) params.subcategory = subcategory;
      if (store) params.store = store;

      const data = await fetchProducts(params);
      setProducts(prev => append ? [...prev, ...(data.products || [])] : (data.products || []));
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch {
      if (!append) setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [city, categoryName, subcategory, store, sort, isAll, slug]);

  useEffect(() => {
    setPage(1);
    loadProducts(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [loadProducts]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    loadProducts(next, true);
  };

  const handleSort = (val) => {
    const p = new URLSearchParams(searchParams);
    p.set('sort', val);
    setSearchParams(p);
  };

  const handleStore = (slug) => {
    const p = new URLSearchParams(searchParams);
    if (p.get('store') === slug) {
      p.delete('store');
    } else {
      p.set('store', slug);
    }
    setSearchParams(p);
  };

  const handleSub = (name) => {
    const p = new URLSearchParams(searchParams);
    if (p.get('sub') === name) {
      p.delete('sub');
    } else {
      p.set('sub', name);
    }
    setSearchParams(p);
  };

  // Current category data
  const currentCat = categories.find(c => c.name === categoryName);

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div className={s.breadcrumb}>
          <Link to="/">Главная</Link>
          <span>›</span>
          {isAll ? <span>Все товары</span> : <span>{categoryName}</span>}
        </div>
        <h1 className={s.title}>
          {isAll ? 'Все товары' : (
            <>
              {currentCat?.icon && <Icon name={currentCat.icon} size={28} style={{ marginRight: 8, verticalAlign: 'middle' }} />}
              {categoryName}
            </>
          )}
        </h1>
        <p className={s.subtitle}>{total.toLocaleString()} товаров</p>
      </div>

      {/* Toolbar */}
      <div className={s.toolbar}>
        <div className={s.sortBtns}>
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={sort === opt.value ? s.sortBtnActive : s.sortBtn}
              onClick={() => handleSort(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className={s.storeFilters}>
          {stores.map(st => (
            <button
              key={st.slug}
              className={store === st.slug ? s.storeBtnActive : s.storeBtn}
              style={store === st.slug ? { background: st.color, borderColor: st.color } : {}}
              onClick={() => handleStore(st.slug)}
            >
              {st.name}
            </button>
          ))}
        </div>
      </div>

      <div className={s.layout}>
        {/* Sidebar - subcategories */}
        {currentCat && currentCat.children?.length > 0 && (
          <aside className={s.sidebar}>
            <div className={s.filterSection}>
              <div className={s.filterTitle}>Подкатегории</div>
              <div
                className={!subcategory ? s.filterItemActive : s.filterItem}
                onClick={() => { const p = new URLSearchParams(searchParams); p.delete('sub'); setSearchParams(p); }}
              >
                Все
              </div>
              {currentCat.children.map(child => (
                <div
                  key={child.name}
                  className={subcategory === child.name ? s.filterItemActive : s.filterItem}
                  onClick={() => handleSub(child.name)}
                >
                  {child.name}
                  <span className={s.filterCount}>{child.count?.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* Products */}
        <div className={s.main}>
          <ProductGrid
            products={products}
            loading={loading}
            hasMore={page < totalPages}
            onLoadMore={handleLoadMore}
          />
        </div>
      </div>
    </div>
  );
}
