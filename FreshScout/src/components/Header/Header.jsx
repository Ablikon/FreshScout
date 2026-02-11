import { Link } from 'react-router-dom';
import { cartStore, openCart, openSearch, cityStore, setCity, authStore, logout } from '../../store';
import Icon from '../Icon/Icon';
import s from './Header.module.css';

const CITIES = { almaty: 'Алматы', astana: 'Астана' };

export default function Header() {
  const cartItems = cartStore.useStore(s => s.items);
  const city = cityStore.useStore(s => s.city);
  const token = authStore.useStore(s => s.token);
  const user = authStore.useStore(s => s.user);
  const count = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const total = cartItems.reduce((sum, i) => sum + i.cost * i.quantity, 0);
  const isLoggedIn = !!token;

  const handleCityToggle = () => {
    setCity(city === 'almaty' ? 'astana' : 'almaty');
    window.location.reload();
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <header className={s.header}>
      <div className={s.inner}>
        <Link to="/" className={s.logo}>
          <Icon name="cart" size={26} className={s.logoIcon} />
          <span>FreshScout</span>
        </Link>

        <div className={s.searchWrapper}>
          <button className={s.searchBtn} onClick={openSearch}>
            <Icon name="search" size={18} className={s.searchIcon} />
            <span>Найти продукты...</span>
          </button>
        </div>

        <div className={s.actions}>
          <button className={s.cityBtn} onClick={handleCityToggle}>
            <Icon name="map-pin" size={16} className={s.cityIcon} />
            <span>{CITIES[city]}</span>
          </button>

          {isLoggedIn && (
            <Link to="/orders" className={s.actionBtn} title="Мои заказы">
              <Icon name="package" size={20} />
            </Link>
          )}
          <Link to="/favorites" className={s.actionBtn}>
            <Icon name="heart" size={20} />
          </Link>
          {isLoggedIn ? (
            <button className={s.userBtn} onClick={handleLogout} title="Выйти">
              <Icon name="user" size={18} />
              <span className={s.userName}>{user?.name || user?.phone || 'Профиль'}</span>
            </button>
          ) : (
            <Link to="/login" className={s.loginBtn}>
              <Icon name="user" size={18} />
              <span>Войти</span>
            </Link>
          )}

          <button className={s.cartBtn} onClick={openCart}>
            <Icon name="cart" size={18} />
            {count > 0 ? (
              <>
                <span className={s.cartTotal}>{total.toLocaleString()} ₸</span>
                <span className={s.badge}>{count}</span>
              </>
            ) : (
              <span>Корзина</span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
