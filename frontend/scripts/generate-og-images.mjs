/**
 * Generate OG images (1200x630) for each artist
 * Usage: node scripts/generate-og-images.mjs
 */
import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, '..', 'public');
const OUT = join(PUBLIC, 'images', 'og');

const W = 1200;
const H = 630;

// Massive brand colors
const BG_COLOR = '#3D0079';
const ACCENT = '#FF69B4';
const YELLOW = '#FFCC02';

const artists = [
  { slug: 'adrift', name: 'Adrift', tagline: 'Digital Art & Immersive Worlds', avatar: 'images/prints/AdriftAvatar.webp', artwork: 'images/prints/Adrift1.webp' },
  { slug: 'maudite-machine', name: 'Maudite Machine', tagline: 'Electronic Music & Visual Culture', avatar: 'images/stickers/Stickers-Maudite-Machine.webp', artwork: 'images/prints/Gemini2.webp' },
  { slug: 'mok', name: 'Mok', tagline: 'Urban Photography & Light', avatar: 'images/prints/MokAvatar.webp', artwork: 'images/prints/Mok1.webp' },
  { slug: 'quentin-delobel', name: 'Quentin Delobel', tagline: 'Photography - Light, Contrasts & Intimacy', avatar: 'images/prints/QuentinDelobelAvatar.webp', artwork: 'images/prints/QuentinDelobel15.webp' },
  { slug: 'no-pixl', name: 'No Pixl', tagline: 'Event Photography & Landscapes', avatar: 'images/prints/NoPixlAvatar.webp', artwork: 'images/prints/NoPixl2.webp' },
  { slug: 'psyqu33n', name: 'Psyqu33n', tagline: 'Shadow & Light - Visionary Art', avatar: 'images/stickers/Stickers-Psyqu33n12.webp', artwork: 'images/prints/Psyqu33n1.webp' },
  { slug: 'cornelia-rose', name: 'Cornelia Rose', tagline: 'Visionary Art & Body Painting', avatar: 'images/prints/CorneliaRoseAvatar.webp', artwork: 'images/prints/CorneliaRose1.webp' },
];

// Massive logo SVG (simplified)
const massiveLogo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1134 228" width="220" height="44">
  <path d="M356.9 25.2L533.4 25.6V83.5L430.5 83.1V97.5H533.4V227.8H356.9V169.9H459.9V155.5H356.9V25.2Z" fill="${ACCENT}"/>
  <path d="M549.1 25.1L814.9 25.2V83.1L622.7 83V97.5H725.8V227.8H549.1V169.9H652.2V155.4H549.1V25.1Z" fill="${ACCENT}"/>
  <path d="M814.9 97.8V228H741.3V97.8H814.9Z" fill="${ACCENT}"/>
  <path d="M960.7 25.1H1034.2L917.6 228L828.2 226.9V25.1H901.8L902.6 112.3L960.7 25.1Z" fill="${ACCENT}"/>
  <path d="M1134 155.4L974.6 155.6L1008 97.5L1134 97.3V155.4Z" fill="${ACCENT}"/>
  <path d="M1134 227.8H933.1L966.5 169.8H1134V227.8Z" fill="${ACCENT}"/>
  <path d="M1134 83.3L1015.8 83.1L1049.2 25L1134 25.2V83.3Z" fill="${ACCENT}"/>
  <path d="M25 25.2C25 25.2 25 225 25 227.8H95V82.7H122.8L122.8 227.7L192.2 227.8V92.3C192.2 92.3 304.2 28.9 307.8 25.2" fill="${YELLOW}"/>
  <path d="M207.4 102.6V178.9L270.7 143.6L270.8 227.8L340.6 227.7V25.3L207.4 102.6Z" fill="${YELLOW}"/>
