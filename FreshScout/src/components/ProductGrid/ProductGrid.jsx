import ProductCard, { ProductCardSkeleton } from '../ProductCard/ProductCard';
import Icon from '../Icon/Icon';
import s from './ProductGrid.module.css';

export default function ProductGrid({ products, loading, hasMore, onLoadMore }) {
  if (loading && (!products || products.length === 0)) {
    return (
      <div className={s.grid}>
        {Array.from({ length: 12 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className={s.grid}>
        <div className={s.empty}>
          <div className={s.emptyIcon}><Icon name="search" size={48} /></div>
          <div className={s.emptyText}>Товары не найдены</div>
          <div className={s.emptySub}>Попробуйте изменить фильтры или поисковый запрос</div>
        </div>
      </div>
    );
  }

  return (
    <div className={s.grid}>
      {products.map(product => (
        <ProductCard key={product._id} product={product} />
      ))}
      {loading && Array.from({ length: 4 }).map((_, i) => (
        <ProductCardSkeleton key={`sk-${i}`} />
      ))}
      {hasMore && !loading && (
        <div className={s.loadMore}>
          <button className={s.loadMoreBtn} onClick={onLoadMore}>
            Показать ещё
          </button>
        </div>
      )}
    </div>
  );
}
