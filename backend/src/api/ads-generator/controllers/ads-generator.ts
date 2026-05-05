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
 */
async function callAIProvider(prompt: string): Promise<string> {
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
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status} ${await res.text().catch(() => '')}`);
    const data: any = await res.json();
    return data?.choices?.[0]?.message?.content || '';
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) throw new Error('Aucune cle API configuree (OPENAI_API_KEY ou GEMINI_API_KEY)');
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
  });
  if (!res.ok) throw new Error(`Gemini ${res.status} ${await res.text().catch(() => '')}`);
  const data: any = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export default {
  async generate(ctx: any) {
    if (!(await requireAdminAuth(ctx))) return;
    const body = ctx.request.body || {};
    const productName = String(body.productName || '').trim();
    if (!productName) return ctx.badRequest('productName requis');
    if (productName.length > 200) return ctx.badRequest('productName max 200 chars');

    const productType = ['sticker', 'print'].includes(body.productType) ? body.productType : 'print';
    const artistName = body.artistName ? String(body.artistName).trim().slice(0, 200) : undefined;
    const description = body.description ? String(body.description).trim().slice(0, 500) : undefined;
    const language = ['fr', 'en', 'es'].includes(body.language) ? body.language : 'fr';

    try {
      const prompt = buildPrompt({ productName, productType, artistName, description, language });
      const raw = await callAIProvider(prompt);
      const variants = parseAdResponse(raw);

      if (variants.length === 0) {
        ctx.strapi?.log?.warn?.(
          `[ads-generator] Aucune variante parsable depuis la reponse AI : ${raw.slice(0, 300)}`
        );
        return ctx.internalServerError(
          'L\'IA n\'a pas retourne de variantes parsables. Reessaie ou ajuste le prompt.'
        );
      }

      ctx.body = {
        data: {
          productName,
          productType,
          variants,
          provider: process.env.OPENAI_API_KEY ? 'openai' : 'gemini',
        },
      };
    } catch (err: any) {
      ctx.strapi?.log?.error?.(
        `[ads-generator] Erreur generation : ${err?.message || err}\n${err?.stack || ''}`
      );
      ctx.throw(500, err?.message || 'Erreur generation publicite');
    }
  },
};
