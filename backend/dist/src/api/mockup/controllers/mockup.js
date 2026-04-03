"use strict";
/**
 * Mockup Generator - Gemini AI
 * Genere un mockup realiste d'un print dans un cadre sur un mur
 *
 * - 6 scenes disponibles (salon, chambre, bureau, salle a manger, studio, zen)
 * - 4 styles de decor aleatoires par scene
 * - Cadre noir ou blanc
 * - Rate limiting: 30 req/min par IP
 */
Object.defineProperty(exports, "__esModule", { value: true });
// gemini-2.5-flash-image: modele stable pour generation d'images
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent';
// Descriptions de scenes avec variantes de decor
const SCENE_PROMPTS = {
    living_room: [
        'a cozy modern living room with a deep velvet sofa, warm Edison bulb lighting, decorative plants, and a soft area rug on hardwood floors',
        'a Scandinavian living room with a light grey linen sofa, minimalist wooden furniture, large windows with sheer curtains, and potted ferns',
        'a mid-century modern living room with a teak credenza, an Eames lounge chair, warm ambient lighting, and a geometric rug',
        'a bohemian living room with a tufted leather sofa, macrame wall hangings, layered textiles, warm candlelight, and trailing plants',
    ],
    bedroom: [
        'a serene bedroom with soft natural light from large windows, a bed with white linen bedding, bedside wooden tables, and dried flower arrangements',
        'a cozy bedroom with warm string lights, a plush grey duvet, floating wooden shelves, and a soft knit throw blanket',
        'a minimalist Japanese-inspired bedroom with a low platform bed, tatami-style flooring, a paper lantern, and a small bonsai on the nightstand',
        'a romantic Parisian bedroom with ornate molding, a wrought-iron bed frame, vintage nightstands, and soft golden light from a table lamp',
    ],
    office: [
        'a stylish home office with a solid walnut desk, built-in bookshelves filled with books, a leather desk chair, and warm natural light from a window',
        'a creative studio workspace with an industrial metal desk, exposed brick wall, vintage task lamp, and art supplies organized on shelves',
        'a modern home office with a clean white desk, large monitor, indoor plants, and floor-to-ceiling windows overlooking a garden',
        'a cozy writer\'s office with a dark wood desk, stacked books, a brass desk lamp, and rain visible through a nearby window',
    ],
    dining: [
        'an elegant dining room with a long oak table, linen chairs, a statement chandelier, and fresh flowers in a ceramic vase',
        'a rustic farmhouse dining room with a reclaimed wood table, woven placemats, terracotta pottery, and warm pendant lights',
        'a modern dining space with a round marble table, velvet chairs, a gold pendant light, and a minimalist sideboard',
        'a Mediterranean dining room with terracotta floors, a wooden table with blue ceramic dishes, olive branches in a vase, and warm afternoon light',
    ],
    studio: [
        'a bright artist\'s studio with concrete floors, large skylights, paint-splattered easels, and canvases leaning against exposed brick walls',
        'a photographer\'s studio with soft diffused lighting, neutral grey walls, a comfortable viewing couch, and a clean modern aesthetic',
        'a music producer\'s studio with acoustic panels, warm LED strips, a mixing console, and vintage vinyl records on the wall',
        'a designer\'s loft studio with high ceilings, a drafting table, mood boards, material samples, and industrial pendant lighting',
    ],
    zen: [
        'a peaceful meditation room with bamboo flooring, a low wooden bench, incense smoke, a small indoor fountain, and soft warm light',
        'a Japanese tea room with tatami mats, a tokonoma alcove, a hanging scroll, fresh ikebana, and natural wood beams',
        'a yoga studio corner with a cork mat, a potted monstera plant, soft white curtains, natural wood walls, and diffused morning light',
        'a tranquil spa-like bathroom alcove with smooth stone walls, a teak bench, candles, eucalyptus branches, and warm indirect lighting',
    ],
};
// Rate limiting simple en memoire
const rateLimitMap = new Map();
const RATE_LIMIT = 30; // requetes
const RATE_WINDOW = 60 * 1000; // par minute
function checkRateLimit(ip) {
    const now = Date.now();
    const timestamps = rateLimitMap.get(ip) || [];
    const recent = timestamps.filter(t => t > now - RATE_WINDOW);
    rateLimitMap.set(ip, recent);
    if (recent.length >= RATE_LIMIT)
        return false;
    recent.push(now);
    return true;
}
// Nettoyage periodique
setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of rateLimitMap.entries()) {
        const recent = timestamps.filter(t => t > now - RATE_WINDOW);
        if (recent.length === 0)
            rateLimitMap.delete(ip);
        else
            rateLimitMap.set(ip, recent);
    }
}, 5 * 60 * 1000);
exports.default = {
    async generate(ctx) {
        var _a, _b, _c;
        const { imageUrl, scene = 'living_room', frameColor = 'black' } = ctx.request.body;
        if (!imageUrl) {
            return ctx.badRequest('imageUrl is required');
        }
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            strapi.log.error('GEMINI_API_KEY not configured');
            return ctx.badRequest('Mockup generation not configured');
        }
        // Rate limiting
        const clientIp = ctx.request.ip || 'unknown';
        if (!checkRateLimit(clientIp)) {
            ctx.status = 429;
            ctx.body = { error: 'Too many requests. Try again in a minute.' };
            return;
        }
        try {
            let base64Image;
            let mimeType;
            // Supporter les data URI (depuis l'admin) et les URL normales (depuis le frontend)
            if (imageUrl.startsWith('data:')) {
                const match = imageUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
                if (!match)
                    return ctx.badRequest('Invalid data URI format');
                mimeType = match[1];
                base64Image = match[2];
                strapi.log.info(`Mockup generate: using inline base64 image (${mimeType})`);
            }
            else {
                strapi.log.info(`Mockup generate: downloading ${imageUrl}`);
                const imgRes = await fetch(imageUrl);
                if (!imgRes.ok)
                    throw new Error(`Failed to download image: ${imgRes.status}`);
                const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
                base64Image = imgBuffer.toString('base64');
                mimeType = imgRes.headers.get('content-type') || 'image/webp';
            }
            // Choisir un decor aleatoire pour la scene
            const sceneVariants = SCENE_PROMPTS[scene] || SCENE_PROMPTS.living_room;
            const sceneDesc = sceneVariants[Math.floor(Math.random() * sceneVariants.length)];
            const frameDesc = frameColor === 'white'
                ? 'an elegant thin white wooden frame with a subtle shadow'
                : 'a sleek thin black wooden frame with a subtle shadow';
            const prompt = [
                `Generate a photorealistic interior design photograph showing this artwork displayed in ${frameDesc},`,
                `hanging centered on a wall in ${sceneDesc}.`,
                `IMPORTANT FRAMING: The framed artwork must occupy at least 50-60% of the image area.`,
                `Shoot as a CLOSE-UP of the wall and frame - the frame and artwork are the hero of the shot.`,
                `Only show a small portion of the room around the frame for context (a sliver of furniture, a plant edge, part of a shelf).`,
                `The artwork MUST be clearly visible, sharp, and undistorted inside the frame - it is the absolute focal point.`,
                `The frame should be well-lit with warm natural lighting creating soft shadows on the wall.`,
                `Camera angle: straight-on, slightly below eye level, tight crop on the frame.`,
                `Style: professional interior design photography, warm cozy ambiance, gallery-quality close-up.`,
                `Aspect ratio: portrait orientation (9:16).`,
                `Do NOT add any text, watermark, logo, or signature. Do NOT alter the artwork itself.`,
            ].join(' ');
            strapi.log.info(`Mockup generate: calling Gemini API, scene=${scene}, frame=${frameColor}`);
            const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                            parts: [
                                { text: prompt },
                                {
                                    inlineData: {
                                        mimeType,
                                        data: base64Image,
                                    },
                                },
                            ],
                        }],
                    generationConfig: {
                        responseModalities: ['TEXT', 'IMAGE'],
                    },
                }),
            });
            if (!geminiRes.ok) {
                const errText = await geminiRes.text();
                strapi.log.error(`Gemini API error: ${geminiRes.status} ${errText}`);
                if (geminiRes.status === 429) {
                    ctx.status = 429;
                    ctx.body = { error: 'Gemini API rate limit reached' };
                    return;
                }
                return ctx.badRequest(`Gemini API error: ${geminiRes.status}`);
            }
            const result = await geminiRes.json();
            // Extraire l'image generee de la reponse
            const parts = ((_c = (_b = (_a = result.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) || [];
            const imagePart = parts.find((p) => { var _a, _b; return (_b = (_a = p.inlineData) === null || _a === void 0 ? void 0 : _a.mimeType) === null || _b === void 0 ? void 0 : _b.startsWith('image/'); });
            if (!imagePart) {
                const textParts = parts.filter((p) => p.text).map((p) => p.text).join(' ');
                strapi.log.warn('Gemini did not return an image. Text response:', textParts.slice(0, 200));
                return ctx.badRequest('Mockup generation failed - no image returned');
            }
            strapi.log.info(`Mockup generated successfully (scene=${scene}, frame=${frameColor})`);
            ctx.body = {
                success: true,
                image: {
                    mimeType: imagePart.inlineData.mimeType,
                    data: imagePart.inlineData.data,
                },
                meta: { scene, frameColor },
            };
        }
        catch (err) {
            strapi.log.error('Mockup generation error:', (err === null || err === void 0 ? void 0 : err.message) || err);
            ctx.throw(500, 'Mockup generation failed');
        }
    },
};
