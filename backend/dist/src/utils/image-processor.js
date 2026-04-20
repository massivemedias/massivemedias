"use strict";
// UPLOAD-03 : traitement d'images artiste via Sharp en mode streaming disque.
//
// Ancien code : fetch -> arrayBuffer -> Buffer (RAM), puis 2x sharp(Buffer).toBuffer()
// qui tient ~3x la taille de l'image simultanement en heap. Sur un TIF de
// 40MB ca montait a ~120MB de heap pressure -> risque OOM sur Render Basic
// (2GB total shared avec Strapi).
//
// Nouveau code : response body stream -> fichier temp disque -> sharp(path)
// lit depuis disque (stream interne libsharp). Output direct vers un autre
// fichier temp, puis upload via stream HTTP. RAM = ~10MB fixe quel que soit
// la taille du fichier source.
//
// Pattern inspire de artist-edit-request.ts:593 (sharp(inputPath).toFile(tmp)
// + fs.createReadStream + uploadStream + cleanup in finally).
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFromSupabase = exports.processArtistImage = void 0;
const sharp_1 = __importDefault(require("sharp"));
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const stream_1 = require("stream");
const promises_1 = require("stream/promises");
const crypto_1 = require("crypto");
async function uploadFileToSupabase(filePath, storagePath, bucket) {
    const apiUrl = process.env.SUPABASE_API_URL;
    const apiKey = process.env.SUPABASE_API_KEY;
    if (!apiUrl || !apiKey)
        throw new Error('Supabase env vars not configured');
    const storageBase = `${apiUrl}/storage/v1`;
    const fileStream = fs.createReadStream(filePath);
    const stat = await fs.promises.stat(filePath);
    const res = await fetch(`${storageBase}/object/${bucket}/${storagePath}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            apikey: apiKey,
            'Content-Type': 'image/webp',
            'Content-Length': String(stat.size),
            'x-upsert': 'true',
            'cache-control': 'max-age=3600',
        },
        // undici supports ReadableStream as body - let l'upload streamer le fichier
        // sans jamais le charger entierement en RAM.
        body: fileStream,
        // @ts-ignore undici-specific flag
        duplex: 'half',
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Supabase upload failed (${res.status}): ${err}`);
    }
    return `${storageBase}/object/public/${bucket}/${storagePath}`;
}
async function processArtistImage(originalUrl, artistSlug, imageId) {
    const bucket = process.env.SUPABASE_BUCKET || 'strapi-media';
    const tmpDir = os.tmpdir();
    const uid = (0, crypto_1.randomUUID)();
    const inputPath = path.join(tmpDir, `mm-in-${uid}`);
    const fullPath = path.join(tmpDir, `mm-full-${uid}.webp`);
    const thumbPath = path.join(tmpDir, `mm-thumb-${uid}.webp`);
    try {
        // Etape 1 : streame le download vers un fichier temp (pas d'arrayBuffer).
        const response = await fetch(originalUrl);
        if (!response.ok || !response.body) {
            throw new Error(`Failed to download image: ${response.status}`);
        }
        await (0, promises_1.pipeline)(stream_1.Readable.fromWeb(response.body), fs.createWriteStream(inputPath));
        // Etape 2 : sharp lit le fichier depuis disque et ecrit directement
        // le WebP encode vers un autre fichier temp. Aucun buffer n'est
        // materialise en RAM a ce stade (stream interne libsharp).
        await (0, sharp_1.default)(inputPath)
            .resize({ width: 1600, withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(fullPath);
        await (0, sharp_1.default)(inputPath)
            .resize({ width: 800, withoutEnlargement: true })
            .webp({ quality: 75 })
            .toFile(thumbPath);
        // Etape 3 : upload stream -> Supabase.
        const fullStoragePath = `artist-images/${artistSlug}/full/${imageId}.webp`;
        const thumbStoragePath = `artist-images/${artistSlug}/thumbs/${imageId}.webp`;
        const fullUrl = await uploadFileToSupabase(fullPath, fullStoragePath, bucket);
        const thumbUrl = await uploadFileToSupabase(thumbPath, thumbStoragePath, bucket);
        return { fullUrl, thumbUrl };
    }
    finally {
        // Cleanup les 3 temp files (input + full + thumb). fs.rm avec force:true
        // = pas d'erreur si le fichier n'existe pas (ex: sharp a fail avant de
        // creer l'output).
        await Promise.all([
            fs.promises.rm(inputPath, { force: true }).catch(() => { }),
            fs.promises.rm(fullPath, { force: true }).catch(() => { }),
            fs.promises.rm(thumbPath, { force: true }).catch(() => { }),
        ]);
    }
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
