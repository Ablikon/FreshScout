import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchProducts } from '../../api';
import { cityStore } from '../../store';
import ProductGrid from '../../components/ProductGrid/ProductGrid';
import s from './Search.module.css';

export default function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const city = cityStore.useStore(s => s.city);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    setPage(1);
    searchProducts({ search: q, city, limit: 40, sort: 'price_asc' })
      .then(data => {
        setProducts(data.products || []);
        setTotalPages(data.pagination?.totalPages || 1);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [q, city]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    searchProducts({ search: q, city, page: next, limit: 40, sort: 'price_asc' })
      .then(data => setProducts(prev => [...prev, ...(data.products || [])]))
      .catch(() => {});
  };

  return (
    <div className={s.page}>
      <h1 className={s.title}>
        {q ? `Результаты поиска: «${q}»` : 'Поиск'}
      </h1>
      <ProductGrid
        products={products}
        loading={loading}
        hasMore={page < totalPages}
        onLoadMore={handleLoadMore}
      />
    </div>
  );
}
