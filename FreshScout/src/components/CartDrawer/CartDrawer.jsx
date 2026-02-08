import styles from "./CartDrawer.module.css";
import Button from "../Ui/Button.jsx";
import { Icon } from "../Ui/Icon.jsx";
import { useCart } from "../../store/cartStore.js";
import { useNavigate } from "react-router-dom";

export default function CartDrawer({ open, onClose }) {
  const cart = useCart();
  const nav = useNavigate();

  return (
    <div className={[styles.overlay, open ? styles.open : ""].join(" ")}>
      <div className={styles.backdrop} onClick={onClose} />
      <aside className={styles.drawer}>
        <div className={styles.top}>
          <div className={styles.h}>
            <span className={styles.cart}><Icon name="cart" /></span>
            Корзина
          </div>
          <button className={styles.x} onClick={onClose} aria-label="Закрыть">×</button>
        </div>

        {cart.items.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.big}>Пока пусто</div>
            <div className={styles.small}>Добавь товары из каталога</div>
          </div>
        ) : (
          <div className={styles.list}>
            {cart.items.map((it) => (
              <div key={it.productId} className={styles.row}>
                <div className={styles.meta}>
                  <div className={styles.title}>{it.title}</div>
                  <div className={styles.unit}>{it.unit}</div>
                </div>

                <div className={styles.qty}>
                  <button className={styles.qbtn} onClick={() => cart.dec(it.productId)}>-</button>
                  <div className={styles.qnum}>{it.qty}</div>
                  <button className={styles.qbtn} onClick={() => cart.inc(it.productId)}>+</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.bottom}>
          <div className={styles.actions}>
            <Button
              variant="ghost"
              onClick={() => cart.clear()}
              disabled={cart.items.length === 0}
            >
              Очистить
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                onClose?.();
                nav("/checkout");
              }}
              disabled={cart.items.length === 0}
              rightIcon={<Icon name="chev" />}
            >
              Оформить
            </Button>
          </div>

          <div className={styles.note}>
            На чекауте покажем, где выгоднее купить каждый товар.
          </div>
        </div>
      </aside>
    </div>
  );
}
