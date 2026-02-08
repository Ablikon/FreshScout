import styles from "./VendorPill.module.css";

export default function VendorPill({ vendor }) {
  return (
    <div className={[styles.pill, styles[vendor.id]].join(" ")}>
      <div className={styles.mark}>{vendor.badge}</div>
      <div className={styles.text}>{vendor.title}</div>
    </div>
  );
}
