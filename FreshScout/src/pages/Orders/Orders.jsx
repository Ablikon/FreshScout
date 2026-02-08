import styles from "./Orders.module.css";
import { ORDERS } from "../../mocks/orders.js";
import Button from "../../components/Ui/Button.jsx";

function statusLabel(s) {
  if (s === "delivered") return "Доставлен";
  if (s === "processing") return "В обработке";
  if (s === "canceled") return "Отменён";
  return s;
}

function statusClass(s) {
  if (s === "delivered") return styles.delivered;
  if (s === "processing") return styles.processing;
  if (s === "canceled") return styles.canceled;
  return "";
}

export default function Orders() {
  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <div className={styles.h}>История покупок</div>
        <div className={styles.p}>История твоих заказов и их статусы</div>
      </div>

      {ORDERS.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📦</div>
          <div className={styles.emptyTitle}>Заказов пока нет</div>
          <div className={styles.emptyText}>
            Сделай заказ в каталоге — и он появится здесь.
          </div>
        </div>
      ) : (
        <div className={styles.list}>
          {ORDERS.map((o) => (
            <div key={o.id} className={styles.card}>
              <div className={styles.top}>
                <div>
                  <div className={styles.orderId}>{o.id}</div>
                  <div className={styles.date}>{o.date}</div>
                </div>

                <div className={`${styles.status} ${statusClass(o.status)}`}>
                  {statusLabel(o.status)}
                </div>
              </div>

              <div className={styles.items}>
                {o.items.slice(0, 3).map((it, i) => (
                  <div key={i} className={styles.item}>
                    <span className={styles.itemTitle}>{it.title}</span>
                    <span className={styles.itemMeta}>
                      {it.unit} × {it.qty}
                    </span>
                  </div>
                ))}

                {o.items.length > 3 && (
                  <div className={styles.more}>
                    + ещё {o.items.length - 3} позиций
                  </div>
                )}
              </div>

              <div className={styles.bottom}>
                <div className={styles.total}>
                  Итого: <b>{o.total.toLocaleString("ru-RU")} ₸</b>
                </div>

                <Button
                  variant="ghost"
                  onClick={() => alert("MVP: повтор заказа будет позже")}
                >
                  Повторить заказ
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
