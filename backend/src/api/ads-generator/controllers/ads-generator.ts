/**
 * Ads Generator Controller (3 mai 2026)
 *
 * Genere 3 variantes de copy publicitaire (Titre / Corps / CTA) pour un produit
 * Massive (print ou sticker), pretes a etre exportees manuellement vers Meta
 * Ads Manager (aucune integration directe a l'API Meta).
 *
 * Backend AI : utilise Gemini 2.5 Flash text gen (deja configure via
 * GEMINI_API_KEY sur Render). Si OPENAI_API_KEY est defini, on bascule sur
 * gpt-4o-mini pour meme sortie - migration future facile sans casser le
 * contrat API du frontend.
 *
 * Auth : requireAdminAuth (ne pas exposer la creation de copy ad au public).
 */

import { requireAdminAuth } from '../../../utils/auth';

const GEMINI_TEXT_API = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

interface AdVariant {
  headline: string;
  body: string;
  cta: string;
}

/**
 * Construit le prompt structure envoye a Gemini. On force du JSON strict
 * pour pouvoir parser la reponse de maniere fiable. La langue par defaut
 * est francais (marche du Quebec) mais on accepte un override.
 */
function buildPrompt(opts: {
  productName: string;
  productType: string;
  artistName?: string;
  description?: string;
  language?: string;
}): string {
  const lang = opts.language === 'en' ? 'English'
    : opts.language === 'es' ? 'Spanish'
    : 'French (Quebec)';
  const typeLabel = opts.productType === 'sticker' ? 'sticker' : 'art print';
  const artistLine = opts.artistName ? `Artist: ${opts.artistName}` : '';
  const descLine = opts.description ? `Description: ${opts.description}` : '';

  return `You are a copywriter for Massive Medias, a print shop and art collective in Montreal.

Generate exactly 3 distinct ad variants for the following product, written in ${lang}.

Product: ${opts.productName}
Type: ${typeLabel}
${artistLine}
${descLine}

Each variant must include:
- "headline": short, punchy hook (max 40 characters, no period at end)
- "body": 1-2 sentences (max 125 characters total) that paint a vivid scene or benefit
- "cta": short call-to-action button text (max 20 characters)

Tone: bold, artistic, human, urgent. No corporate cliches. No emojis. No hashtags.

Return STRICT JSON ONLY in this exact shape (no markdown, no commentary):
{
  "variants": [
    { "headline": "...", "body": "...", "cta": "..." },
    { "headline": "...", "body": "...", "cta": "..." },
    { "headline": "...", "body": "...", "cta": "..." }
  ]
}`;
}

/**
 * Parse la reponse Gemini et extrait les 3 variantes. Tolere les wrappers
 * markdown (```json ... ```) que les modeles ajoutent parfois.
 */
function parseAdResponse(raw: string): AdVariant[] {
  if (!raw) return [];
  let cleaned = raw.trim();
  // Strip ```json ... ``` markdown wrapper si present
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    const variants = Array.isArray(parsed?.variants) ? parsed.variants : [];
    return variants
      .filter((v: any) => v && typeof v === 'object')
      .map((v: any) => ({
        headline: String(v.headline || '').trim().slice(0, 80),
        body: String(v.body || '').trim().slice(0, 200),
        cta: String(v.cta || '').trim().slice(0, 30),
      }))
      .filter((v: AdVariant) => v.headline && v.body && v.cta)
      .slice(0, 3);
  } catch (err) {
    return [];
  }
}

/**
 * Appel OpenAI (si OPENAI_API_KEY) sinon fallback Gemini. On retourne
 * toujours du texte brut, le parsing est fait apres.
 *
 * FIX-502 (3 mai 2026) : ajout AbortController avec timeout 30s pour
 * eviter qu'un fetch IA lent fasse timeout le worker Render (qui
 * repond alors 502 a l'upstream Cloudflare). Erreurs reseau sont
 * loggees explicitement avec console.error (visible dans Render logs).
 */
async function callAIProvider(prompt: string): Promise<string> {
  const TIMEOUT_MS = 30000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a copywriter for Massive Medias. Output strict JSON only.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.85,
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`OpenAI HTTP ${res.status}: ${body.slice(0, 200)}`);
      }
      const data: any = await res.json();
      return data?.choices?.[0]?.message?.content || '';
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      throw new Error('Aucune cle API IA configuree sur le serveur (OPENAI_API_KEY ou GEMINI_API_KEY).');
    }
    const res = await fetch(`${GEMINI_TEXT_API}?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.85,
          maxOutputTokens: 800,
          responseMimeType: 'application/json',
        },
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Gemini HTTP ${res.status}: ${body.slice(0, 200)}`);
    }
    const data: any = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error(`Timeout ${TIMEOUT_MS}ms depasse sur l'API IA`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export default {
  async generate(ctx: any) {
    // FIX-502 (3 mai 2026) : try/catch GLOBAL qui englobe TOUT le handler,
    // y compris la validation. Avant : un throw dans buildPrompt ou
    // requireAdminAuth qui rejette la promise pouvait remonter au worker
    // Strapi et faire 502 cote Render. Maintenant, garantit qu'on retourne
    // TOUJOURS un JSON valide avec un status HTTP propre.
    try {
      if (!(await requireAdminAuth(ctx))) return;
      const body = ctx.request.body || {};
      const productName = String(body.productName || '').trim();
      if (!productName) {
        ctx.status = 400;
        ctx.body = { error: 'productName requis' };
        return;
      }
      if (productName.length > 200) {
        ctx.status = 400;
        ctx.body = { error: 'productName max 200 chars' };
        return;
      }

      const productType = ['sticker', 'print'].includes(body.productType) ? body.productType : 'print';
      const artistName = body.artistName ? String(body.artistName).trim().slice(0, 200) : undefined;
      const description = body.description ? String(body.description).trim().slice(0, 500) : undefined;
      const language = ['fr', 'en', 'es'].includes(body.language) ? body.language : 'fr';

      const prompt = buildPrompt({ productName, productType, artistName, description, language });
      const raw = await callAIProvider(prompt);
      const variants = parseAdResponse(raw);

      if (variants.length === 0) {
        // console.error en plus de strapi.log pour etre SUR de voir le warning
        // dans les logs Render meme si strapi.log n'est pas init.
        console.error('[ads-generator] Aucune variante parsable depuis la reponse AI:', raw.slice(0, 500));
        ctx.status = 502;
        ctx.body = {
          error: 'L\'IA n\'a pas retourne de variantes parsables. Reessaie ou ajuste le prompt.',
          rawSample: raw.slice(0, 200),
        };
        return;
      }

      ctx.status = 200;
      ctx.body = {
        data: {
          productName,
          productType,
          variants,
          provider: process.env.OPENAI_API_KEY ? 'openai' : 'gemini',
        },
      };
    } catch (err: any) {
      // FIX-502 : log explicite via console.error (visible Render) en plus
      // de strapi.log (qui peut etre filtre/manquer). Toujours retourner un
      // JSON 500 propre, JAMAIS ctx.throw qui peut remonter au worker.
      const errMsg = err?.message || String(err) || 'Unknown error';
      const errStack = err?.stack || '';
      console.error('AI Error:', errMsg, '\n', errStack);
      try {
        ctx?.strapi?.log?.error?.(`[ads-generator] CRITICAL: ${errMsg}\n${errStack}`);
      } catch (_) { /* strapi.log peut etre indispo */ }
      ctx.status = 500;
      ctx.body = {
        error: 'Internal Server Error',
        detail: errMsg,
      };
    }
  },
};
