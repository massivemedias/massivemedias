// Upload de fichiers originaux artistes vers Google Drive
// Zero dependance externe - utilise crypto natif Node + fetch
// Service Account JWT auth + API Drive REST v3

import crypto from 'crypto';

interface DriveUploadResult {
  fileId: string;
  fileName: string;
  webViewLink: string;
  webContentLink: string;
}

const DRIVE_API = 'https://www.googleapis.com/upload/drive/v3/files';
const DRIVE_API_META = 'https://www.googleapis.com/drive/v3/files';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

function base64url(data: string | Buffer): string {
  const b64 = Buffer.isBuffer(data) ? data.toString('base64') : Buffer.from(data).toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Genere un JWT signe avec la cle privee du service account
function createSignedJWT(email: string, privateKey: string, scope: string): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: email,
    scope,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };

  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(payload));
  const signInput = `${headerB64}.${payloadB64}`;

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signInput);
  const signature = sign.sign(privateKey, 'base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return `${signInput}.${signature}`;
}

// Cache du token (valide 1h)
let cachedToken: { token: string; expiry: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiry) {
    return cachedToken.token;
  }

  const credentials = process.env.GOOGLE_DRIVE_CREDENTIALS;
  if (!credentials) throw new Error('GOOGLE_DRIVE_CREDENTIALS env var not set');

  const creds = JSON.parse(credentials);
  const jwt = createSignedJWT(
    creds.client_email,
    creds.private_key,
    'https://www.googleapis.com/auth/drive.file'
  );

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${err}`);
  }

  const data = await res.json();
  cachedToken = { token: data.access_token, expiry: Date.now() + 3500 * 1000 };
  return data.access_token;
}

// Trouve ou cree un sous-dossier pour l'artiste
async function getOrCreateArtistFolder(token: string, parentFolderId: string, artistSlug: string): Promise<string> {
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

  if (!createRes.ok) throw new Error(`Failed to create folder: ${await createRes.text()}`);
  const folder = await createRes.json();
  return folder.id;
}

// Upload un fichier original vers Google Drive
export async function uploadToGoogleDrive(
  fileUrl: string,
  fileName: string,
  artistSlug: string,
  mimeType?: string
): Promise<DriveUploadResult> {
  const parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!parentFolderId) throw new Error('GOOGLE_DRIVE_FOLDER_ID env var not set');

  const token = await getAccessToken();
  const artistFolderId = await getOrCreateArtistFolder(token, parentFolderId, artistSlug);

  // Telecharger le fichier
  const response = await fetch(fileUrl);
  if (!response.ok) throw new Error(`Failed to download: ${response.status}`);
  const fileBuffer = Buffer.from(await response.arrayBuffer());
  const contentType = mimeType || response.headers.get('content-type') || 'application/octet-stream';

  const date = new Date().toISOString().split('T')[0];
  const safeName = `${date}_${fileName}`;
  const metadata = JSON.stringify({ name: safeName, parents: [artistFolderId] });

  // Multipart upload
  const boundary = '===massive_boundary===';
  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${contentType}\r\n\r\n`
    ),
    fileBuffer,
    Buffer.from(`\r\n--${boundary}--`),
  ]);

  const uploadRes = await fetch(
    `${DRIVE_API}?uploadType=multipart&fields=id,name,webViewLink,webContentLink`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  if (!uploadRes.ok) throw new Error(`Drive upload failed: ${await uploadRes.text()}`);
  const file = await uploadRes.json();

  return {
    fileId: file.id,
    fileName: file.name,
    webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
    webContentLink: file.webContentLink || '',
  };
}

export async function deleteFromGoogleDrive(fileId: string): Promise<boolean> {
  try {
    const token = await getAccessToken();
    const res = await fetch(`${DRIVE_API_META}/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}