</svg>`;

async function generateOGImage(artist) {
  console.log(`Generating OG image for ${artist.name}...`);

  const artworkPath = join(PUBLIC, artist.artwork);
  const avatarPath = join(PUBLIC, artist.avatar);

  // Resize artwork to fill right side (600x630)
  const artwork = await sharp(artworkPath)
    .resize(600, H, { fit: 'cover', position: 'center' })
    .toBuffer();

  // Create circular avatar (140x140)
  const avatarSize = 140;
  const avatarRaw = await sharp(avatarPath)
    .resize(avatarSize, avatarSize, { fit: 'cover' })
    .toBuffer();

  // Create circular mask
  const circleMask = Buffer.from(
    `<svg width="${avatarSize}" height="${avatarSize}"><circle cx="${avatarSize/2}" cy="${avatarSize/2}" r="${avatarSize/2}" fill="white"/></svg>`
  );
  const avatar = await sharp(avatarRaw)
    .composite([{ input: circleMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // Avatar border ring
  const ringSize = avatarSize + 8;
  const avatarRing = Buffer.from(
    `<svg width="${ringSize}" height="${ringSize}">
      <circle cx="${ringSize/2}" cy="${ringSize/2}" r="${ringSize/2}" fill="none" stroke="${ACCENT}" stroke-width="4"/>
    </svg>`
  );

  // Dark gradient overlay for artwork (left fade)
  const gradientOverlay = Buffer.from(
    `<svg width="600" height="${H}">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="${BG_COLOR}" stop-opacity="1"/>
          <stop offset="0.4" stop-color="${BG_COLOR}" stop-opacity="0.85"/>
          <stop offset="0.7" stop-color="${BG_COLOR}" stop-opacity="0.3"/>
          <stop offset="1" stop-color="${BG_COLOR}" stop-opacity="0.1"/>
        </linearGradient>
      </defs>
      <rect width="600" height="${H}" fill="url(#g)"/>
    </svg>`
  );

  // Text overlay SVG (left side)
  const nameSize = artist.name.length > 14 ? 48 : 56;
  const safeName = artist.name.replace(/&/g, '&amp;');
  const safeTagline = artist.tagline.replace(/&/g, '&amp;');
  const textSvg = Buffer.from(
    `<svg width="560" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <text x="0" y="350" font-family="Arial, Helvetica, sans-serif" font-weight="700" fill="white" font-size="${nameSize}">${safeName}</text>
      <text x="0" y="388" font-family="Arial, Helvetica, sans-serif" font-weight="400" fill="#FFFFFFB3" font-size="20">${safeTagline}</text>
      <text x="0" y="440" font-family="Arial, Helvetica, sans-serif" font-weight="700" fill="${YELLOW}" font-size="16">Fine Art Prints Available</text>
      <text x="0" y="480" font-family="Arial, Helvetica, sans-serif" font-weight="400" fill="#FFFFFF80" font-size="14">${artist.slug}.massivemedias.com</text>
    </svg>`
  );

  // Bottom accent line
  const bottomLine = Buffer.from(
    `<svg width="${W}" height="6">
      <rect width="${W}" height="6" fill="${ACCENT}"/>
    </svg>`
  );

  // Compose everything
  const image = await sharp({
    create: { width: W, height: H, channels: 4, background: BG_COLOR },
  })
    .composite([
      // Artwork on right
      { input: artwork, left: 600, top: 0 },
      // Gradient overlay on artwork
      { input: gradientOverlay, left: 600, top: 0 },
      // Logo top-left
      { input: Buffer.from(massiveLogo), left: 50, top: 40 },
      // Avatar ring
      { input: avatarRing, left: 46, top: 170 },
      // Avatar
      { input: avatar, left: 50, top: 174 },
      // Text
      { input: textSvg, left: 50, top: 0 },
      // Bottom accent line
      { input: bottomLine, left: 0, top: H - 6 },
    ])
    .jpeg({ quality: 90 })
    .toFile(join(OUT, `og-${artist.slug}.jpg`));

  console.log(`  -> og-${artist.slug}.jpg (${image.size} bytes)`);
}

async function main() {
  console.log('Generating artist OG images...\n');
  for (const artist of artists) {
    try {
      await generateOGImage(artist);
    } catch (err) {
      console.error(`  ERROR for ${artist.name}:`, err.message);
    }
  }
  console.log('\nDone!');
}

main();
