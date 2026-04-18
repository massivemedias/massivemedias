"use strict";
// Upload de fichiers originaux artistes vers Google Drive
// OAuth2 avec refresh token - upload en tant que mauditemachine@gmail.com
// Zero dependance externe - fetch natif + API Drive REST v3
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFromGoogleDrive = exports.uploadBufferToFolder = exports.uploadStreamToGoogleDrive = exports.uploadBufferToGoogleDrive = exports.uploadToGoogleDrive = exports.normalizeDriveFolderName = exports.getOrCreateFolder = void 0;
const DRIVE_API = 'https://www.googleapis.com/upload/drive/v3/files';
const DRIVE_API_META = 'https://www.googleapis.com/drive/v3/files';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
// Cache du token (valide ~1h)
let cachedToken = null;
async function getAccessToken() {
    if (cachedToken && Date.now() < cachedToken.expiry) {
        return cachedToken.token;
    }
    const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
    if (!clientId || !clientSecret || !refreshToken) {
        const hasClientId = !!clientId;
        const hasSecret = !!clientSecret;
        const hasRefresh = !!refreshToken;
        throw new Error(`Google Drive OAuth2 env vars not set - CLIENT_ID:${hasClientId} SECRET:${hasSecret} REFRESH:${hasRefresh}`);
    }
    const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `client_id=${clientId}&client_secret=${clientSecret}&refresh_token=${refreshToken}&grant_type=refresh_token`,
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Token refresh failed: ${err}`);
    }
    const data = await res.json();
    cachedToken = { token: data.access_token, expiry: Date.now() + 3500 * 1000 };
    return data.access_token;
}
/**
 * Echappe un nom de dossier pour l'utilisation dans une Google Drive `q` query.
 * Drive API exige que les apostrophes soient doublees dans les valeurs quotees.
 * Le reste des caracteres est autorise dans les noms Drive, mais on prend la
 * precaution de trim pour eviter des fantomes avec espaces en debut/fin.
 */
function escapeForDriveQuery(name) {
    return String(name).trim().replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}
/**
 * Trouve ou cree un sous-dossier dans parentFolderId avec le nom donne.
 * Idempotent: si le dossier existe deja (meme nom, meme parent, non-trashed),
 * retourne son id sans dupliquer.
 *
 * Cette fonction etait precedemment privee sous le nom getOrCreateArtistFolder.
 * Elle est maintenant exportee pour permettre aux callers (upload controller)
 * de construire leurs propres regles de nomenclature de dossiers.
 */
async function getOrCreateFolder(token, parentFolderId, folderName) {
    const escapedName = escapeForDriveQuery(folderName);
    const q = encodeURIComponent(`'${parentFolderId}' in parents and name='${escapedName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
    const searchRes = await fetch(`${DRIVE_API_META}?q=${q}&fields=files(id,name)`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (searchRes.ok) {
        const data = await searchRes.json();
        if (data.files && data.files.length > 0) {
            return data.files[0].id;
        }
    }
    const createRes = await fetch(DRIVE_API_META, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: String(folderName).trim(),
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentFolderId],
        }),
    });
    if (!createRes.ok)
        throw new Error(`Failed to create folder '${folderName}': ${await createRes.text()}`);
    const folder = await createRes.json();
    return folder.id;
}
exports.getOrCreateFolder = getOrCreateFolder;
/**
 * Alias retro-compatible - les callers existants passent 'artistSlug' mais la
 * fonction fait exactement le meme travail quel que soit le nom.
 */
async function getOrCreateArtistFolder(token, parentFolderId, artistSlug) {
    return getOrCreateFolder(token, parentFolderId, artistSlug);
}
/**
 * Helper public: normalise un nom de dossier pour Google Drive.
 * - Trim
 * - Remplace les caracteres de controle
 * - Garde les accents et les espaces (Drive les supporte)
 * - Tronque a 150 chars pour ne pas exploser les limites Drive
 */
