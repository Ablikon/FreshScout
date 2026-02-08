import { favoritesStore } from '../../store';
import Icon from '../../components/Icon/Icon';
import ProductGrid from '../../components/ProductGrid/ProductGrid';
import s from './Favorites.module.css';

export default function FavoritesPage() {
  const favorites = favoritesStore.useStore(st => st.items);

  return (
    <div className={s.page}>
      <h1 className={s.title}><Icon name="heart" size={24} style={{ marginRight: 8 }} /> Избранное ({favorites.length})</h1>
      {favorites.length === 0 ? (
        <div className={s.empty}>
          <Icon name="heart" size={48} style={{ opacity: 0.3 }} />
          <h2>Нет избранных товаров</h2>
          <p>Нажмите на сердце на карточке товара, чтобы добавить в избранное</p>
        </div>
      ) : (
        <ProductGrid products={favorites} loading={false} />
      )}
    </div>
  );
}
