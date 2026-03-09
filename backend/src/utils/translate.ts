import * as deepl from 'deepl-node';

type TargetLang = 'en-US' | 'es';

let translator: deepl.Translator | null = null;

function getTranslator(): deepl.Translator | null {
  if (translator) return translator;
  const key = process.env.DEEPL_AUTH_KEY;
  if (!key) {
    console.warn('DEEPL_AUTH_KEY not set - auto-translation disabled');
    return null;
  }
  translator = new deepl.Translator(key);
  return translator;
}

export async function translateText(text: string, targetLang: TargetLang = 'en-US'): Promise<string | null> {
  if (!text || !text.trim()) return null;
  const t = getTranslator();
  if (!t) return null;
  try {
    const result = await t.translateText(text, 'fr', targetLang);
    return result.text;
  } catch (err) {
    console.error(`DeepL translation error (${targetLang}):`, (err as Error).message);
    return null;
  }
}

export async function translateJson(obj: unknown, targetLang: TargetLang = 'en-US'): Promise<unknown | null> {
  if (obj == null) return null;
  const t = getTranslator();
  if (!t) return null;

  try {
    if (typeof obj === 'string') {
      return await translateText(obj, targetLang);
    }
    if (Array.isArray(obj)) {
      const results = [];
      for (const item of obj) {
        results.push(await translateJson(item, targetLang));
      }
      return results;
    }
    if (typeof obj === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
        if (typeof val === 'string' && val.trim()) {
          result[key] = await translateText(val, targetLang);
        } else {
          result[key] = val;
        }
      }
      return result;
    }
    return obj;
  } catch (err) {
    console.error(`DeepL JSON translation error (${targetLang}):`, (err as Error).message);
    return null;
  }
}
