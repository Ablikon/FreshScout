import { Link } from 'react-router-dom';
import { cartStore, updateQuantity, clearCart } from '../../store';
import Icon from '../../components/Icon/Icon';
import STORE_ICONS from '../../components/Icon/storeIcons';
import s from './Cart.module.css';

const STORE_COLORS = {
  airba: '#FF6B35', arbuz: '#00C853', magnum: '#E53935', wolt: '#009DE0', yandex: '#FFCC00',
};

const STORE_NAMES = {
  airba: 'Airba Fresh', arbuz: 'Arbuz', magnum: 'Magnum', wolt: 'Wolt', yandex: 'Yandex Lavka',
};

export default function CartPage() {
  const items = cartStore.useStore(s => s.items);

  if (items.length === 0) {
    return (
      <div className={s.page}>
        <h1 className={s.title}>Корзина</h1>
        <div className={s.empty}>
          <div className={s.emptyIcon}><Icon name="cart" size={56} /></div>
          <h2 className={s.emptyTitle}>Корзина пуста</h2>
          <p className={s.emptyText}>Добавьте товары, чтобы собрать лучшую корзину из разных магазинов</p>
          <Link to="/" className={s.emptyBtn}>Перейти к покупкам</Link>
        </div>
      </div>
    );
  }

  // Group by store
  const byStore = {};
  for (const item of items) {
    if (!byStore[item.store]) {
      byStore[item.store] = { store: item.store, storeName: item.storeName, items: [], subtotal: 0 };
    }
    byStore[item.store].items.push(item);
    byStore[item.store].subtotal += item.cost * item.quantity;
  }

  const total = items.reduce((sum, i) => sum + i.cost * i.quantity, 0);
  const storeGroups = Object.values(byStore);
  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);

  // ── Advanced savings calculation ──
  // 1) Discount savings: prevCost vs cost (store's own discount)
  const totalWithoutDiscount = items.reduce((sum, i) => {
    const orig = (i.prevCost && i.prevCost > i.cost) ? i.prevCost : i.cost;
    return sum + orig * i.quantity;
  }, 0);
  const discountSavings = totalWithoutDiscount - total;

  // 2) Cross-store savings: items where user got the cheapest option
  //    Each cart item has `maxPrice` if user chose it via comparison page
  const crossStoreSavings = items.reduce((sum, i) => {
    if (i.maxPrice && i.maxPrice > i.cost) {
      return sum + (i.maxPrice - i.cost) * i.quantity;
    }
    return sum;
  }, 0);

  // 3) Combined: approximate "worst case" cost
  //    Use prevCost (or cost) as upper bound, and if maxPrice > prevCost, use maxPrice
  const worstCaseTotal = items.reduce((sum, i) => {
    const prev = (i.prevCost && i.prevCost > i.cost) ? i.prevCost : i.cost;
    const worst = i.maxPrice ? Math.max(prev, i.maxPrice) : prev;
    return sum + worst * i.quantity;
  }, 0);
  const totalSavings = worstCaseTotal - total;
  const savingsPct = worstCaseTotal > 0 ? Math.round((totalSavings / worstCaseTotal) * 100) : 0;

  // Count how many items had cross-store comparison
  const comparedItems = items.filter(i => i.maxPrice && i.maxPrice > i.cost).length;

  // Unique stores used
  const uniqueStores = Object.keys(byStore);

  return (
    <div className={s.page}>
      <h1 className={s.title}>Корзина ({totalCount} товаров)</h1>

      {storeGroups.map(group => (
        <div key={group.store} className={s.storeGroup}>
          <div className={s.storeHeader}>
            <div className={s.storeLogoWrap}>
              {STORE_ICONS[group.store]
                ? <img className={s.storeLogo} src={STORE_ICONS[group.store]} alt={group.storeName} />
                : <div className={s.storeDot} style={{ background: STORE_COLORS[group.store] }}>{group.storeName[0]}</div>
              }
            </div>
            <span className={s.storeName}>{group.storeName}</span>
            <span className={s.storeCount}>{group.items.length} товаров · {group.subtotal.toLocaleString()} ₸</span>
          </div>
          {group.items.map(item => (
            <div key={item._id} className={s.item}>
              <img
                className={s.itemImage}
                src={item.imageUrl?.replace('%w', '112').replace('%h', '112')}
                alt=""
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div className={s.itemInfo}>
                <div className={s.itemTitle}>{item.title}</div>
                <div className={s.itemMeasure}>{item.measure}</div>
                {item.maxPrice && item.maxPrice > item.cost && (
                  <div className={s.itemSaved}>
                    Дешевле на {(item.maxPrice - item.cost).toLocaleString()} ₸
                    <span className={s.itemSavedFrom}> (до {item.maxPrice.toLocaleString()} ₸ в других)</span>
                  </div>
                )}
              </div>
              <div className={s.itemQty}>
                <button className={s.qtyBtn} onClick={() => updateQuantity(item._id, item.quantity - 1)}>−</button>
                <span className={s.qty}>{item.quantity}</span>
                <button className={s.qtyBtn} onClick={() => updateQuantity(item._id, item.quantity + 1)}>+</button>
              </div>
              <div className={s.itemPriceCol}>
                <span className={s.itemPrice}>{(item.cost * item.quantity).toLocaleString()} ₸</span>
                {item.prevCost > item.cost && item.prevCost > 0 && (
                  <span className={s.itemOldPrice}>{(item.prevCost * item.quantity).toLocaleString()} ₸</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}

      <div className={s.summary}>
        <h2 className={s.summaryTitle}>Ваш заказ</h2>
        {storeGroups.map(group => (
          <div key={group.store} className={s.summaryRow}>
            <span className={s.summaryStoreLabel}>
              {STORE_ICONS[group.store]
                ? <img className={s.summaryStoreLogo} src={STORE_ICONS[group.store]} alt="" />
                : <span className={s.summaryStoreDot} style={{ background: STORE_COLORS[group.store] }} />
              }
              {group.storeName}
            </span>
            <span>{group.subtotal.toLocaleString()} ₸</span>
          </div>
        ))}

        {/* ── Savings Dashboard ── */}
        {totalSavings > 0 && (
          <div className={s.savingsDash}>
            <div className={s.savingsDashHeader}>
              <div className={s.savingsIconCircle}>
                <Icon name="trending-up" size={22} />
              </div>
              <div>
                <div className={s.savingsDashTitle}>Вы экономите с FreshScout</div>
                <div className={s.savingsDashSub}>
                  Собрали лучшие цены из {uniqueStores.length} магазинов
                </div>
              </div>
              <div className={s.savingsBigAmount}>−{totalSavings.toLocaleString()} ₸</div>
            </div>

            {/* Visual savings bar */}
            <div className={s.savingsBarWrap}>
              <div className={s.savingsBarLabels}>
                <span>Без FreshScout — {worstCaseTotal.toLocaleString()} ₸</span>
                <span className={s.savingsBarPct}>−{totalSavings.toLocaleString()} ₸</span>
              </div>
              <div className={s.savingsBarTrack}>
                <div
                  className={s.savingsBarFill}
                  style={{ width: `${100 - savingsPct}%` }}
                />
                <div className={s.savingsBarSaved} style={{ width: `${savingsPct}%` }} />
              </div>
              <div className={s.savingsBarLabels}>
                <span className={s.savingsBarYou}>С FreshScout — {total.toLocaleString()} ₸</span>
              </div>
            </div>

            {/* Breakdown chips */}
            <div className={s.savingsChips}>
              {discountSavings > 0 && (
                <div className={s.savingsChip}>
                  <Icon name="tag" size={14} />
                  <span>Скидки магазинов: −{discountSavings.toLocaleString()} ₸</span>
                </div>
              )}
              {crossStoreSavings > 0 && (
                <div className={s.savingsChip}>
                  <Icon name="search" size={14} />
                  <span>Сравнение цен: −{crossStoreSavings.toLocaleString()} ₸</span>
                </div>
              )}
              {comparedItems > 0 && (
                <div className={s.savingsChip}>
                  <Icon name="check" size={14} />
                  <span>{comparedItems} из {items.length} товаров — лучшая цена</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Smart facts */}
        <div className={s.factBar}>
          <div className={s.factItem}>
            <div className={s.factIcon}><Icon name="search" size={18} /></div>
            <div className={s.factText}>
              <strong>5 магазинов</strong>
              <span>сравнили для вас</span>
            </div>
          </div>
          <div className={s.factDivider} />
          <div className={s.factItem}>
            <div className={s.factIcon}><Icon name="cart" size={18} /></div>
            <div className={s.factText}>
              <strong>{uniqueStores.length} {uniqueStores.length === 1 ? 'магазин' : uniqueStores.length < 5 ? 'магазина' : 'магазинов'}</strong>
              <span>в вашей корзине</span>
            </div>
          </div>
          <div className={s.factDivider} />
          <div className={s.factItem}>
            <div className={s.factIcon}><Icon name="trending-up" size={18} /></div>
            <div className={s.factText}>
              <strong>{totalSavings > 0 ? `−${totalSavings.toLocaleString()} ₸` : 'Лучшие цены'}</strong>
              <span>{totalSavings > 0 ? 'ваша экономия' : 'уже найдены'}</span>
            </div>
          </div>
        </div>

        <div className={s.summaryTotal}>
          <span>Итого</span>
          <span>{total.toLocaleString()} ₸</span>
        </div>
        <button className={s.checkoutBtn}>
          <Icon name="cart" size={20} />
          Оформить заказ — {total.toLocaleString()} ₸
        </button>
        <button className={s.clearBtn} onClick={clearCart}>
          Очистить корзину
        </button>
      </div>
    </div>
  );
}
