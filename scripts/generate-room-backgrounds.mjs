/**
 * Script one-shot: genere 6 photos de pieces via Gemini et les sauvegarde en WebP.
 * Les photos montrent un mur vide avec des meubles en bas - le cadre sera superpose en CSS.
 * Usage: GEMINI_API_KEY=xxx node scripts/generate-room-backgrounds.mjs
 */
import fs from 'fs';
import path from 'path';

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { console.error('GEMINI_API_KEY required'); process.exit(1); }

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${API_KEY}`;
const OUT_DIR = path.resolve('frontend/public/images/mockups');

// Chaque prompt est concu pour:
// - Format paysage 16:10
// - Un grand mur vide dans les 2/3 superieurs
// - Meubles seulement dans le 1/3 inferieur
// - Eclairage chaud naturel, photo pro
const ROOMS = [
  {
    id: 'living_room',
    prompt: `Professional interior photography of a modern living room, shot at eye level straight-on.
COMPOSITION: The image is divided roughly into upper 2/3 and lower 1/3.
UPPER 2/3: A large, clean, empty wall in warm beige/cream tone. The wall is completely bare - absolutely no art, frames, shelves, or decorations on it. Subtle wall texture visible.
LOWER 1/3: A comfortable dark grey velvet sofa with 2 throw pillows (one mustard, one white), a small wooden side table with a potted monstera plant. Warm hardwood flooring.
LIGHTING: Warm natural light coming from the left side, creating a soft gradient on the wall. Golden hour feel.
STYLE: High-end interior design magazine photography. 4K quality, sharp, professional color grading.
ASPECT RATIO: Wide landscape format, 16:10 ratio.
IMPORTANT: The wall must be pristinely empty - this is crucial as artwork will be digitally added later.`,
  },
  {
    id: 'bedroom',
    prompt: `Professional interior photography of a serene modern bedroom, shot at eye level straight-on.
COMPOSITION: The image is divided roughly into upper 2/3 and lower 1/3.
UPPER 2/3: A large, clean, empty wall in soft warm grey/lavender tone. The wall is completely bare - absolutely no art, frames, shelves, or decorations. Subtle paint texture.
LOWER 1/3: A bed with upholstered headboard in light fabric, crisp white linen bedding, two white pillows, a small bedside table with a table lamp emitting warm light. Light wooden flooring.
LIGHTING: Soft, diffused natural light from a window to the right. Warm, peaceful atmosphere.
STYLE: High-end interior design magazine photography. 4K quality, sharp, professional.
ASPECT RATIO: Wide landscape format, 16:10 ratio.
IMPORTANT: The wall must be pristinely empty - this is crucial as artwork will be digitally added later.`,
  },
  {
    id: 'office',
    prompt: `Professional interior photography of a stylish home office, shot at eye level straight-on.
COMPOSITION: The image is divided roughly into upper 2/3 and lower 1/3.
UPPER 2/3: A large, clean, empty wall in light warm grey tone. The wall is completely bare - absolutely no art, frames, shelves, or decorations.
LOWER 1/3: A solid walnut wooden desk with a modern monitor, a leather desk chair, a small plant, and a brass desk lamp. Light hardwood or concrete flooring.
LIGHTING: Clean natural light from a window to the left. Professional, focused atmosphere.
STYLE: High-end interior design magazine photography. 4K quality, sharp, professional.
ASPECT RATIO: Wide landscape format, 16:10 ratio.
IMPORTANT: The wall must be pristinely empty - this is crucial as artwork will be digitally added later.`,
  },
  {
    id: 'dining',
    prompt: `Professional interior photography of an elegant dining room, shot at eye level straight-on.
COMPOSITION: The image is divided roughly into upper 2/3 and lower 1/3.
UPPER 2/3: A large, clean, empty wall in warm cream/ivory tone. The wall is completely bare - absolutely no art, frames, shelves, or decorations. Subtle texture.
LOWER 1/3: An oak dining table with two visible chairs, a ceramic vase with fresh eucalyptus branches on the table, a pendant light hanging from above visible at top of frame. Herringbone wooden flooring.
LIGHTING: Warm golden afternoon light from the right. Elegant, inviting atmosphere.
STYLE: High-end interior design magazine photography. 4K quality, sharp, professional.
ASPECT RATIO: Wide landscape format, 16:10 ratio.
IMPORTANT: The wall must be pristinely empty - this is crucial as artwork will be digitally added later.`,
  },
  {
    id: 'studio',
    prompt: `Professional interior photography of a bright artist's studio, shot at eye level straight-on.
COMPOSITION: The image is divided roughly into upper 2/3 and lower 1/3.
UPPER 2/3: A large, clean, empty white/off-white wall. The wall is completely bare - absolutely no art, frames, or decorations hanging on it.
LOWER 1/3: A wooden easel to the right side, some paint tubes and brushes on a small table, a wooden stool. Polished concrete flooring. Bright, creative space.
LIGHTING: Bright, diffused natural light from large windows or skylights. Airy and creative.
STYLE: High-end interior design magazine photography. 4K quality, sharp, professional.
ASPECT RATIO: Wide landscape format, 16:10 ratio.
IMPORTANT: The wall must be pristinely empty - this is crucial as artwork will be digitally added later.`,
  },
  {
    id: 'zen',
    prompt: `Professional interior photography of a peaceful zen meditation room, shot at eye level straight-on.
COMPOSITION: The image is divided roughly into upper 2/3 and lower 1/3.
UPPER 2/3: A large, clean, empty wall in warm sand/natural beige tone. The wall is completely bare - absolutely no art, frames, or decorations. Natural plaster texture.
LOWER 1/3: A low wooden bench or platform, a small bonsai tree in a ceramic pot, two candles. Natural bamboo or light wood flooring. Minimal and peaceful.
LIGHTING: Soft, peaceful natural light. Zen and calming atmosphere.
STYLE: High-end interior design magazine photography. 4K quality, sharp, professional.
ASPECT RATIO: Wide landscape format, 16:10 ratio.
IMPORTANT: The wall must be pristinely empty - this is crucial as artwork will be digitally added later.`,
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
    console.error(`  ERROR ${res.status}: ${err.slice(0, 300)}`);
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
  const outPath = path.join(OUT_DIR, `${room.id}.png`);
  fs.writeFileSync(outPath, buffer);
  console.log(`  Saved ${outPath} (${Math.round(buffer.length / 1024)}KB)`);
  return true;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const room of ROOMS) {
    const ok = await generateRoom(room);
    if (!ok) console.log(`  Skipping ${room.id}`);
    // Pause entre les appels
    await new Promise(r => setTimeout(r, 4000));
  }
  console.log('\nDone! Now convert to webp:');
  console.log('cd frontend/public/images/mockups && for f in *.png; do magick "$f" -resize 1400x875 -quality 82 "${f%.png}.webp" && rm "$f"; done');
}

main().catch(console.error);
