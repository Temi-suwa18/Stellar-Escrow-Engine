/** Lowercase, hyphenated slug for organization URLs — not guaranteed unique on its own. */
export default function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'org';
}
