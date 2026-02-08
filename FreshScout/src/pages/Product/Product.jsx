import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchProduct } from '../../api';
import { addToCart, toggleFavorite, isFavorite, favoritesStore } from '../../store';
import Icon from '../../components/Icon/Icon';
import STORE_ICONS from '../../components/Icon/storeIcons';
import s from './Product.module.css';

const STORE_COLORS = {
  airba: '#FF6B35', arbuz: '#00C853', magnum: '#E53935', wolt: '#009DE0', yandex: '#FFCC00',
};

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading] = useState(true);

  favoritesStore.useStore(s => s.items);

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

  if (loading) return <div className={s.loading}>Загрузка...</div>;
  if (!product) return <div className={s.loading}>Товар не найден</div>;

  const fav = isFavorite(product._id);
  const storeColor = STORE_COLORS[product.store] || '#666';

  return (
    <div className={s.page}>
      <div className={s.breadcrumb}>
        <Link to="/">Главная</Link>
        <span>›</span>
        <Link to={`/category/${encodeURIComponent(product.categoryParent)}`}>{product.categoryParent}</Link>
        <span>›</span>
        <span>{product.title}</span>
      </div>

      <div className={s.layout}>
        <div className={s.imageCol}>
          <div className={s.imageBox}>
            <img
              className={s.image}
              src={product.imageUrl?.replace('%w', '600').replace('%h', '600')}
              alt={product.title}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        </div>

        <div className={s.infoCol}>
          <span className={s.storeBadge} style={{ background: storeColor }}>
            {STORE_ICONS[product.store] && <img className={s.storeIcon} src={STORE_ICONS[product.store]} alt="" />}
            {product.storeName}
          </span>

          <h1 className={s.title}>{product.title}</h1>
          {product.measure && <p className={s.measure}>{product.measure}</p>}
          {product.brand && <p className={s.brand}>Бренд: {product.brand}</p>}

          <div className={s.priceBlock}>
            <span className={s.price}>{product.cost?.toLocaleString()} ₸</span>
            {product.prevCost > product.cost && product.prevCost > 0 && (
              <span className={s.oldPrice}>{product.prevCost?.toLocaleString()} ₸</span>
            )}
            {product.discount > 0 && (
              <span className={s.discount}>-{product.discount}%</span>
            )}
          </div>

          <div className={s.actions}>
            <button className={s.addBtn} onClick={() => addToCart(product)}>
              Добавить в корзину
            </button>
            <button className={s.favBtn} onClick={() => toggleFavorite(product)}>
              {fav ? <Icon name="heart-filled" size={22} /> : <Icon name="heart" size={22} />}
            </button>
          </div>

          {product.url && (
            <a href={product.url} target="_blank" rel="noopener noreferrer" className={s.linkBtn}>
              Открыть в {product.storeName} ↗
            </a>
          )}
        </div>
      </div>

      {/* Price comparison */}
      {alternatives.length > 0 && (
        <div className={s.altSection}>
          <h2 className={s.altTitle}><Icon name="tag" size={22} style={{ marginRight: 8 }} /> Сравнение цен</h2>
          <div className={s.altGrid}>
            {/* Current product */}
            <div className={s.altCard} style={{ borderColor: storeColor, borderWidth: 2 }}>
              <img className={s.altImage} src={product.imageUrl?.replace('%w', '112').replace('%h', '112')} alt="" />
              <div className={s.altInfo}>
                <div className={s.altName}>{product.title}</div>
                <div className={s.altStore}>{product.storeName} · {product.measure}</div>
              </div>
              <span className={s.altPrice}>{product.cost?.toLocaleString()} ₸</span>
            </div>
            {alternatives.map(alt => (
              <Link key={alt._id} to={`/product/${alt._id}`} className={s.altCard}>
                <img
                  className={s.altImage}
                  src={alt.imageUrl?.replace('%w', '112').replace('%h', '112')}
                  alt=""
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div className={s.altInfo}>
                  <div className={s.altName}>{alt.title}</div>
                  <div className={s.altStore}>{alt.storeName} · {alt.measure}</div>
                </div>
                <span className={`${s.altPrice} ${alt.cost < product.cost ? s.cheapest : ''}`}>
                  {alt.cost?.toLocaleString()} ₸
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
