import styles from "./Checkout.module.css";
import { useCart } from "../../store/cartStore.js";
import PriceSplit from "../../components/PriceSplit/PriceSplit.jsx";
import Button from "../../components/Ui/Button.jsx";
import { buildOptimization } from "../../mocks/optimize.js";
import { useNavigate } from "react-router-dom";

function money(n) {
  const v = Number(n) || 0;
  return v.toLocaleString("ru-RU");
}

export default function Checkout() {
  const cart = useCart();
  const nav = useNavigate();

  const data = cart.items.length ? buildOptimization(cart.items) : null;

  return (
    <div className={styles.page}>
      {/* ===== HEAD ===== */}
      <div className={styles.head}>
        <div className={styles.headTop}>
          <div>
            <div className={styles.h1}>Корзина</div>
            <div className={styles.p}>
              На этом шаге мы “раскидываем” позиции по источникам и считаем итог с доставками.
            </div>
          </div>

          <Button
            variant="ghost"
            onClick={() => nav("/")}
          >
            ← Вернуться в каталог
          </Button>
        </div>
      </div>

      {cart.items.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyCard}>
            <div className={styles.big}>Корзина пустая</div>
            <div className={styles.small}>Вернись в каталог и добавь товары.</div>
            <div className={styles.emptyActions}>
              <Button variant="primary" onClick={() => nav("/")}>В каталог</Button>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.layout}>
          <div className={styles.main}>
            <div className={styles.block}>
              <div className={styles.blockHead}>
                <div className={styles.bh}>Состав заказа</div>
                <div className={styles.bhSub}>
                  Позиций: <b>{cart.totalCount}</b> • Сумма: <b>{money(cart.totalPrice)} ₸</b>
                </div>
              </div>

              <div className={styles.list}>
                {cart.items.map((it) => (
                  <div key={it.productId} className={styles.row}>
                    <div className={styles.left}>
                      <div className={styles.thumb}>
                        {it.imageUrl ? (
                          <img className={styles.thumbImg} src={it.imageUrl} alt={it.title} />
                        ) : (
                          <div className={styles.thumbEmoji}>{it.img ?? "🛍️"}</div>
                        )}
                      </div>

                      <div className={styles.info}>
                        <div className={styles.title}>{it.title}</div>
                        <div className={styles.meta}>
                          <span>{it.unit}</span>
                          <span className={styles.dot}>•</span>
                          <span className={styles.priceOne}>{money(it.price)} ₸ / шт</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.right}>
                      <div className={styles.sum}>
                        {money((Number(it.price) || 0) * (Number(it.qty) || 0))} ₸
                      </div>

                      <div className={styles.actions}>
                        <button className={styles.qbtn} onClick={() => cart.dec(it.productId)} aria-label="Уменьшить">
                          −
                        </button>
                        <div className={styles.qty}>x{it.qty}</div>
                        <button className={styles.qbtn} onClick={() => cart.inc(it.productId)} aria-label="Увеличить">
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.blockBottom}>
                <Button variant="ghost" onClick={() => cart.clear()}>
                  Очистить корзину
                </Button>
              </div>
            </div>

            <PriceSplit data={data} />

            <div className={styles.pay}>
              <div className={styles.payLeft}>
                <div className={styles.payH}>Оплата</div>
                <div className={styles.payP}>
                  Покупайте и экономьте вместе с нами.
                </div>
              </div>

              <div className={styles.payRight}>
                <Button variant="primary" onClick={() => alert("MVP: оплата будет позже")}>
                  Оплатить и оформить • {money(cart.totalPrice)} ₸
                </Button>
              </div>
            </div>
          </div>

          <aside className={styles.summary}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryTitle}>Итого</div>

              <div className={styles.summaryRow}>
                <span>Товары</span>
                <b>{money(cart.totalPrice)} ₸</b>
              </div>

              <div className={styles.summaryRowMuted}>
                <span>Доставка</span>
                <b>—</b>
              </div>

              <div className={styles.summaryDivider} />

              <div className={styles.summaryTotal}>
                <span>К оплате</span>
                <b>{money(cart.totalPrice)} ₸</b>
              </div>

              <Button
                variant="primary"
                full
                onClick={() => alert("MVP: оплата будет позже")}
              >
                Оплатить и оформить
              </Button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
