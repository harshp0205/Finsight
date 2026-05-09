export function fmt(n: number | null | undefined, decimals = 2) {
  if (n == null) return 'N/A';
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function fmtCurrency(n: number | null | undefined) {
  if (n == null) return 'N/A';
  return '$' + fmt(n);
}

export function fmtBillions(n: number | null | undefined) {
  if (n == null) return 'N/A';
  return '$' + fmt(n / 1e9) + 'B';
}

export function fmtPct(n: number | null | undefined) {
  if (n == null) return 'N/A';
  return (n > 0 ? '+' : '') + fmt(n) + '%';
}

export function colorPct(n: number | null | undefined) {
  if (n == null) return 'text-gray-400';
  return n >= 0 ? 'text-green-400' : 'text-red-400';
}
