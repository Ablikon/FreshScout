import styles from "./Badge.module.css";

export default function Badge({ tone = "neutral", children, className = "" }) {
  return (
    <span className={[styles.badge, styles[tone], className].join(" ")}>
      {children}
    </span>
  );
}
