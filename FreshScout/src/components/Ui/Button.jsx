import styles from "./Button.module.css";

export default function Button({
  variant = "primary",
  size = "md",
  leftIcon = null,
  rightIcon = null,
  className = "",
  ...props
}) {
  return (
    <button
      className={[
        styles.btn,
        styles[variant],
        styles[size],
        className,
      ].join(" ")}
      {...props}
    >
      {leftIcon ? <span className={styles.icon}>{leftIcon}</span> : null}
      <span className={styles.label}>{props.children}</span>
      {rightIcon ? <span className={styles.icon}>{rightIcon}</span> : null}
    </button>
  );
}
