import styles from "./CartSidebar.module.css";
import Button from "../Ui/Button.jsx";
import { Icon } from "../Ui/Icon.jsx";
import { useCart } from "../../store/cartStore.js";
import { useNavigate } from "react-router-dom";

export default function CartSidebar() {
  const cart = useCart();
  const nav = useNavigate();

  return (
    <aside className={styles.cartSidebar}>
      <div className={styles.top}>
        <div className={styles.cartTitle}>
          <span className={styles.cartIcon}>
            <Icon name="cart" />
          </span>
          Корзина
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => cart.clear()}
          disabled={cart.items.length === 0}
        >
          Очистить
        </Button>
      </div>

      {cart.items.length === 0 ? (
        <div className={styles.emptyCart}>
          <div className={styles.emptyCartIcon}>🛒</div>
          <div className={styles.emptyCartText}>
            В корзине пока ничего нет. Добавь товары из каталога.
          </div>
        </div>
      ) : (
        <div className={styles.cartItems}>
          {cart.items.map((it) => (
            <div key={it.productId} className={styles.row}>
              <div className={styles.meta}>
                <div className={styles.title}>{it.title}</div>
                <div className={styles.sub}>
                  <span className={styles.unit}>{it.unit}</span>
                  <span className={styles.dot}>•</span>
                  <span className={styles.priceSmall}>{it.price} ₸</span>
                </div>
              </div>

              <div className={styles.qty}>
                <button
                  className={styles.qbtn}
                  onClick={() => cart.dec(it.productId)}
                  aria-label="Уменьшить"
                >
                  −
                </button>
                <div className={styles.qnum}>{it.qty}</div>
                <button
                  className={styles.qbtn}
                  onClick={() => cart.inc(it.productId)}
                  aria-label="Увеличить"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.bottom}>
        <div className={styles.totalRow}>
          <span>Итого</span>
          <b>{cart.totalPrice} ₸</b>
        </div>

        <div className={styles.checkoutRow}>
          <Button
            variant="primary"
            onClick={() => nav("/checkout")}
            disabled={cart.items.length === 0}
            full
          >
            Оформить заказ
          </Button>
        </div>
      </div>
    </aside>
  );
}
