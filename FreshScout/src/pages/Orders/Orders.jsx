import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { getOrders } from '../../api';
import Icon from '../../components/Icon/Icon';
import STORE_ICONS from '../../components/Icon/storeIcons';
import s from './Orders.module.css';

const STORE_COLORS = {
  airba: '#FF6B35', arbuz: '#00C853', magnum: '#E53935', wolt: '#009DE0', yandex: '#FFCC00',
};

const STATUS_LABELS = {
  pending: 'Обработка',
  processing: 'В процессе',
  partially_done: 'Частично выполнен',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
};

const STATUS_COLORS = {
  pending: '#f59e0b',
  processing: '#3b82f6',
  partially_done: '#f97316',
  delivered: '#22c55e',
  cancelled: '#ef4444',
};

const SUB_STATUS_LABELS = {
  pending: 'Ожидание',
  processing: 'Обработка',
  picking: 'Сборка',
  delivering: 'Доставка',
  delivered: 'Доставлен',
  failed: 'Ошибка',
  cancelled: 'Отменён',
};

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDate();
  const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const month = months[d.getMonth()];
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month}, ${hours}:${mins}`;
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login?redirect=/orders');
      return;
    }
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await getOrders();
      setOrders(data.orders || []);
      // Auto-expand the newest order if coming from checkout
      if (searchParams.get('new') === '1' && data.orders?.length > 0) {
        setExpandedOrder(data.orders[0]._id);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login?redirect=/orders');
        return;
      }
      setError('Не удалось загрузить заказы');
    } finally {
      setLoading(false);
    }
  };

  if (!token) return null;

  if (loading) {
    return (
      <div className={s.page}>
        <h1 className={s.title}>Мои заказы</h1>
        <div className={s.loading}>
          <div className={s.spinner} />
          <span>Загрузка заказов...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={s.page}>
        <h1 className={s.title}>Мои заказы</h1>
        <div className={s.error}>
          <Icon name="alert-circle" size={20} />
          <span>{error}</span>
          <button className={s.retryBtn} onClick={loadOrders}>Повторить</button>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className={s.page}>
        <h1 className={s.title}>Мои заказы</h1>
        <div className={s.empty}>
          <div className={s.emptyIcon}><Icon name="package" size={56} /></div>
          <h2 className={s.emptyTitle}>Заказов пока нет</h2>
          <p className={s.emptyText}>Соберите корзину с лучшими ценами из 5 магазинов и оформите первый заказ</p>
          <Link to="/" className={s.emptyBtn}>Перейти к покупкам</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={s.page}>
      <h1 className={s.title}>Мои заказы ({orders.length})</h1>

      {searchParams.get('new') === '1' && (
        <div className={s.newOrderBanner}>
          <Icon name="check" size={20} />
          <div>
            <strong>Заказ оформлен!</strong>
            <p>Ваш заказ принят и будет обработан. Каждый магазин доставит свою часть отдельно.</p>
          </div>
        </div>
      )}

      <div className={s.orderList}>
        {orders.map(order => {
          const isExpanded = expandedOrder === order._id;
          const totalItems = order.subOrders?.reduce((sum, sub) => sum + sub.items.length, 0) || 0;

          return (
            <div key={order._id} className={s.orderCard}>
              <button
                className={s.orderHeader}
                onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
              >
                <div className={s.orderHeaderLeft}>
                  <div className={s.orderNumber}>
                    Заказ #{order._id.slice(-6).toUpperCase()}
                  </div>
                  <div className={s.orderDate}>{formatDate(order.createdAt)}</div>
                </div>
                <div className={s.orderHeaderRight}>
                  <span className={s.orderStatus} style={{ color: STATUS_COLORS[order.status], background: STATUS_COLORS[order.status] + '15' }}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                  <span className={s.orderTotal}>{order.total?.toLocaleString()} ₸</span>
                  <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} className={s.chevron} />
                </div>
              </button>

              {isExpanded && (
                <div className={s.orderBody}>
                  {/* Delivery info */}
                  <div className={s.deliveryInfo}>
                    <div className={s.deliveryRow}>
                      <Icon name="map-pin" size={14} />
                      <span>{order.address}{order.apartment ? `, кв. ${order.apartment}` : ''}</span>
                    </div>
                    <div className={s.deliveryRow}>
                      <Icon name="user" size={14} />
                      <span>{order.contactName} · {order.contactPhone}</span>
                    </div>
                    <div className={s.deliveryRow}>
                      <Icon name="credit-card" size={14} />
                      <span>{order.paymentMethod === 'cash' ? 'Наличными' : 'Картой'}</span>
                    </div>
                  </div>

                  {/* Sub-orders by store */}
                  {order.subOrders?.map((sub, idx) => (
                    <div key={idx} className={s.subOrder}>
                      <div className={s.subOrderHeader}>
                        <div className={s.subOrderStore}>
                          {STORE_ICONS[sub.store]
                            ? <img className={s.subOrderLogo} src={STORE_ICONS[sub.store]} alt="" />
                            : <div className={s.subOrderDot} style={{ background: STORE_COLORS[sub.store] }}>{sub.storeName?.[0]}</div>
                          }
                          <span className={s.subOrderName}>{sub.storeName}</span>
                        </div>
                        <span
                          className={s.subOrderStatus}
                          style={{
                            color: sub.status === 'failed' ? '#ef4444' : sub.status === 'delivered' ? '#22c55e' : '#3b82f6',
                          }}
                        >
                          {SUB_STATUS_LABELS[sub.status] || sub.status}
                        </span>
                        <span className={s.subOrderTotal}>{sub.subtotal?.toLocaleString()} ₸</span>
                      </div>

                      {sub.storeError && (
                        <div className={s.subOrderError}>
                          <Icon name="alert-circle" size={14} />
                          {sub.storeError}
                        </div>
                      )}

                      <div className={s.subOrderItems}>
                        {sub.items?.map((item, i) => (
                          <div key={i} className={s.subOrderItem}>
                            <img
                              className={s.subOrderItemImg}
                              src={item.imageUrl?.replace('%w', '48').replace('%h', '48')}
                              alt=""
                              onError={e => { e.target.style.display = 'none'; }}
                            />
                            <div className={s.subOrderItemInfo}>
                              <div className={s.subOrderItemTitle}>{item.title}</div>
                              <div className={s.subOrderItemMeta}>{item.quantity} × {item.cost?.toLocaleString()} ₸</div>
                            </div>
                            <div className={s.subOrderItemPrice}>
                              {(item.cost * item.quantity).toLocaleString()} ₸
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {order.savings > 0 && (
                    <div className={s.orderSavings}>
                      <Icon name="trending-up" size={16} />
                      <span>Вы сэкономили {order.savings.toLocaleString()} ₸ с FreshScout</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
