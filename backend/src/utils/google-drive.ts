// Upload de fichiers originaux artistes vers Google Drive
// OAuth2 avec refresh token - upload en tant que mauditemachine@gmail.com
// Zero dependance externe - fetch natif + API Drive REST v3

interface DriveUploadResult {
  fileId: string;
  fileName: string;
  webViewLink: string;
  webContentLink: string;
}

const DRIVE_API = 'https://www.googleapis.com/upload/drive/v3/files';
const DRIVE_API_META = 'https://www.googleapis.com/drive/v3/files';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

// Cache du token (valide ~1h)
let cachedToken: { token: string; expiry: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiry) {
    return cachedToken.token;
  }

  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Google Drive OAuth2 env vars not set (CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN)');
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

  // Telecharger le fichier depuis Supabase
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
