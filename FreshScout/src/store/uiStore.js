import { useEffect, useMemo, useState } from "react";

const KEY = "seller_service_ui_v1";

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { catalogQuery: "" };
    const parsed = JSON.parse(raw);
    return { catalogQuery: parsed.catalogQuery ?? "" };
  } catch {
    return { catalogQuery: "" };
  }
}

export function useUi() {
  const [ui, setUi] = useState(read);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(ui));
  }, [ui]);

  return useMemo(() => {
    function setCatalogQuery(v) {
      setUi((p) => ({ ...p, catalogQuery: v }));
    }
    return { ...ui, setCatalogQuery };
  }, [ui]);
}
