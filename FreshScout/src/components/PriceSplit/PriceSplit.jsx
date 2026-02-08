import styles from "./PriceSplit.module.css";
import Badge from "../Ui/Badge.jsx";
import VendorPill from "../VendorPill/VendorPill.jsx";

function fmt(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  return new Intl.NumberFormat("ru-RU").format(v);
}

export default function PriceSplit({ data }) {
  if (!data) return null;

  const t = data.totals;
  if (!data.vendorGroups?.length) {
    return (
      <div className={styles.wrap}>
        <div className={styles.top}>
          <div className={styles.h}>Оптимизация корзины</div>
          <div className={styles.sub}>Нет предложений по товарам.</div>
        </div>

        <div className={styles.sumCard}>
          <div className={styles.k}>Причина</div>
          <div className={styles.m}>
            Для товаров в корзине нет цен в offers.js (OFFERS_BY_PRODUCT).
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={styles.wrap}>
      <div className={styles.top}>
        <div className={styles.h}>Оптимизация корзины</div>
        <div className={styles.sub}>Лучший источник по каждой позиции.</div>
      </div>

      <div className={styles.summary}>
        <div className={styles.sumCard}>
          <div className={styles.k}>Итого у нас</div>
          <div className={styles.v}>{fmt(t.optimizedTotal)} ₸</div>
          <div className={styles.m}>
            Товары: {fmt(t.optimizedItemsSum)} ₸ • Доставка:{" "}
            {fmt(t.optimizedDeliverySum)} ₸
          </div>
        </div>

        <div className={styles.sumCard}>
          <div className={styles.k}>Если бы всё в одном</div>
          <div className={styles.v}>{fmt(t.baselineTotal)} ₸</div>
          <div className={styles.m}>База: {t.baselineVendorId}</div>
        </div>

        <div className={styles.sumCard}>
          <div className={styles.k}>Экономия</div>
          <div className={styles.v}>
            {t.savings > 0 ? fmt(t.savings) : "0"} ₸
          </div>
          <div className={styles.m}>
            {t.savings > 0 ? (
              <Badge tone="good">выгоднее</Badge>
            ) : (
              <Badge tone="neutral">без экономии</Badge>
            )}
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        {data.vendorGroups.map((g) => (
          <div key={g.vendor.id} className={styles.group}>
            <div className={styles.gTop}>
              <div className={styles.vendor}>
                <VendorPill vendor={g.vendor} />
                <div className={styles.vText}>
                  <div className={styles.vMeta}>
                    Доставка: {fmt(g.delivery)} ₸ • Товары: {fmt(g.itemsSum)} ₸
                    {g.minFee ? ` • Мин. сумма: +${fmt(g.minFee)} ₸` : ""}
                  </div>
                </div>
              </div>

              <div className={styles.gTotal}>{fmt(g.total)} ₸</div>
            </div>

            <div className={styles.list}>
              {g.lines.map((l) => (
                <div key={l.productId} className={styles.row}>
                  <div className={styles.rLeft}>
                    <div className={styles.rThumb}>{l.img ?? "🛍️"}</div>
                    <div>
                      <div className={styles.rTitle}>{l.title}</div>
                      <div className={styles.rMeta}>
                        {l.unit} • x{l.qty}
                      </div>
                    </div>
                  </div>
                  <div className={styles.rRight}>
                    <div className={styles.rPrice}>{fmt(l.bestLineSum)} ₸</div>
                    <div className={styles.rUnit}>
                      {fmt(l.bestUnitPrice)} ₸ / шт
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
