"use strict";
// Upload de fichiers originaux artistes vers Google Drive
// OAuth2 avec refresh token - upload en tant que mauditemachine@gmail.com
// Zero dependance externe - fetch natif + API Drive REST v3
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFromGoogleDrive = exports.uploadBufferToFolder = exports.uploadStreamToGoogleDrive = exports.uploadBufferToGoogleDrive = exports.uploadToGoogleDrive = void 0;
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
// Trouve ou cree un sous-dossier pour l'artiste
async function getOrCreateArtistFolder(token, parentFolderId, artistSlug) {
    const q = encodeURIComponent(`'${parentFolderId}' in parents and name='${artistSlug}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
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
            name: artistSlug,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentFolderId],
        }),
    });
    if (!createRes.ok)
        throw new Error(`Failed to create folder: ${await createRes.text()}`);
    const folder = await createRes.json();
    return folder.id;
}
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
// Utilise le meme resumable upload que uploadBufferToGoogleDrive mais piepe le stream directement
// sur la requete PUT - la memoire heap Node n'augmente pas proportionnellement a la taille du fichier.
async function uploadStreamToGoogleDrive(readStream, fileName, artistSlug, mimeType = 'application/octet-stream', contentLength) {
    const parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!parentFolderId)
        throw new Error('GOOGLE_DRIVE_FOLDER_ID env var not set');
    const token = await getAccessToken();
    const artistFolderId = await getOrCreateArtistFolder(token, parentFolderId, artistSlug);
    const date = new Date().toISOString().split('T')[0];
    const safeName = `${date}_${fileName}`;
    // Step 1: init resumable upload
    const initHeaders = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': mimeType,
    };
    if (contentLength && contentLength > 0) {
        initHeaders['X-Upload-Content-Length'] = contentLength.toString();
    }
    const initRes = await fetch(`${DRIVE_API}?uploadType=resumable`, {
        method: 'POST',
        headers: initHeaders,
        body: JSON.stringify({ name: safeName, parents: [artistFolderId] }),
    });
    if (!initRes.ok)
        throw new Error(`Drive resumable init failed: ${await initRes.text()}`);
    const uploadUrl = initRes.headers.get('location');
    if (!uploadUrl)
        throw new Error('No upload URL returned');
    // Step 2: PUT the stream. undici/fetch accepts ReadableStream as body.
    // We pass duplex: 'half' for streamed request bodies.
    const putHeaders = { 'Content-Type': mimeType };
    if (contentLength && contentLength > 0)
        putHeaders['Content-Length'] = contentLength.toString();
    const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: putHeaders,
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
