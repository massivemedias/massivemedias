// Upload de fichiers originaux artistes vers Google Drive
// Utilise google-auth-library (leger) + fetch direct sur l'API Drive REST v3
// Service Account: massive-drive-upload@massive-489719.iam.gserviceaccount.com

import { GoogleAuth } from 'google-auth-library';

interface DriveUploadResult {
  fileId: string;
  fileName: string;
  webViewLink: string;
  webContentLink: string;
}

const DRIVE_API = 'https://www.googleapis.com/upload/drive/v3/files';
const DRIVE_API_META = 'https://www.googleapis.com/drive/v3/files';

async function getAccessToken(): Promise<string> {
  const credentials = process.env.GOOGLE_DRIVE_CREDENTIALS;
  if (!credentials) throw new Error('GOOGLE_DRIVE_CREDENTIALS env var not set');

  const parsed = JSON.parse(credentials);
  const auth = new GoogleAuth({
    credentials: parsed,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });

  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token.token) throw new Error('Failed to get access token');
  return token.token;
}

// Trouve ou cree un sous-dossier pour l'artiste
async function getOrCreateArtistFolder(token: string, parentFolderId: string, artistSlug: string): Promise<string> {
  // Chercher si le dossier existe
  const searchUrl = `${DRIVE_API_META}?q='${parentFolderId}'+in+parents+and+name='${artistSlug}'+and+mimeType='application/vnd.google-apps.folder'+and+trashed=false&fields=files(id,name)`;
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (searchRes.ok) {
    const data = await searchRes.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
  }

  // Creer le dossier
  const createRes = await fetch(`${DRIVE_API_META}`, {
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

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Failed to create folder: ${err}`);
  }

  const folder = await createRes.json();
  return folder.id;
}

// Upload un fichier original vers Google Drive via multipart upload
export async function uploadToGoogleDrive(
  fileUrl: string,
  fileName: string,
  artistSlug: string,
  mimeType?: string
): Promise<DriveUploadResult> {
  const parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!parentFolderId) throw new Error('GOOGLE_DRIVE_FOLDER_ID env var not set');

  const token = await getAccessToken();

  // Trouver ou creer le dossier de l'artiste
  const artistFolderId = await getOrCreateArtistFolder(token, parentFolderId, artistSlug);

  // Telecharger le fichier depuis Supabase
  const response = await fetch(fileUrl);
  if (!response.ok) throw new Error(`Failed to download file: ${response.status}`);
  const fileBuffer = Buffer.from(await response.arrayBuffer());
  const contentType = mimeType || response.headers.get('content-type') || 'application/octet-stream';

  // Nom du fichier avec date
  const date = new Date().toISOString().split('T')[0];
  const safeName = `${date}_${fileName}`;

  // Metadata JSON
  const metadata = JSON.stringify({
    name: safeName,
    parents: [artistFolderId],
  });

  // Multipart upload (metadata + file content)
  const boundary = '===massive_upload_boundary===';
  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      metadata + `\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: ${contentType}\r\n\r\n`
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
        'Content-Length': String(body.length),
      },
      body,
    }
  );

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`Drive upload failed (${uploadRes.status}): ${err}`);
  }

  const file = await uploadRes.json();
  return {
    fileId: file.id,
    fileName: file.name,
    webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
    webContentLink: file.webContentLink || '',
  };
}

// Supprime un fichier de Google Drive par son ID
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
