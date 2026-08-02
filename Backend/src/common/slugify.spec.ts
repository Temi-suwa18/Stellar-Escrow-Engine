import slugify from './slugify';

describe('slugify', () => {
  it('lowercases and hyphenates spaces', () => {
    expect(slugify('Acme Logistics Inc')).toBe('acme-logistics-inc');
  });

  it('collapses runs of non-alphanumeric characters into a single hyphen', () => {
    expect(slugify('Acme & Co.,  Ltd!!')).toBe('acme-co-ltd');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify('  --Acme--  ')).toBe('acme');
  });

  it('strips accented/non-ASCII characters rather than transliterating them', () => {
    // Documents actual behavior — café both accents get dropped by the
    // [^a-z0-9]+ character class, not swapped for their ASCII equivalents.
    expect(slugify('Café Org')).toBe('caf-org');
  });

  it('falls back to "org" when nothing alphanumeric survives', () => {
    expect(slugify('!!!')).toBe('org');
    expect(slugify('   ')).toBe('org');
    expect(slugify('')).toBe('org');
  });

  it('leaves an already-clean slug unchanged', () => {
    expect(slugify('acme-store')).toBe('acme-store');
  });

  it('preserves numbers', () => {
    expect(slugify('Store 24/7')).toBe('store-24-7');
  });
});
