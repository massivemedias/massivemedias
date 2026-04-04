/**
 * Script one-shot: genere 6 photos de pieces via Gemini et les sauvegarde en WebP.
 * Usage: GEMINI_API_KEY=xxx node scripts/generate-room-backgrounds.mjs
 */
import fs from 'fs';
import path from 'path';

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { console.error('GEMINI_API_KEY required'); process.exit(1); }

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${API_KEY}`;
const OUT_DIR = path.resolve('frontend/public/images/mockups');

const ROOMS = [
  {
    id: 'living_room',
    prompt: 'Generate a photorealistic interior photograph of a cozy modern living room. Show a large empty beige/cream colored wall as the main focus. Below the wall, show a stylish grey sofa with throw pillows, a small side table with a plant, and warm natural lighting from a window on the left. Hardwood floors. The wall must be mostly empty and clean - no artwork, no frames, no decorations on the main wall. Camera angle: straight on, eye level. Style: professional interior design photography, warm ambient lighting. Aspect ratio: 16:10 landscape.',
  },
  {
    id: 'bedroom',
    prompt: 'Generate a photorealistic interior photograph of a serene modern bedroom. Show a large empty soft grey/lavender wall as the main focus. Below, show a bed with white linen bedding and a padded headboard, bedside tables with small lamps. Soft natural light from a window. The wall must be mostly empty and clean - no artwork, no frames on the main wall. Camera angle: straight on, eye level. Style: professional interior design photography, soft warm lighting. Aspect ratio: 16:10 landscape.',
  },
  {
    id: 'office',
    prompt: 'Generate a photorealistic interior photograph of a stylish home office. Show a large empty light grey wall as the main focus. Below, show a wooden desk with a monitor, a comfortable chair, and a small bookshelf to the side. Natural light from a window. The wall must be mostly empty and clean - no artwork, no frames on the main wall. Camera angle: straight on, eye level. Style: professional interior design photography, clean natural lighting. Aspect ratio: 16:10 landscape.',
  },
  {
    id: 'dining',
    prompt: 'Generate a photorealistic interior photograph of an elegant dining room. Show a large empty warm cream/ivory wall as the main focus. Below, show a wooden dining table with chairs, a vase with flowers on the table, and a pendant light above. The wall must be mostly empty and clean - no artwork, no frames on the main wall. Camera angle: straight on, eye level. Style: professional interior design photography, warm golden hour lighting. Aspect ratio: 16:10 landscape.',
  },
  {
    id: 'studio',
    prompt: 'Generate a photorealistic interior photograph of a bright creative artist studio. Show a large empty white/off-white wall as the main focus. Below, show art supplies, an easel to the side, paint tubes, and concrete or wooden floors. Large skylights providing bright natural light. The wall must be mostly empty and clean - no artwork hanging, no frames on the main wall. Camera angle: straight on, eye level. Style: professional interior design photography, bright diffused lighting. Aspect ratio: 16:10 landscape.',
  },
  {
    id: 'zen',
    prompt: 'Generate a photorealistic interior photograph of a peaceful zen/meditation room. Show a large empty warm beige/sand wall as the main focus. Below, show a low wooden bench or platform, a small potted plant (bamboo or bonsai), and perhaps a candle. Natural materials, minimalist. The wall must be mostly empty and clean - no artwork, no frames on the main wall. Camera angle: straight on, eye level. Style: professional interior design photography, soft peaceful natural lighting. Aspect ratio: 16:10 landscape.',
  },
];

async function generateRoom(room) {
  console.log(`Generating ${room.id}...`);
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: room.prompt }] }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`  ERROR ${res.status}: ${err.slice(0, 200)}`);
    return false;
  }

  const data = await res.json();
  const parts = data.candidates?.[0]?.content?.parts || [];
  const imgPart = parts.find(p => p.inlineData?.mimeType?.startsWith('image/'));

  if (!imgPart) {
    console.error(`  No image returned for ${room.id}`);
    return false;
  }

  const buffer = Buffer.from(imgPart.inlineData.data, 'base64');
  const ext = imgPart.inlineData.mimeType.includes('png') ? 'png' : 'webp';
  const outPath = path.join(OUT_DIR, `${room.id}.${ext}`);
  fs.writeFileSync(outPath, buffer);
  console.log(`  Saved ${outPath} (${Math.round(buffer.length / 1024)}KB)`);
  return true;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const room of ROOMS) {
    const ok = await generateRoom(room);
    if (!ok) console.log(`  Skipping ${room.id}, will retry later`);
    // Pause entre les appels pour eviter le rate limit
    await new Promise(r => setTimeout(r, 3000));
  }
  console.log('Done!');
}

main().catch(console.error);
