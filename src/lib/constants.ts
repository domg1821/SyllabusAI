/** Maximum number of analyses a free-tier user may run. */
export const FREE_LIMIT = 3;

/** Pro subscription monthly price in USD. */
export const PRO_PRICE_MONTHLY = 5;

/** Pro subscription yearly price in USD (shown as total per year). */
export const PRO_PRICE_YEARLY = 45;

/** What the yearly plan would cost at monthly rate — used to show savings. */
export const PRO_PRICE_YEARLY_FULL = PRO_PRICE_MONTHLY * 12; // 60

/** Percent saved on yearly vs monthly (rounded). */
export const PRO_YEARLY_DISCOUNT_PCT = Math.round(
  ((PRO_PRICE_YEARLY_FULL - PRO_PRICE_YEARLY) / PRO_PRICE_YEARLY_FULL) * 100
); // 25
