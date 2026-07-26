// Currency formatting. IDR is our source of truth in the backend.
const USD_RATE = 15800; // 1 USD = 15800 IDR (approx display only)

export function formatCurrency(amountIDR, currency = "IDR", lang = "id") {
  if (typeof amountIDR !== "number") amountIDR = Number(amountIDR) || 0;
  if (currency === "USD") {
    const usd = amountIDR / USD_RATE;
    return new Intl.NumberFormat(lang === "id" ? "id-ID" : "en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(usd);
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amountIDR);
}

export function effectivePrice(product) {
  const disc = product?.discount || 0;
  const price = product?.price || 0;
  return price - Math.round((price * disc) / 100);
}
