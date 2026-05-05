"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../../../utils/auth");
const GEMINI_TEXT_API = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
/**
 * Construit le prompt structure envoye a Gemini. On force du JSON strict
 * pour pouvoir parser la reponse de maniere fiable. La langue par defaut
 * est francais (marche du Quebec) mais on accepte un override.
 */
function buildPrompt(opts) {
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
function parseAdResponse(raw) {
    if (!raw)
        return [];
    let cleaned = raw.trim();
    // Strip ```json ... ``` markdown wrapper si present
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/, '').trim();
    try {
        const parsed = JSON.parse(cleaned);
        const variants = Array.isArray(parsed === null || parsed === void 0 ? void 0 : parsed.variants) ? parsed.variants : [];
        return variants
            .filter((v) => v && typeof v === 'object')
            .map((v) => ({
            headline: String(v.headline || '').trim().slice(0, 80),
            body: String(v.body || '').trim().slice(0, 200),
            cta: String(v.cta || '').trim().slice(0, 30),
        }))
            .filter((v) => v.headline && v.body && v.cta)
            .slice(0, 3);
    }
    catch (err) {
        return [];
    }
}
/**
 * Appel OpenAI (si OPENAI_API_KEY) sinon fallback Gemini. On retourne
 * toujours du texte brut, le parsing est fait apres.
 */
async function callAIProvider(prompt) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
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
        if (!res.ok)
            throw new Error(`OpenAI ${res.status} ${await res.text().catch(() => '')}`);
        const data = await res.json();
        return ((_c = (_b = (_a = data === null || data === void 0 ? void 0 : data.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) || '';
    }
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey)
        throw new Error('Aucune cle API configuree (OPENAI_API_KEY ou GEMINI_API_KEY)');
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
    if (!res.ok)
        throw new Error(`Gemini ${res.status} ${await res.text().catch(() => '')}`);
    const data = await res.json();
    return ((_h = (_g = (_f = (_e = (_d = data === null || data === void 0 ? void 0 : data.candidates) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.content) === null || _f === void 0 ? void 0 : _f.parts) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.text) || '';
}
exports.default = {
    async generate(ctx) {
        var _a, _b, _c, _d, _e, _f;
        if (!(await (0, auth_1.requireAdminAuth)(ctx)))
            return;
        const body = ctx.request.body || {};
        const productName = String(body.productName || '').trim();
        if (!productName)
            return ctx.badRequest('productName requis');
        if (productName.length > 200)
            return ctx.badRequest('productName max 200 chars');
        const productType = ['sticker', 'print'].includes(body.productType) ? body.productType : 'print';
        const artistName = body.artistName ? String(body.artistName).trim().slice(0, 200) : undefined;
        const description = body.description ? String(body.description).trim().slice(0, 500) : undefined;
        const language = ['fr', 'en', 'es'].includes(body.language) ? body.language : 'fr';
        try {
            const prompt = buildPrompt({ productName, productType, artistName, description, language });
            const raw = await callAIProvider(prompt);
            const variants = parseAdResponse(raw);
            if (variants.length === 0) {
                (_c = (_b = (_a = ctx.strapi) === null || _a === void 0 ? void 0 : _a.log) === null || _b === void 0 ? void 0 : _b.warn) === null || _c === void 0 ? void 0 : _c.call(_b, `[ads-generator] Aucune variante parsable depuis la reponse AI : ${raw.slice(0, 300)}`);
                return ctx.internalServerError('L\'IA n\'a pas retourne de variantes parsables. Reessaie ou ajuste le prompt.');
            }
            ctx.body = {
                data: {
                    productName,
                    productType,
                    variants,
                    provider: process.env.OPENAI_API_KEY ? 'openai' : 'gemini',
                },
            };
        }
        catch (err) {
            (_f = (_e = (_d = ctx.strapi) === null || _d === void 0 ? void 0 : _d.log) === null || _e === void 0 ? void 0 : _e.error) === null || _f === void 0 ? void 0 : _f.call(_e, `[ads-generator] Erreur generation : ${(err === null || err === void 0 ? void 0 : err.message) || err}\n${(err === null || err === void 0 ? void 0 : err.stack) || ''}`);
            ctx.throw(500, (err === null || err === void 0 ? void 0 : err.message) || 'Erreur generation publicite');
        }
    },
};
