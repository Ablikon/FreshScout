import { Link } from 'react-router-dom';
import { cartStore, updateQuantity, clearCart } from '../../store';
import Icon from '../../components/Icon/Icon';
import STORE_ICONS from '../../components/Icon/storeIcons';
import s from './Cart.module.css';

const STORE_COLORS = {
  airba: '#FF6B35', arbuz: '#00C853', magnum: '#E53935', wolt: '#009DE0', yandex: '#FFCC00',
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

  return (
    <div className={s.page}>
      <h1 className={s.title}>Корзина ({items.reduce((sum, i) => sum + i.quantity, 0)} товаров)</h1>

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
              </div>
              <div className={s.itemQty}>
                <button className={s.qtyBtn} onClick={() => updateQuantity(item._id, item.quantity - 1)}>−</button>
                <span className={s.qty}>{item.quantity}</span>
                <button className={s.qtyBtn} onClick={() => updateQuantity(item._id, item.quantity + 1)}>+</button>
              </div>
              <span className={s.itemPrice}>{(item.cost * item.quantity).toLocaleString()} ₸</span>
            </div>
          ))}
        </div>
      ))}

      <div className={s.summary}>
        {storeGroups.map(group => (
          <div key={group.store} className={s.summaryRow}>
            <span>{group.storeName}</span>
            <span>{group.subtotal.toLocaleString()} ₸</span>
          </div>
        ))}
        <div className={s.summaryTotal}>
          <span>Итого</span>
          <span>{total.toLocaleString()} ₸</span>
        </div>
        <button className={s.checkoutBtn}>
          Оформить заказ — {total.toLocaleString()} ₸
        </button>
        <button className={s.clearBtn} onClick={clearCart}>
          Очистить корзину
        </button>
      </div>
    </div>
  );
}
