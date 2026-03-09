import { translateText, translateJson } from './translate';

/**
 * Detect Fr fields from data keys.
 * Returns array of base names (e.g. ['bio', 'tagline'] for bioFr/bioEn/bioEs).
 */
function detectTranslatableFields(data: Record<string, unknown>): string[] {
  const bases: string[] = [];
  for (const key of Object.keys(data)) {
    if (key.endsWith('Fr')) {
      bases.push(key.slice(0, -2));
    }
  }
  return bases;
}

type TargetConfig = { suffix: string; lang: 'en-US' | 'es' };

const TARGETS: TargetConfig[] = [
  { suffix: 'En', lang: 'en-US' },
  { suffix: 'Es', lang: 'es' },
];

/**
 * Creates lifecycle hooks that auto-translate Fr fields to En and Es.
 * Only translates if:
 * - The Fr field has a value
 * - The target field is empty/null (not explicitly provided)
 */
export function createBilingualLifecycle() {
  async function autoTranslate(event: { params: { data: Record<string, unknown> } }) {
    const { data } = event.params;
    if (!data) return;

    const bases = detectTranslatableFields(data);

    for (const base of bases) {
      const frKey = `${base}Fr`;
      const frVal = data[frKey];

      // Skip if no French value
      if (frVal == null || (typeof frVal === 'string' && !frVal.trim())) continue;

      for (const target of TARGETS) {
        const targetKey = `${base}${target.suffix}`;
        const targetVal = data[targetKey];

        // Skip if target was explicitly provided (manual edit)
        if (targetVal != null && targetVal !== '') continue;

        // Translate based on type
        if (typeof frVal === 'string') {
          const translated = await translateText(frVal, target.lang);
          if (translated) data[targetKey] = translated;
        } else if (typeof frVal === 'object') {
          const translated = await translateJson(frVal, target.lang);
          if (translated) data[targetKey] = translated;
        }
      }
    }
  }

  return {
    beforeCreate: autoTranslate,
    beforeUpdate: autoTranslate,
  };
}
