import { OFFERS_BY_PRODUCT, VENDORS } from "./offers.js";
import { PRODUCTS } from "./products.js"; 

function toMoney(n) {
  return Math.round(Number.isFinite(n) ? n : 0);
}

function toQty(q) {
  const v = Number(q);
  return Number.isFinite(v) && v > 0 ? v : 0;
}

function calcAllInOne(lines, vendorId) {
  const v = VENDORS.find((x) => x.id === vendorId);
  if (!v) return null;

  const itemsSum = lines.reduce((s, l) => {
    const price = l.offers?.[vendorId];
    if (!Number.isFinite(price)) return s;
    return s + price * l.qty;
  }, 0);

  const total = itemsSum > 0 ? itemsSum + v.delivery : 0;
  return {
    vendorId,
    itemsSum: toMoney(itemsSum),
    delivery: toMoney(v.delivery),
    total: toMoney(total),
  };
}

export function buildOptimization(cartItems) {
  const lines = (cartItems || []).map((it) => {
    const offers = OFFERS_BY_PRODUCT[it.productId] || {};
    const p = PRODUCTS?.find((x) => x.id === it.productId) || {};

    return {
      productId: it.productId,
      title: it.title ?? p.title ?? "Товар",
      unit: it.unit ?? p.unit ?? "",
      img: it.img ?? p.img ?? "🛍️",
      qty: toQty(it.qty),
      offers,
    };
  });

  const chosen = lines.map((l) => {
    let bestVendor = null;
    let bestPrice = Infinity;

    Object.entries(l.offers || {}).forEach(([vendorId, price]) => {
      if (Number.isFinite(price) && price < bestPrice) {
        bestPrice = price;
        bestVendor = vendorId;
      }
    });

    const safePrice = Number.isFinite(bestPrice) ? bestPrice : 0;

    return {
      ...l,
      bestVendor,
      bestUnitPrice: toMoney(safePrice),
      bestLineSum: toMoney(safePrice * l.qty),
    };
  });
  const unavailable = chosen.filter((l) => !l.bestVendor);
  const buckets = Object.fromEntries(
    VENDORS.map((v) => [v.id, { vendor: v, lines: [], itemsSum: 0 }])
  );

  for (const l of chosen) {
    if (!l.bestVendor) continue;
    const b = buckets[l.bestVendor];
    if (!b) continue;
    b.lines.push(l);
    b.itemsSum += (l.bestUnitPrice || 0) * l.qty;
  }

  const vendorGroups = Object.values(buckets)
    .filter((b) => b?.lines?.length > 0)
    .map((b) => {
      const itemsSum = toMoney(b.itemsSum);
      const delivery = toMoney(b.vendor.delivery);
      const total = toMoney(itemsSum + delivery);

      const minFee = 0;

      return { ...b, itemsSum, delivery, minFee, total };
    });

  const optimizedItemsSum = vendorGroups.reduce((s, g) => s + (g?.itemsSum || 0), 0);
  const optimizedDeliverySum = vendorGroups.reduce((s, g) => s + (g?.delivery || 0), 0);
  const optimizedTotal = toMoney(optimizedItemsSum + optimizedDeliverySum);

  const baselines = VENDORS.map((v) => calcAllInOne(lines, v.id)).filter(Boolean);
  baselines.sort((a, b) => a.total - b.total);
  const baseline = baselines[0] || { vendorId: "—", total: 0 };

  const savings = toMoney(baseline.total - optimizedTotal);

  return {
    lines: chosen,
    vendorGroups,
    unavailable,
    totals: {
      optimizedItemsSum: toMoney(optimizedItemsSum),
      optimizedDeliverySum: toMoney(optimizedDeliverySum),
      optimizedTotal,
      baselineVendorId: baseline.vendorId,
      baselineTotal: baseline.total,
      savings: Math.max(0, savings),
    },
  };
}
