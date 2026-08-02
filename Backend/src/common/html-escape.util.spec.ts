import { escapeHtml } from './html-escape.util';

describe('escapeHtml', () => {
  it('escapes the five HTML-significant characters', () => {
    expect(escapeHtml('&<>"\'')).toBe('&amp;&lt;&gt;&quot;&#39;');
  });

  it('neutralizes a script-tag injection attempt', () => {
    const malicious = '<script>alert(document.cookie)</script>';
    const escaped = escapeHtml(malicious);
    expect(escaped).not.toContain('<script>');
    expect(escaped).toBe('&lt;script&gt;alert(document.cookie)&lt;/script&gt;');
  });

  it('neutralizes an event-handler injection attempt', () => {
    const malicious = '<img src=x onerror=alert(1)>';
    const escaped = escapeHtml(malicious);
    expect(escaped).not.toContain('<img');
  });

  it('leaves ordinary text untouched', () => {
    expect(escapeHtml('Acme Logistics Inc.')).toBe('Acme Logistics Inc.');
  });

  it('leaves an empty string untouched', () => {
    expect(escapeHtml('')).toBe('');
  });
});
