import { NavLink } from "react-router-dom";
import styles from "./Sidebar.module.css";
import { Icon } from "../Ui/Icon.jsx";

const items = [
  { to: "/", label: "Каталог", icon: "grid" },
  { to: "/favorites", label: "Избранное", icon: "heart" },
  { to: "/checkout", label: "Корзина", icon: "cart" },
  { to: "/orders", label: "Заказы", icon: "box" },
];

export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.logo}>FS</div>
        <div className={styles.brandText}>
          <div className={styles.name}>FreshScout</div>
        </div>
      </div>

      <nav className={styles.nav}>
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.active : ""}`
            }
          >
            <span className={styles.i}>
              <Icon name={it.icon} />
            </span>
            <span className={styles.t}>{it.label}</span>
            <span className={styles.chev}>
              <Icon name="chev" />
            </span>
          </NavLink>
        ))}
      </nav>

      <div className={styles.footer}>
        <div className={styles.hint}>FreshScout Almaty</div>
      </div>
    </aside>
  );
}