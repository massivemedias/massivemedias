/**
 * Genere 12 photos de pieces avec cadres integres (6 scenes x 2 couleurs de cadre)
 * Chaque photo a un rectangle VERT VIF (#00FF00) a l'interieur du cadre = placeholder
 *
 * Usage: GEMINI_API_KEY=xxx node scripts/generate-mockup-frames.mjs
 * Ensuite: node scripts/detect-green-rects.mjs (detecte les coords)
 */
import fs from 'fs';
import path from 'path';

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { console.error('GEMINI_API_KEY required'); process.exit(1); }

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${API_KEY}`;
const OUT_DIR = path.resolve('frontend/public/images/mockups');

const SCENES = [
  { id: 'living_room', desc: 'a cozy modern living room with a velvet sofa, throw pillows, a side table with a monstera plant, warm hardwood floors, and warm golden light from a window on the left' },
  { id: 'bedroom', desc: 'a serene modern bedroom with a bed with crisp white linen bedding, an upholstered headboard, bedside tables with warm lamps, soft natural morning light' },
  { id: 'office', desc: 'a stylish home office with a solid walnut desk, a leather chair, a small potted plant, a few books, natural light from a window' },
  { id: 'dining', desc: 'an elegant dining room with an oak dining table, two chairs, a ceramic vase with fresh eucalyptus on the table, a pendant light above, herringbone wood floors' },
  { id: 'studio', desc: 'a bright artist studio with a wooden easel to the right side, paint tubes and brushes on a small table, a stool, polished concrete floors, bright diffused skylight from above' },
  { id: 'zen', desc: 'a peaceful zen meditation room with a low wooden bench, a small bonsai in a ceramic pot, two candles, light bamboo flooring, soft peaceful natural light' },
];

function buildPrompt(scene, frameColor) {
  const frameDesc = frameColor === 'black'
    ? 'a sleek thin BLACK wooden picture frame with a subtle shadow on the wall'
    : 'an elegant thin WHITE wooden picture frame with a subtle shadow on the wall';

  return `Create a photorealistic interior design photograph of ${scene.desc}.

MOST IMPORTANT ELEMENT - THE FRAMED ARTWORK:
A ${frameDesc} is hanging centered on the wall, slightly above eye level.
Inside the frame there is a white mat/passe-partout border.
Inside the mat, there is a SOLID FLAT BRIGHT GREEN rectangle (pure #00FF00 green color).
This green area is a placeholder - it must be:
- A PERFECT FLAT RECTANGLE with perfectly straight edges
- PURE solid #00FF00 green - absolutely NO shadows, NO gradients, NO reflections on the green itself
- NO perspective distortion - the green rectangle must have 90-degree corners
- Clean sharp boundaries between the green and the mat

The frame takes about 25-35% of the image width.
The furniture and decor are in the LOWER 40% of the image. The frame hangs in the UPPER 60%.
Nothing overlaps the frame.

Shot: straight-on, eye level, professional interior design magazine photography.
Lighting: warm natural light, cozy atmosphere.
Format: wide landscape 16:10 ratio, high quality.
No text, no watermark, no signature, no people.`;
}

async function generateImage(scene, frameColor) {
  const key = `${scene.id}_${frameColor}`;
  const outPath = path.join(OUT_DIR, `${key}.png`);

  // Skip si deja genere
  if (fs.existsSync(outPath)) {
    console.log(`  ${key}.png already exists, skipping`);
    return outPath;
  }

  console.log(`Generating ${key}...`);

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(scene, frameColor) }] }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`  ERROR ${res.status}: ${err.slice(0, 200)}`);
    return null;
  }

  const data = await res.json();
  const parts = data.candidates?.[0]?.content?.parts || [];
  const imgPart = parts.find(p => p.inlineData?.mimeType?.startsWith('image/'));
  if (!imgPart) { console.error(`  No image for ${key}`); return null; }

  const buffer = Buffer.from(imgPart.inlineData.data, 'base64');
  fs.writeFileSync(outPath, buffer);
  console.log(`  Saved ${key}.png (${Math.round(buffer.length / 1024)}KB)`);
  return outPath;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const scene of SCENES) {
    for (const frame of ['black', 'white']) {
      await generateImage(scene, frame);
      // Pause pour eviter le rate limit
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  console.log('\nDone generating! Now run:');
  console.log('node scripts/detect-green-rects.mjs');
}

main().catch(console.error);
