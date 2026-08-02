const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Escapes text for safe interpolation into an HTML template. Anything
 * user-controlled (org names, display names, ...) that ends up in an HTML
 * email body or similar server-rendered HTML string needs this — template
 * literals don't escape automatically the way JSX does.
 */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);
}
