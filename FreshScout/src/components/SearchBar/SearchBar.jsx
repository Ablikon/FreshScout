import styles from "./SearchBar.module.css";
import { Icon } from "../Ui/Icon.jsx";

export default function SearchBar({ value, onChange, placeholder = "Поиск товаров..." }) {
  return (
    <div className={styles.wrap}>
      <span className={styles.icon}><Icon name="search" /></span>
      <input
        className={styles.input}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
      />
      {value ? (
        <button className={styles.clear} onClick={() => onChange?.("")} aria-label="Очистить">
          ×
        </button>
      ) : null}
    </div>
  );
}
