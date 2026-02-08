import { useMemo, useState } from "react";
import styles from "./Favorites.module.css";
import { PRODUCTS, STORES } from "../../mocks/products.js";
import ProductCard from "../../components/ProductCard/ProductCard.jsx";
import SearchBar from "../../components/SearchBar/SearchBar.jsx";
import StoreBar from "../../components/StoreBar/StoreBar.jsx";
import CartSidebar from "../../components/CartSidebar/CartSidebar.jsx";
import Button from "../../components/Ui/Button.jsx";
import { Icon } from "../../components/Ui/Icon.jsx";
import { useFavorites } from "../../store/favoritesStore.js";

export default function Favorites() {
  const fav = useFavorites();
  const [q, setQ] = useState("");
  const [storeId, setStoreId] = useState(null);

  const items = useMemo(() => {
    const qn = q.trim().toLowerCase();
    const idsSet = new Set(fav.ids);

    return PRODUCTS.filter((p) => {
      const isFav = idsSet.has(p.id);
      const okStore = storeId ? p.stores?.includes(storeId) : true;
      const okQ = qn ? p.title.toLowerCase().includes(qn) : true;
      return isFav && okStore && okQ;
    });
  }, [fav.ids, q, storeId]);

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <div className={styles.titleRow}>
          <div className={styles.info}>Сохранённые товары — {fav.count}</div>

          <SearchBar
            value={q}
            onChange={setQ}
            placeholder="Искать в избранном"
          />

          <StoreBar stores={STORES} value={storeId} onChange={setStoreId} />

          <Button
            variant="ghost"
            onClick={() => fav.clear()}
            disabled={fav.count === 0}
            leftIcon={<Icon name="star" />}
          >
            Очистить
          </Button>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.contentScroll}>
          {fav.count === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>⭐</div>
              <div className={styles.emptyTitle}>Пока пусто</div>
              <div className={styles.emptyText}>
                Добавь товары в избранное — и они появятся здесь.
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>🔎</div>
              <div className={styles.emptyTitle}>Ничего не найдено</div>
              <div className={styles.emptyText}>
                Попробуй изменить поиск или магазин.
              </div>
            </div>
          ) : (
            <div className={styles.grid}>
              {items.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          )}
        </div>
      </div>
      <CartSidebar />
    </div>
  );
}
