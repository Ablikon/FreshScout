import { useState } from "react";
import styles from "./ProductCard.module.css";
import Badge from "../Ui/Badge.jsx";
import { useCart } from "../../store/cartStore.js";
import { Icon } from "../Ui/Icon.jsx";
import { useFavorites } from "../../store/favoritesStore.js";

export default function ProductCard({ p }) {
  const cart = useCart();
  const fav = useFavorites();
  const [added, setAdded] = useState(false);

  function onAdd() {
    cart.add(p);
    setAdded(true);
    window.clearTimeout(onAdd._t);
    onAdd._t = window.setTimeout(() => setAdded(false), 550);
  }

  return (
    <article className={styles.card}>
      <button
        className={[styles.favBtn, fav.has(p.id) ? styles.favOn : ""].join(" ")}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          fav.toggle(p);
        }}
        aria-label={fav.has(p.id) ? "Убрать из избранного" : "Добавить в избранное"}
      >
        <Icon name="star" />
      </button>

      <div className={styles.media}>
        <div className={styles.mediaInner}>{p.img}</div>
      </div>

      <div className={styles.body}>
        <div className={styles.topRow}>
          <Badge tone="neutral">{p.unit}</Badge>
          <div className={styles.price}>{p.price} ₸</div>
        </div>

        <div className={styles.title}>{p.title}</div>

        <div className={styles.actions}>
          <button
            className={[styles.add, added ? styles.added : ""].join(" ")}
            onClick={onAdd}
            aria-label="Добавить в корзину"
          >
            {added ? <Icon name="check" /> : <Icon name="plus" />}
          </button>
        </div>
      </div>
    </article>
  );
}
