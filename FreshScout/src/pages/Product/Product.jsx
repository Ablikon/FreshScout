import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchProduct } from '../../api';
import { addToCart, cartStore, toggleFavorite, isFavorite, favoritesStore } from '../../store';
import Icon from '../../components/Icon/Icon';
import STORE_ICONS from '../../components/Icon/storeIcons';
import s from './Product.module.css';

const STORE_COLORS = {
  airba: '#FF6B35', arbuz: '#00C853', magnum: '#E53935', wolt: '#009DE0', yandex: '#FFCC00',
};

/**
 * Normalize a measure string to something readable & consistent.
 * "1 шт" → extract volume from title, "литры" → extract from title, "500 мл" → "500 мл"
 */
function normalizeMeasure(product) {
  const measure = (product.measure || '').trim();
  const title = product.title || '';

  // If measure is already clear (e.g. "500 мл", "1 л", "250 мл")
  if (/\d+\s*мл/i.test(measure)) return measure;
  if (/\d+[.,]?\d*\s*л/i.test(measure) && !/литр/i.test(measure)) return measure;
  if (/\d+\s*(г|кг)/i.test(measure)) return measure;

  // Try to extract volume from title
  let m = title.match(/(\d+[.,]\d+)\s*л/i);
  if (m) return `${m[1].replace(',', '.')} л`;

  m = title.match(/(\d+)\s*мл/i);
  if (m) return `${m[1]} мл`;

  m = title.match(/(\d+)\s*л(?:\b|$)/i);
  if (m && parseInt(m[1]) <= 20) return `${m[1]} л`;

  m = title.match(/(\d+[.,]?\d*)\s*(г|кг)/i);
  if (m) return `${m[1]} ${m[2]}`;

  // Fallback
  if (measure && measure !== '1 шт' && measure !== '1 шт.' && measure !== 'литры') {
    return measure;
  }
  return '';
}

/**
 * Build deduplicated, sorted offers list.
 * Keeps one product per store (cheapest from each store), sorted by price asc.
 */
