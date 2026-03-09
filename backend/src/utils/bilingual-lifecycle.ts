import { translateText, translateJson } from './translate';

/**
 * Detect Fr/En field pairs from data keys.
 * Returns array of base names (e.g. ['bio', 'tagline'] for bioFr/bioEn).
 */
function detectBilingualFields(data: Record<string, unknown>): string[] {
  const bases: string[] = [];
  for (const key of Object.keys(data)) {
    if (key.endsWith('Fr')) {
      const base = key.slice(0, -2);
      if (`${base}En` in data || data[key] !== undefined) {
        bases.push(base);
      }
    }
  }
  return bases;
}

/**
 * Creates lifecycle hooks that auto-translate Fr fields to En.
 * Only translates if:
 * - The Fr field has a value
 * - The En field is empty/null OR was not explicitly modified
 */
export function createBilingualLifecycle() {
  async function autoTranslate(event: { params: { data: Record<string, unknown> } }) {
    const { data } = event.params;
    if (!data) return;

    const bases = detectBilingualFields(data);

    for (const base of bases) {
      const frKey = `${base}Fr`;
      const enKey = `${base}En`;
      const frVal = data[frKey];

      // Skip if no French value
      if (frVal == null || (typeof frVal === 'string' && !frVal.trim())) continue;

      // Skip if English was explicitly provided (manual edit)
      const enVal = data[enKey];
      if (enVal != null && enVal !== '' && enVal !== null) continue;

      // Translate based on type
      if (typeof frVal === 'string') {
        const translated = await translateText(frVal);
        if (translated) data[enKey] = translated;
      } else if (typeof frVal === 'object') {
        const translated = await translateJson(frVal);
        if (translated) data[enKey] = translated;
      }
    }
  }

  return {
    beforeCreate: autoTranslate,
    beforeUpdate: autoTranslate,
  };
}
