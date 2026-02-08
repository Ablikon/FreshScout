import { useMemo, useState } from "react";
import styles from "./CatalogFilter.module.css";

export default function CatalogFilter({
  groups,
  activeGroup,
  activeSub,
  onSelectGroup,
  onSelectSub,
}) {
  const [open, setOpen] = useState(() => new Set(activeGroup ? [activeGroup] : []));

  const openIds = useMemo(() => open, [open]);

  function toggle(id) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <aside className={styles.panel}>
      <div className={styles.groups}>
        {groups.map((g) => {
          const isOpen = openIds.has(g.id);
          const isActiveGroup = activeGroup === g.id;

          return (
            <div key={g.id} className={styles.group}>
              <button
                className={`${styles.groupBtn} ${isActiveGroup ? styles.activeGroup : ''}`}
                onClick={() => {
                  onSelectGroup?.(g.id);
                  toggle(g.id);
                }}
              >
                <span className={styles.groupName}>{g.title}</span>
                <div className={styles.chevronContainer}>
                  <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>
                    ›
                  </span>
                </div>
              </button>

              {isOpen && (
                <div className={styles.children}>
                  <button
                    className={`${styles.child} ${isActiveGroup && !activeSub ? styles.activeChild : ''}`}
                    onClick={() => onSelectSub?.(null)}
                  >
                    Все в разделе
                  </button>

                  {g.children.map((c) => {
                    const active = activeGroup === g.id && activeSub === c.id;
                    return (
                      <button
                        key={c.id}
                        className={`${styles.child} ${active ? styles.activeChild : ''}`}
                        onClick={() => onSelectSub?.(c.id)}
                      >
                        {c.title}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}