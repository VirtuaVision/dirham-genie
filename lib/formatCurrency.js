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

/**
 * Shortens a product title to roughly one line for social captions.
 * Cuts at the nearest word boundary so it doesn't chop a word in half.
 */
export function truncateTitle(title, maxLength = 45) {
  if (!title) return "";
  if (title.length <= maxLength) return title;
  const cut = title.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  const trimmed = lastSpace > 25 ? cut.slice(0, lastSpace) : cut;
  return `${trimmed}…`;
}