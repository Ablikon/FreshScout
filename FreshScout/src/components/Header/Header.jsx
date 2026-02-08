import { useLocation, useNavigate } from "react-router-dom";
import styles from "./Header.module.css";
import SearchBar from "../SearchBar/SearchBar.jsx";
import Button from "../Ui/Button.jsx";
import CartDrawer from "../CartDrawer/CartDrawer.jsx";
import { useState, useEffect } from "react";
import { useCart } from "../../store/cartStore.js";
import { useUi } from "../../store/uiStore.js";
import { useAuth } from "../../contexts/AuthContext.jsx";

function titleByPath(pathname) {
  if (pathname === "/") return "Каталог";
  if (pathname === "/checkout") return "Оформление";
  if (pathname === "/orders") return "Заказы";
  if (pathname === "/favorites") return "Избранное";
  if (pathname === "/login") return "Авторизация";
  return "SellerService";
}

export default function Header() {
  const loc = useLocation();
  const nav = useNavigate();
  const ui = useUi();
  const [openCart, setOpenCart] = useState(false);
  const cart = useCart();
  const auth = useAuth();
  const isCatalog = loc.pathname === "/";

  const [bump, setBump] = useState(false);

  useEffect(() => {
    setBump(true);
    const t = setTimeout(() => setBump(false), 220);
    return () => clearTimeout(t);
  }, [cart.totalCount]);

  return (
    <>
      <div className={styles.header}>
        <div className={styles.left}>
          <div className={styles.titleRow}>
            <div className={styles.title}>{titleByPath(loc.pathname)}</div>
          </div>
          <div className={styles.subtitle}>Выбери и купи быстро, дешево</div>
        </div>

        <div className={styles.center}>
          {isCatalog ? (
            <>
              <SearchBar
                value={ui.catalogQuery}
                onChange={ui.setCatalogQuery}
                className={styles.search}
                placeholder="Найти в FreshScout"
              />
              <div className={styles.address}>
                <svg
                  className={styles.locationIcon}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z"
                    fill="currentColor"
                  />
                </svg>
                <span className={styles.addressText}>
                  улица Алишер... , 58/1
                </span>
              </div>
            </>
          ) : (
            <div className={styles.centerStub} />
          )}
        </div>

        <div className={styles.right}>
          <div className={styles.cartWrapper}>
            <Button variant="primary" onClick={() => nav("/checkout")}>
              К оформлению{cart.totalCount ? ` (${cart.totalCount})` : ""}
            </Button>
          </div>
          {auth.isAuthed ? (
            <Button
              variant="outline"
              className={styles.loginBtn}
              onClick={() => auth.signOut()}
            >
              {auth.user?.name ? auth.user.name : "Аккаунт"} · Выйти
            </Button>
          ) : (
            <Button
              variant="outline"
              className={styles.loginBtn}
              onClick={() => nav("/login")}
            >
              Войти
            </Button>
          )}
        </div>
      </div>

      <CartDrawer open={openCart} onClose={() => setOpenCart(false)} />
    </>
  );
}
