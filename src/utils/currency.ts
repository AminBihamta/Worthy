import { CurrencyRow } from '../db/repositories/currencies';

export function buildRateMap(currencies: CurrencyRow[], baseCurrency: string) {
  const map = new Map<string, number>();
  currencies.forEach((currency) => {
    map.set(currency.code, currency.rate_to_base);
  });
  if (baseCurrency && !map.has(baseCurrency)) {
    map.set(baseCurrency, 1);
  }
  return map;
}

export function convertMinorToBase(
  amountMinor: number,
  currencyCode: string | null | undefined,
  rateMap: Map<string, number>,
  baseCurrency: string,
) {
  const code = currencyCode || baseCurrency;
  const rate = code === baseCurrency ? 1 : rateMap.get(code) ?? 1;
  return Math.round(amountMinor * rate);
}

export function convertMinorBetween(
  amountMinor: number,
  fromCurrency: string | null | undefined,
  toCurrency: string | null | undefined,
  rateMap: Map<string, number>,
  baseCurrency: string,
) {
  const fromCode = fromCurrency || baseCurrency;
  const toCode = toCurrency || baseCurrency;
  const fromRate = fromCode === baseCurrency ? 1 : rateMap.get(fromCode) ?? 1;
  const toRate = toCode === baseCurrency ? 1 : rateMap.get(toCode) ?? 1;
  if (fromRate === toRate) {
    return amountMinor;
  }
  return Math.round(amountMinor * (fromRate / (toRate || 1)));
}
