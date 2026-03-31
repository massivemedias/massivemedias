"use strict";
// Traitement d'images artiste via Sharp
// Telecharge une image, genere full (1600px WebP Q80) + thumb (800px WebP Q75)
// Upload les deux versions dans Supabase Storage
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFromSupabase = exports.processArtistImage = void 0;
const sharp_1 = __importDefault(require("sharp"));
async function uploadToSupabase(buffer, path, bucket) {
    const apiUrl = process.env.SUPABASE_API_URL;
    const apiKey = process.env.SUPABASE_API_KEY;
    if (!apiUrl || !apiKey)
        throw new Error('Supabase env vars not configured');
    const storageBase = `${apiUrl}/storage/v1`;
    const res = await fetch(`${storageBase}/object/${bucket}/${path}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            apikey: apiKey,
            'Content-Type': 'image/webp',
            'x-upsert': 'true',
            'cache-control': 'max-age=3600',
        },
        body: buffer,
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Supabase upload failed (${res.status}): ${err}`);
    }
    return `${storageBase}/object/public/${bucket}/${path}`;
}
async function processArtistImage(originalUrl, artistSlug, imageId) {
    const bucket = process.env.SUPABASE_BUCKET || 'strapi-media';
    // Telecharger l'image originale
    const response = await fetch(originalUrl);
    if (!response.ok)
        throw new Error(`Failed to download image: ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);
    // Full: 1600px wide, WebP quality 80
    const fullBuffer = await (0, sharp_1.default)(inputBuffer)
        .resize({ width: 1600, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
    // Thumb: 800px wide, WebP quality 75
    const thumbBuffer = await (0, sharp_1.default)(inputBuffer)
        .resize({ width: 800, withoutEnlargement: true })
        .webp({ quality: 75 })
        .toBuffer();
    const fullPath = `artist-images/${artistSlug}/full/${imageId}.webp`;
    const thumbPath = `artist-images/${artistSlug}/thumbs/${imageId}.webp`;
    const fullUrl = await uploadToSupabase(fullBuffer, fullPath, bucket);
    const thumbUrl = await uploadToSupabase(thumbBuffer, thumbPath, bucket);
    return { fullUrl, thumbUrl };
}
exports.processArtistImage = processArtistImage;
// Supprime un fichier original de Supabase apres traitement
// Utilise pour le nettoyage des gros fichiers temporaires (TIFF, PNG haute-res)
async function deleteFromSupabase(fileUrl) {
    const apiUrl = process.env.SUPABASE_API_URL;
    const apiKey = process.env.SUPABASE_API_KEY;
    if (!apiUrl || !apiKey)
        return false;
    try {
        // Extraire le chemin du bucket depuis l'URL publique
        // Format: .../storage/v1/object/public/{bucket}/{path}
        const publicPrefix = '/storage/v1/object/public/';
        const idx = fileUrl.indexOf(publicPrefix);
        if (idx === -1)
            return false;
        const rest = fileUrl.substring(idx + publicPrefix.length);
        const slashIdx = rest.indexOf('/');
        if (slashIdx === -1)
            return false;
        const bucket = rest.substring(0, slashIdx);
        const path = rest.substring(slashIdx + 1);
        const storageBase = `${apiUrl}/storage/v1`;
        const res = await fetch(`${storageBase}/object/${bucket}/${path}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                apikey: apiKey,
            },
        });
        return res.ok;
    }
    catch {
        return false;
    }
}
exports.deleteFromSupabase = deleteFromSupabase;
