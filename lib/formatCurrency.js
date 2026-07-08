export function formatAed(amount) {
  if (amount === null || amount === undefined || amount === "") return null;
  const num = Number(amount);
  if (Number.isNaN(num)) return null;
  return `AED ${num.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function discountPercent(price, listPrice) {
  if (!price || !listPrice || listPrice <= price) return null;
  return Math.round(((listPrice - price) / listPrice) * 100);
}
