"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBilingualLifecycle = void 0;
const translate_1 = require("./translate");
/**
 * Detect Fr fields from data keys.
 * Returns array of base names (e.g. ['bio', 'tagline'] for bioFr/bioEn/bioEs).
 */
function detectTranslatableFields(data) {
    const bases = [];
    for (const key of Object.keys(data)) {
        if (key.endsWith('Fr')) {
            bases.push(key.slice(0, -2));
        }
    }
    return bases;
}
const TARGETS = [
    { suffix: 'En', lang: 'en-US' },
    { suffix: 'Es', lang: 'es' },
];
/**
 * Creates lifecycle hooks that auto-translate Fr fields to En and Es.
 * Only translates if:
 * - The Fr field has a value
 * - The target field is empty/null (not explicitly provided)
 */
function createBilingualLifecycle() {
    async function autoTranslate(event) {
        const { data } = event.params;
        if (!data)
            return;
        const bases = detectTranslatableFields(data);
        for (const base of bases) {
            const frKey = `${base}Fr`;
            const frVal = data[frKey];
            // Skip if no French value
            if (frVal == null || (typeof frVal === 'string' && !frVal.trim()))
                continue;
            for (const target of TARGETS) {
                const targetKey = `${base}${target.suffix}`;
                const targetVal = data[targetKey];
                // Skip if target was explicitly provided (manual edit)
                if (targetVal != null && targetVal !== '')
                    continue;
                // Translate based on type
                if (typeof frVal === 'string') {
                    const translated = await (0, translate_1.translateText)(frVal, target.lang);
                    if (translated)
                        data[targetKey] = translated;
                }
                else if (typeof frVal === 'object') {
                    const translated = await (0, translate_1.translateJson)(frVal, target.lang);
                    if (translated)
                        data[targetKey] = translated;
                }
            }
        }
    }
    return {
        beforeCreate: autoTranslate,
        beforeUpdate: autoTranslate,
    };
}
exports.createBilingualLifecycle = createBilingualLifecycle;
