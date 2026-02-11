import { useNavigate } from 'react-router-dom';
import { cartStore, updateQuantity, removeFromCart, clearCart, closeCart, uiStore } from '../../store';
import Icon from '../Icon/Icon';
import STORE_ICONS from '../Icon/storeIcons';
import s from './CartDrawer.module.css';

const STORE_COLORS = {
  airba: '#FF6B35', arbuz: '#00C853', magnum: '#E53935', wolt: '#009DE0', yandex: '#FFCC00',
};

export default function CartDrawer() {
  const isOpen = uiStore.useStore(s => s.cartOpen);
  const items = cartStore.useStore(s => s.items);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const total = items.reduce((sum, i) => sum + i.cost * i.quantity, 0);

  // Calculate savings: discount + cross-store
  const worstCaseTotal = items.reduce((sum, i) => {
    const prev = (i.prevCost && i.prevCost > i.cost) ? i.prevCost : i.cost;
    const worst = i.maxPrice ? Math.max(prev, i.maxPrice) : prev;
    return sum + worst * i.quantity;
  }, 0);
  const totalSavings = worstCaseTotal - total;

  // Group by store
  const byStore = {};
  for (const item of items) {
    if (!byStore[item.store]) {
      byStore[item.store] = { store: item.store, storeName: item.storeName, subtotal: 0, count: 0 };
    }
    byStore[item.store].subtotal += item.cost * item.quantity;
    byStore[item.store].count += item.quantity;
  }

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <>
      <div className={s.overlay} onClick={closeCart} />
      <div className={s.drawer}>
        <div className={s.header}>
          <h2 className={s.headerTitle}>Корзина</h2>
          <button className={s.closeBtn} onClick={closeCart}>✕</button>
        </div>

        <div className={s.body}>
          {items.length === 0 ? (
            <div className={s.empty}>
              <div className={s.emptyIcon}><Icon name="cart" size={48} /></div>
              <div className={s.emptyText}>Корзина пуста</div>
              <p>Добавьте товары, чтобы собрать лучшую корзину</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item._id} className={s.item}>
                <img
                  className={s.itemImage}
                  src={item.imageUrl?.replace('%w', '128').replace('%h', '128')}
                  alt={item.title}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div className={s.itemInfo}>
                  <div className={s.itemTitle}>{item.title}</div>
                  <div className={s.itemStore}>{item.storeName}</div>
                  <div className={s.itemBottom}>
                    <span className={s.itemPrice}>{(item.cost * item.quantity).toLocaleString()} ₸</span>
                    <div className={s.itemQty}>
                      <button className={item.quantity === 1 ? s.removeBtn : s.qtyBtn} onClick={() => updateQuantity(item._id, item.quantity - 1)}>
                        {item.quantity === 1 ? <Icon name="trash" size={14} /> : '−'}
                      </button>
                      <span className={s.qty}>{item.quantity}</span>
                      <button className={s.qtyBtn} onClick={() => updateQuantity(item._id, item.quantity + 1)}>+</button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className={s.footer}>
            {Object.values(byStore).length > 1 && (
              <div className={s.storeBreakdown}>
                {Object.values(byStore).map(st => (
                  <div key={st.store} className={s.storeRow}>
                    <span className={s.storeRowLabel}>
                      {STORE_ICONS[st.store]
                        ? <img className={s.storeIcon} src={STORE_ICONS[st.store]} alt="" />
                        : <span className={s.storeDot} style={{ background: STORE_COLORS[st.store] }} />
                      }
                      {st.storeName} ({st.count})
                    </span>
                    <span>{st.subtotal.toLocaleString()} ₸</span>
                  </div>
                ))}
              </div>
            )}
            {totalSavings > 0 && (
              <div className={s.savingsRow}>
                <span className={s.savingsLabel}>
                  <Icon name="trending-up" size={14} />
                  Экономия
                </span>
                <span className={s.savingsValue}>−{totalSavings.toLocaleString()} ₸</span>
              </div>
            )}
            <div className={s.totalRow}>
              <span className={s.totalLabel}>Итого</span>
              <span className={s.totalValue}>{total.toLocaleString()} ₸</span>
            </div>
            <button className={s.checkoutBtn} onClick={handleCheckout}>
              Оформить заказ
            </button>
            <button className={s.clearBtn} onClick={clearCart}>
              Очистить корзину
            </button>
          </div>
        )}
      </div>
    </>
  );
}
