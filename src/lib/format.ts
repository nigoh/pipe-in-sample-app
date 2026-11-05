/**
 * 円の金額を「1,234,567円」の形で表す。
 * 1円より細かい端数は切り捨てる（手取りを多く見せないため。0 に向けて切る）。
 */
export function formatYen(amount: number): string {
  if (!Number.isFinite(amount)) {
    throw new RangeError(`金額が数ではありません: ${amount}`);
  }
  const whole = Math.trunc(amount);
  const sign = whole < 0 ? "-" : "";
  return `${sign}${Math.abs(whole).toLocaleString("ja-JP")}円`;
}
