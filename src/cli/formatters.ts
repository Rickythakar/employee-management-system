import { ValidationError } from '../domain/errors.js';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(cents: number): string {
  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw new ValidationError('Currency value must be a non-negative integer number of cents.');
  }
  return currencyFormatter.format(cents / 100);
}

export function parseCurrencyToCents(input: string): number {
  const normalized = input.trim();
  if (!/^\$?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?$/.test(normalized)) {
    throw new ValidationError('Enter a positive dollar amount with no more than two decimals.');
  }

  const plain = normalized.replaceAll('$', '').replaceAll(',', '');
  const [dollars = '0', fraction = ''] = plain.split('.');
  const cents = BigInt(dollars) * 100n + BigInt(fraction.padEnd(2, '0'));
  if (cents <= 0n || cents > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new ValidationError('Enter a positive dollar amount within the supported range.');
  }
  return Number(cents);
}