function normalizeDriveFolderName(raw) {
    return String(raw || '')
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0000-\u001F\u007F]/g, '')
        .trim()
        .slice(0, 150);
}
exports.normalizeDriveFolderName = normalizeDriveFolderName;
// Upload un fichier original vers Google Drive
async function uploadToGoogleDrive(fileUrl, fileName, artistSlug, mimeType) {
    const parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!parentFolderId)
        throw new Error('GOOGLE_DRIVE_FOLDER_ID env var not set');
    const token = await getAccessToken();
    const artistFolderId = await getOrCreateArtistFolder(token, parentFolderId, artistSlug);
    // Telecharger le fichier depuis Supabase
    const response = await fetch(fileUrl);
    if (!response.ok)
        throw new Error(`Failed to download: ${response.status}`);
    const fileBuffer = Buffer.from(await response.arrayBuffer());
    const contentType = mimeType || response.headers.get('content-type') || 'application/octet-stream';
    const date = new Date().toISOString().split('T')[0];
    const safeName = `${date}_${fileName}`;
    const metadata = JSON.stringify({ name: safeName, parents: [artistFolderId] });
    // Multipart upload
    const boundary = '===massive_boundary===';
    const body = Buffer.concat([
        Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${contentType}\r\n\r\n`),
        fileBuffer,
        Buffer.from(`\r\n--${boundary}--`),
    ]);
    const uploadRes = await fetch(`${DRIVE_API}?uploadType=multipart&fields=id,name,webViewLink,webContentLink`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body,
    });
    if (!uploadRes.ok)
        throw new Error(`Drive upload failed: ${await uploadRes.text()}`);
    const file = await uploadRes.json();
    return {
        fileId: file.id,
        fileName: file.name,
        webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
        webContentLink: file.webContentLink || '',
    };
}
exports.uploadToGoogleDrive = uploadToGoogleDrive;
// Upload un fichier directement depuis un Buffer (pour les uploads directs du frontend)
async function uploadBufferToGoogleDrive(fileBuffer, fileName, artistSlug, mimeType = 'application/octet-stream') {
    const parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!parentFolderId)
        throw new Error('GOOGLE_DRIVE_FOLDER_ID env var not set');
    const token = await getAccessToken();
    const artistFolderId = await getOrCreateArtistFolder(token, parentFolderId, artistSlug);
    const date = new Date().toISOString().split('T')[0];
    const safeName = `${date}_${fileName}`;
    // Use resumable upload for large files
    // Step 1: Initiate resumable upload
    const initRes = await fetch(`${DRIVE_API}?uploadType=resumable`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Upload-Content-Type': mimeType,
            'X-Upload-Content-Length': fileBuffer.length.toString(),
        },
        body: JSON.stringify({ name: safeName, parents: [artistFolderId] }),
    });
    if (!initRes.ok)
        throw new Error(`Drive resumable init failed: ${await initRes.text()}`);
    const uploadUrl = initRes.headers.get('location');
    if (!uploadUrl)
        throw new Error('No upload URL returned');
    // Step 2: Upload the file content
    const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': mimeType,
            'Content-Length': fileBuffer.length.toString(),
        },
        body: fileBuffer,
    });
    if (!uploadRes.ok)
        throw new Error(`Drive upload failed: ${await uploadRes.text()}`);
    const file = await uploadRes.json();
    return {
        fileId: file.id,
        fileName: file.name || safeName,
        webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
        webContentLink: file.webContentLink || '',
    };
}
exports.uploadBufferToGoogleDrive = uploadBufferToGoogleDrive;
// Upload un fichier en streaming depuis un Readable (pour eviter de charger le buffer en RAM).
// Utilise le resumable upload de Google Drive avec transmission du Content-Length - exige
// par l'API pour les gros fichiers et evite que undici/fetch ne bufferise le stream en RAM
// pour calculer la taille lui-meme (ce qui ruinerait le benefice du streaming).
//
// contentLength est OBLIGATOIRE dans la pratique pour les fichiers > quelques MB. On throw
// explicitement si absent pour ne pas risquer un upload qui finit par bufferiser tout le
// fichier en RAM en silence.
async function uploadStreamToGoogleDrive(readStream, fileName, artistSlug, mimeType = 'application/octet-stream', contentLength) {
    const parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!parentFolderId)
        throw new Error('GOOGLE_DRIVE_FOLDER_ID env var not set');
    if (!contentLength || contentLength <= 0) {
        throw new Error('uploadStreamToGoogleDrive: contentLength is required (pass the file size in bytes)');
    }
    const token = await getAccessToken();
    const artistFolderId = await getOrCreateArtistFolder(token, parentFolderId, artistSlug);
    const date = new Date().toISOString().split('T')[0];
    const safeName = `${date}_${fileName}`;
    // Step 1: init resumable upload - pre-declare size and mime type so Drive allocates correctly.
    const initRes = await fetch(`${DRIVE_API}?uploadType=resumable`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json; charset=UTF-8',
            'X-Upload-Content-Type': mimeType,
            'X-Upload-Content-Length': String(contentLength),
        },
        body: JSON.stringify({ name: safeName, parents: [artistFolderId] }),
    });
    if (!initRes.ok)
        throw new Error(`Drive resumable init failed: ${await initRes.text()}`);
    const uploadUrl = initRes.headers.get('location');
    if (!uploadUrl)
        throw new Error('No upload URL returned');
    // Step 2: PUT the stream with an explicit Content-Length. undici/fetch accepts a
    // Node Readable as body when duplex: 'half' is set. If we omit Content-Length here,
    // undici is forced to collect the stream into a buffer to compute length - that's
    // exactly the OOM behaviour we're trying to avoid.
    const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': mimeType,
            'Content-Length': String(contentLength),
        },
        body: readStream,
        duplex: 'half',
    });
    if (!uploadRes.ok)
        throw new Error(`Drive upload (stream) failed: ${await uploadRes.text()}`);
    const file = await uploadRes.json();
    return {
        fileId: file.id,
        fileName: file.name || safeName,
        webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
        webContentLink: file.webContentLink || '',
    };
}
exports.uploadStreamToGoogleDrive = uploadStreamToGoogleDrive;
// Upload un fichier directement dans un dossier Google Drive specifique (sans sous-dossier artiste)
async function uploadBufferToFolder(fileBuffer, fileName, folderId, mimeType = 'application/octet-stream') {
    const token = await getAccessToken();
    const date = new Date().toISOString().split('T')[0];
    const safeName = `${date}_${fileName}`;
    const metadata = JSON.stringify({ name: safeName, parents: [folderId] });
    const boundary = '===massive_boundary===';
    const body = Buffer.concat([
        Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`),
        fileBuffer,
        Buffer.from(`\r\n--${boundary}--`),
    ]);
    const uploadRes = await fetch(`${DRIVE_API}?uploadType=multipart&fields=id,name,webViewLink,webContentLink`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body,
    });
    if (!uploadRes.ok)
        throw new Error(`Drive upload failed: ${await uploadRes.text()}`);
    const file = await uploadRes.json();
    return {
        fileId: file.id,
        fileName: file.name || safeName,
        webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
        webContentLink: file.webContentLink || '',
    };
}
exports.uploadBufferToFolder = uploadBufferToFolder;
async function deleteFromGoogleDrive(fileId) {
    try {
        const token = await getAccessToken();
        const res = await fetch(`${DRIVE_API_META}/${fileId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.ok;
    }
    catch {
        return false;
    }
}
exports.deleteFromGoogleDrive = deleteFromGoogleDrive;
