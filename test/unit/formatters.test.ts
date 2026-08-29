import { describe, expect, it } from 'vitest';

import { formatCurrency, parseCurrencyToCents } from '../../src/cli/formatters.js';
import { ValidationError } from '../../src/domain/errors.js';

describe('currency formatting', () => {
  it('parses formatted dollars into integer cents', () => {
    expect(parseCurrencyToCents('$125,000.50')).toBe(12_500_050);
    expect(parseCurrencyToCents('85000')).toBe(8_500_000);
  });

  it('rejects negative values and fractions of a cent', () => {
    expect(() => parseCurrencyToCents('-1')).toThrow(ValidationError);
    expect(() => parseCurrencyToCents('10.999')).toThrow(ValidationError);
  });

  it('formats integer cents as US dollars', () => {
    expect(formatCurrency(12_500_050)).toBe('$125,000.50');
  });
});
