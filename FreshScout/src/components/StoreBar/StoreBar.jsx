import { useState, useRef, useEffect } from "react";
import styles from "./StoreBar.module.css";
import { Icon } from "../Ui/Icon.jsx";

export default function StoreBar({ stores, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const selectedStore = stores.find(s => s.id === value) || stores[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={styles.wrapper} ref={dropdownRef}>
      <button
        className={styles.selector}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className={styles.selectorText}>{selectedStore.title}</span>
        <Icon 
          name="chevron-down" 
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
        />
      </button>
      
      {isOpen && (
        <div className={styles.dropdown}>
          {stores.map((store) => {
            const isActive = store.id === value;
            return (
              <button
                key={store.id}
                className={`${styles.option} ${isActive ? styles.optionActive : ''}`}
                onClick={() => {
                  onChange?.(store.id);
                  setIsOpen(false);
                }}
              >
                <span className={styles.optionText}>{store.title}</span>
                {isActive && (
                  <Icon name="check" className={styles.checkIcon} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}