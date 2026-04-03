/**
 * Mockup Generator - Gemini AI
 * Genere un mockup realiste d'un print dans un cadre sur un mur
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

const SCENE_PROMPTS: Record<string, string> = {
  living_room: 'a cozy modern living room with a sofa, warm lighting, and decorative plants',
  bedroom: 'a serene bedroom with soft natural light, a bed with white linens, and minimal decor',
  office: 'a stylish home office with a wooden desk, bookshelves, and natural light from a window',
};

export default {
  async generate(ctx) {
    const { imageUrl, scene = 'living_room', frameColor = 'black' } = ctx.request.body as any;

    if (!imageUrl) {
      return ctx.badRequest('imageUrl is required');
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      strapi.log.error('GEMINI_API_KEY not configured');
      return ctx.badRequest('Mockup generation not configured');
    }

    try {
      // Telecharger l'image source
      strapi.log.info(`Mockup generate: downloading ${imageUrl}`);
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) throw new Error(`Failed to download image: ${imgRes.status}`);
      const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
      const base64Image = imgBuffer.toString('base64');
      const mimeType = imgRes.headers.get('content-type') || 'image/webp';

      const sceneDesc = SCENE_PROMPTS[scene] || SCENE_PROMPTS.living_room;
      const prompt = `Generate a photorealistic interior design photograph showing this artwork displayed in a ${frameColor} frame, hanging centered on a wall in ${sceneDesc}. The image should be in portrait orientation (9:16 ratio), zoomed in on the framed artwork. The frame should be the focal point, well-lit with warm natural lighting. The artwork must be clearly visible and undistorted inside the frame. Style: professional interior design photography, warm cozy ambiance, gallery quality. Do NOT add any text or watermark.`;

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
        return ctx.badRequest(`Gemini API error: ${geminiRes.status}`);
      }

      const result: any = await geminiRes.json();

      // Extraire l'image generee de la reponse
      const parts = result.candidates?.[0]?.content?.parts || [];
      const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));

      if (!imagePart) {
        strapi.log.warn('Gemini did not return an image', JSON.stringify(parts.map((p: any) => p.text || 'image').slice(0, 3)));
        return ctx.badRequest('Mockup generation failed - no image returned');
      }

      strapi.log.info('Mockup generated successfully');

      ctx.body = {
        success: true,
        image: {
          mimeType: imagePart.inlineData.mimeType,
          data: imagePart.inlineData.data,
        },
      };
    } catch (err: any) {
      strapi.log.error('Mockup generation error:', err?.message || err);
      ctx.throw(500, 'Mockup generation failed');
    }
  },
};