function buildOffers(product, alternatives) {
  if (!product) return [];
  const all = [product, ...alternatives];
  const byStore = {};
  for (const p of all) {
    const key = p.store;
    if (!byStore[key] || p.cost < byStore[key].cost) {
      byStore[key] = p;
    }
  }
  return Object.values(byStore).sort((a, b) => a.cost - b.cost);
}

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  favoritesStore.useStore(st => st.items);
  cartStore.useStore(st => st.items);

  useEffect(() => {
    setLoading(true);
    fetchProduct(id)
      .then(data => {
        setProduct(data.product);
        setAlternatives(data.alternatives || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  // Build deduplicated offers
  const offers = buildOffers(product, alternatives);
  const cheapest = offers[0] || null;
  const mostExpensive = offers[offers.length - 1] || null;

  // Auto-select cheapest on load
  useEffect(() => {
    if (cheapest) setSelected(cheapest._id);
  }, [cheapest?._id]);

  if (loading) {
    return (
      <div className={s.loading}>
        <div className={s.spinner} />
        <span>Загрузка...</span>
      </div>
    );
  }
  if (!product) return <div className={s.loading}>Товар не найден</div>;

  const activeProduct = selected
    ? offers.find(o => o._id === selected) || cheapest || product
    : cheapest || product;

  const fav = isFavorite(activeProduct._id);
  const storeColor = STORE_COLORS[activeProduct.store] || '#666';

  // Savings: how much more the most expensive option costs vs cheapest
  const savingsAmount = mostExpensive && cheapest && mostExpensive.cost > cheapest.cost
    ? mostExpensive.cost - cheapest.cost : 0;
  const savingsPercent = savingsAmount > 0
    ? Math.round((savingsAmount / mostExpensive.cost) * 100) : 0;

  return (
    <div className={s.page}>
      {/* Breadcrumb */}
      <div className={s.breadcrumb}>
        <Link to="/">Главная</Link>
        <span className={s.sep}><Icon name="chevron-right" size={12} /></span>
        <Link to={`/category/${encodeURIComponent(product.categoryParent)}`}>{product.categoryParent}</Link>
        <span className={s.sep}><Icon name="chevron-right" size={12} /></span>
        <span className={s.crumbCurrent}>{product.title}</span>
      </div>

      <div className={s.layout}>
        {/* Image */}
        <div className={s.imageCol}>
          <div className={s.imageBox}>
            {activeProduct.discount > 0 && (
              <span className={s.imageBadge}>−{activeProduct.discount}%</span>
            )}
            <img
              className={s.image}
              src={activeProduct.imageUrl?.replace('%w', '600').replace('%h', '600')}
              alt={activeProduct.title}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        </div>

        {/* Info */}
        <div className={s.infoCol}>
          <div className={s.storeBadge} style={{ background: storeColor }}>
            {STORE_ICONS[activeProduct.store] && (
              <img className={s.storeIcon} src={STORE_ICONS[activeProduct.store]} alt="" />
            )}
            {activeProduct.storeName}
          </div>

          <h1 className={s.title}>{activeProduct.title}</h1>
          {normalizeMeasure(activeProduct) && <p className={s.measure}>{normalizeMeasure(activeProduct)}</p>}
          {activeProduct.brand && <p className={s.brand}>Бренд: {activeProduct.brand}</p>}

          <div className={s.priceBlock}>
            <span className={s.price}>{activeProduct.cost?.toLocaleString()} ₸</span>
            {activeProduct.prevCost > activeProduct.cost && activeProduct.prevCost > 0 && (
              <span className={s.oldPrice}>{activeProduct.prevCost?.toLocaleString()} ₸</span>
            )}
            {activeProduct.discount > 0 && (
              <span className={s.discountBadge}>−{activeProduct.discount}%</span>
            )}
          </div>

          {savingsAmount > 0 && selected === cheapest?._id && (
            <div className={s.savingsHint}>
              <Icon name="trending-up" size={16} />
              Выгоднее на {savingsAmount.toLocaleString()} ₸ ({savingsPercent}%) чем в других магазинах
            </div>
          )}

          <div className={s.actions}>
            <button className={s.addBtn} onClick={() => addToCart({
              ...activeProduct,
              maxPrice: mostExpensive && mostExpensive.cost > activeProduct.cost ? mostExpensive.cost : undefined,
            })}>
              <Icon name="cart" size={18} />
              Добавить в корзину
            </button>
            <button className={`${s.favBtn} ${fav ? s.favActive : ''}`} onClick={() => toggleFavorite(activeProduct)}>
              <Icon name={fav ? 'heart-filled' : 'heart'} size={22} />
            </button>
          </div>

          {activeProduct.url && (
            <a href={activeProduct.url} target="_blank" rel="noopener noreferrer" className={s.linkBtn}>
              Открыть в {activeProduct.storeName} <Icon name="external-link" size={14} />
            </a>
          )}
        </div>
      </div>

      {/* ── Price Comparison (Kaspi-style) ── */}
      {offers.length > 1 && (
        <div className={s.comparison}>
          <div className={s.compHeader}>
            <Icon name="tag" size={20} />
            <h2 className={s.compTitle}>Цены в {offers.length} магазинах</h2>
            {savingsAmount > 0 && (
              <span className={s.compSavings}>Экономия до {savingsAmount.toLocaleString()} ₸</span>
            )}
          </div>

          <div className={s.offerList}>
            {offers.map((offer, i) => {
              const isCheap = i === 0;
              const isActive = selected === offer._id;
              const oStoreColor = STORE_COLORS[offer.store] || '#666';

              return (
                <button
                  key={offer._id}
                  className={`${s.offerRow} ${isActive ? s.offerActive : ''} ${isCheap ? s.offerCheapest : ''}`}
                  onClick={() => setSelected(offer._id)}
                >
                  {/* Radio */}
                  <div className={`${s.radio} ${isActive ? s.radioChecked : ''}`}>
                    {isActive && <div className={s.radioDot} />}
                  </div>

                  {/* Store logo + name */}
                  <div className={s.offerStore}>
                    <div className={s.offerLogoWrap} style={{ borderColor: oStoreColor }}>
                      {STORE_ICONS[offer.store]
                        ? <img className={s.offerLogo} src={STORE_ICONS[offer.store]} alt="" />
                        : <span className={s.offerLogoDot} style={{ background: oStoreColor }}>{offer.storeName[0]}</span>
                      }
                    </div>
                    <div className={s.offerStoreInfo}>
                      <span className={s.offerStoreName}>{offer.storeName}</span>
                      <span className={s.offerMeasure}>{normalizeMeasure(offer)}</span>
                    </div>
                  </div>

                  {/* Price block */}
                  <div className={s.offerPriceCol}>
                    {isCheap && <span className={s.cheapLabel}>Лучшая цена</span>}
                    <div className={s.offerPriceRow}>
                      <span className={`${s.offerPrice} ${isCheap ? s.offerPriceCheap : ''}`}>
                        {offer.cost?.toLocaleString()} ₸
                      </span>
                      {offer.prevCost > offer.cost && offer.prevCost > 0 && (
                        <span className={s.offerOldPrice}>{offer.prevCost?.toLocaleString()} ₸</span>
                      )}
                    </div>
                  </div>

                  {/* Add-to-cart shortcut */}
                  <button
                    className={s.offerCartBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart({
                        ...offer,
                        maxPrice: mostExpensive && mostExpensive.cost > offer.cost ? mostExpensive.cost : undefined,
                      });
                    }}
                    title="Добавить в корзину"
                  >
                    <Icon name="cart" size={16} />
                  </button>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Description */}
      {product.description && (
        <div className={s.descSection}>
          <h2 className={s.descTitle}>Описание</h2>
          <p className={s.descText}>{product.description}</p>
        </div>
      )}
    </div>
  );
}
