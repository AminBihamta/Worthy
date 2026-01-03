import { toMinor } from './money';

const amountRegex = /(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/g;
const dateYmdRegex = /\b(\d{4})[/-](\d{1,2})[/-](\d{1,2})\b/;
const dateMdyRegex = /\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/;
const ignoredTitleTokens = ['TOTAL', 'SUBTOTAL', 'TAX', 'AMOUNT', 'BALANCE', 'APPROVED', 'CARD'];

const normalizeAmount = (value: string) => value.replace(/[^0-9.,-]/g, '');

const parseAmount = (value: string) => {
  const normalized = normalizeAmount(value).replace(',', '.');
  const amountMinor = toMinor(normalized);
  return amountMinor > 0 ? amountMinor : null;
};

const parseDate = (value: string) => {
  const ymd = value.match(dateYmdRegex);
  if (ymd) {
    const year = Number.parseInt(ymd[1], 10);
    const month = Number.parseInt(ymd[2], 10);
    const day = Number.parseInt(ymd[3], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return new Date(year, month - 1, day).getTime();
    }
  }
  const mdy = value.match(dateMdyRegex);
  if (mdy) {
    const month = Number.parseInt(mdy[1], 10);
    const day = Number.parseInt(mdy[2], 10);
    const yearRaw = Number.parseInt(mdy[3], 10);
    const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw;
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return new Date(year, month - 1, day).getTime();
    }
  }
  return null;
};

const pickTitle = (lines: string[]) => {
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 3) continue;
    const upper = trimmed.toUpperCase();
    if (ignoredTitleTokens.some((token) => upper.includes(token))) continue;
    if (!/[A-Z]/i.test(trimmed)) continue;
    if (/^[0-9\s\-.,]+$/.test(trimmed)) continue;
    return trimmed;
  }
  return null;
};

const pickAmountFromLines = (lines: string[]) => {
  let best: number | null = null;
  const prioritized = lines.filter((line) =>
    /(total|amount due|balance)/i.test(line),
  );
  const candidates = prioritized.length ? prioritized : lines;
  candidates.forEach((line) => {
    const matches = line.match(amountRegex);
    if (!matches) return;
    matches.forEach((match) => {
      const amountMinor = parseAmount(match);
      if (!amountMinor) return;
      if (best === null || amountMinor > best) {
        best = amountMinor;
      }
    });
  });
  return best;
};

export async function extractReceiptSuggestions(uri: string) {
  let getTextFromFrame: ((input: string, isBase64?: boolean) => Promise<string[]>) | null = null;
  try {
    const module = await import('expo-text-recognition');
    getTextFromFrame = module.getTextFromFrame ?? null;
  } catch (error) {
    getTextFromFrame = null;
  }
  if (!getTextFromFrame) {
    return {
      suggested_title: null,
      suggested_amount_minor: null,
      suggested_date_ts: null,
    };
  }

  const lines = await getTextFromFrame(uri);
  const cleaned = lines.map((line) => line.trim()).filter(Boolean);

  const suggestedAmountMinor = pickAmountFromLines(cleaned);
  const suggestedTitle = pickTitle(cleaned);

  let suggestedDateTs: number | null = null;
  for (const line of cleaned) {
    const parsed = parseDate(line);
    if (parsed) {
      suggestedDateTs = parsed;
      break;
    }
  }

  return {
    suggested_title: suggestedTitle,
    suggested_amount_minor: suggestedAmountMinor,
    suggested_date_ts: suggestedDateTs,
  };
}
