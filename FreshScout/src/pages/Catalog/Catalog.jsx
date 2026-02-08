import { useMemo, useState } from "react";
import styles from "./Catalog.module.css";
import { FILTER_GROUPS, PRODUCTS, STORES } from "../../mocks/products.js";
import ProductCard from "../../components/ProductCard/ProductCard.jsx";
import CatalogFilter from "../../components/CatalogFilter/CatalogFilter.jsx";
import StoreBar from "../../components/StoreBar/StoreBar.jsx";
import SearchBar from "../../components/SearchBar/SearchBar.jsx";
import CartSidebar from "../../components/CartSidebar/CartSidebar.jsx";

export default function Catalog() {
  const [q, setQ] = useState("");
  const [storeId, setStoreId] = useState(STORES[0].id);
  const [groupId, setGroupId] = useState(FILTER_GROUPS[0].id);
  const [subId, setSubId] = useState(null);

  const list = useMemo(() => {
    const qn = q.trim().toLowerCase();
    const isSearching = qn.length > 0;

    return PRODUCTS.filter((p) => {
      const okStore = p.stores?.includes(storeId);

      const okGroup = isSearching ? true : groupId ? p.group === groupId : true;
      const okSub = isSearching ? true : subId ? p.sub === subId : true;

      const okQ = isSearching ? p.title.toLowerCase().includes(qn) : true;

      return okStore && okGroup && okSub && okQ;
    });
  }, [q, storeId, groupId, subId]);

  return (
    <div className={styles.page}>
      <CatalogFilter
        groups={FILTER_GROUPS}
        activeGroup={groupId}
        activeSub={subId}
        onSelectGroup={(id) => {
          setGroupId(id);
          setSubId(null);
        }}
        onSelectSub={(id) => setSubId(id)}
      />

      <div className={styles.topbar}>
        <div className={styles.searchContainer}>
          <div className={styles.searchWrap}>
            <SearchBar
              value={q}
              onChange={setQ}
              placeholder="Найти в каталоге"
            />
          </div>
          <div className={styles.storeBarContainer}>
            <StoreBar stores={STORES} value={storeId} onChange={setStoreId} />
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.contentScroll}>
          <div className={styles.grid}>
            {list.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </div>
      </div>

      <CartSidebar />
    </div>
  );
}
