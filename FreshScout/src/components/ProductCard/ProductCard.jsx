import { Link } from 'react-router-dom';
import { addToCart, removeFromCart, updateQuantity, cartStore, toggleFavorite, isFavorite, favoritesStore } from '../../store';
import Icon from '../Icon/Icon';
import STORE_ICONS from '../Icon/storeIcons';
import s from './ProductCard.module.css';

const STORE_COLORS = {
  airba: '#FF6B35',
  arbuz: '#00C853',
  magnum: '#E53935',
  wolt: '#009DE0',
  yandex: '#FFCC00',
};

export function ProductCardSkeleton() {
  return (
    <div className={s.skeleton}>
      <div className={s.skeletonImage} />
      <div className={s.info}>
        <div className={s.skeletonTitle} />
      </div>
      <div className={s.bottom}>
        <div className={s.skeletonPrice} />
      </div>
    </div>
  );
}

export default function ProductCard({ product }) {
  const cartItems = cartStore.useStore(s => s.items);
  // Subscribe to favorites so the component re-renders when favorites change
  favoritesStore.useStore(s => s.items);
  
  const inCart = cartItems.find(i => i._id === product._id);
  const fav = isFavorite(product._id);
  const storeColor = STORE_COLORS[product.store] || '#666';

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };

  const handleMinus = (e) => {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(product._id, (inCart?.quantity || 1) - 1);
  };

  const handlePlus = (e) => {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(product._id, (inCart?.quantity || 0) + 1);
  };

  const handleFav = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product);
  };

  return (
    <Link to={`/product/${product._id}`} className={s.card}>
      <div className={s.imageWrapper}>
        {product.imageUrl ? (
          <img 
            className={s.image} 
            src={product.imageUrl.replace('%w', '300').replace('%h', '300')} 
            alt={product.title}
            loading="lazy"
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
          />
        ) : null}
        <div className={s.noImage} style={product.imageUrl ? { display: 'none' } : {}}><Icon name="package" size={32} /></div>

        <div className={s.badges}>
          {product.discount > 0 && (
            <span className={s.discount}>-{product.discount}%</span>
          )}
          <span className={s.storeBadge} style={{ background: storeColor }}>
            {STORE_ICONS[product.store] && <img className={s.storeIcon} src={STORE_ICONS[product.store]} alt="" />}
            {product.storeName}
          </span>
        </div>

        <button 
          className={fav ? s.favBtnActive : s.favBtn}
          onClick={handleFav}
        >
          {fav ? <Icon name="heart-filled" size={18} /> : <Icon name="heart" size={18} />}
        </button>
      </div>

      <div className={s.info}>
        <div className={s.title}>{product.title}</div>
        {product.measure && <div className={s.measure}>{product.measure}</div>}
      </div>

      <div className={s.bottom}>
        <div className={s.priceBlock}>
          <span className={s.price}>{product.cost?.toLocaleString()} ₸</span>
          {product.prevCost > product.cost && product.prevCost > 0 && (
            <span className={s.oldPrice}>{product.prevCost?.toLocaleString()} ₸</span>
          )}
        </div>

        {inCart ? (
          <div className={s.qtyControl}>
            <button className={s.qtyBtn} onClick={handleMinus}>−</button>
            <span className={s.qty}>{inCart.quantity}</span>
            <button className={s.qtyBtn} onClick={handlePlus}>+</button>
          </div>
        ) : (
          <button className={s.addBtn} onClick={handleAdd}>+</button>
        )}
      </div>
    </Link>
  );
}
