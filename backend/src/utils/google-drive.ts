// Upload de fichiers originaux artistes vers Google Drive
// Service Account: massive-drive-upload@massive-489719.iam.gserviceaccount.com
// Dossier cible: Massive > Projets > Originaux Artistes

import { google } from 'googleapis';
import { Readable } from 'stream';

interface DriveUploadResult {
  fileId: string;
  fileName: string;
  webViewLink: string;
  webContentLink: string;
}

function getAuth() {
  const credentials = process.env.GOOGLE_DRIVE_CREDENTIALS;
  if (!credentials) throw new Error('GOOGLE_DRIVE_CREDENTIALS env var not set');

  const parsed = JSON.parse(credentials);
  return new google.auth.GoogleAuth({
    credentials: parsed,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });
}

// Trouve ou cree un sous-dossier pour l'artiste dans le dossier parent
async function getOrCreateArtistFolder(drive: any, parentFolderId: string, artistSlug: string): Promise<string> {
  // Chercher si le dossier existe deja
  const search = await drive.files.list({
    q: `'${parentFolderId}' in parents and name = '${artistSlug}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  if (search.data.files && search.data.files.length > 0) {
    return search.data.files[0].id;
  }

  // Creer le dossier
  const folder = await drive.files.create({
    requestBody: {
      name: artistSlug,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    },
    fields: 'id',
  });

  return folder.data.id;
}

// Upload un fichier original vers Google Drive
// Structure: Originaux Artistes/{artistSlug}/{date}_{filename}
export async function uploadToGoogleDrive(
  fileUrl: string,
  fileName: string,
  artistSlug: string,
  mimeType?: string
): Promise<DriveUploadResult> {
  const parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!parentFolderId) throw new Error('GOOGLE_DRIVE_FOLDER_ID env var not set');

  const auth = getAuth();
  const drive = google.drive({ version: 'v3', auth });

  // Trouver ou creer le dossier de l'artiste
  const artistFolderId = await getOrCreateArtistFolder(drive, parentFolderId, artistSlug);

  // Telecharger le fichier depuis Supabase
  const response = await fetch(fileUrl);
  if (!response.ok) throw new Error(`Failed to download file: ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Nom du fichier avec date
  const date = new Date().toISOString().split('T')[0]; // 2026-03-18
  const safeName = `${date}_${fileName}`;

  // Upload vers Google Drive
  const file = await drive.files.create({
    requestBody: {
      name: safeName,
      parents: [artistFolderId],
    },
    media: {
      mimeType: mimeType || 'application/octet-stream',
      body: Readable.from(buffer),
    },
    fields: 'id, name, webViewLink, webContentLink',
  });

  return {
    fileId: file.data.id,
    fileName: file.data.name,
    webViewLink: file.data.webViewLink || '',
    webContentLink: file.data.webContentLink || '',
  };
}

// Supprime un fichier de Google Drive par son ID
export async function deleteFromGoogleDrive(fileId: string): Promise<boolean> {
  try {
    const auth = getAuth();
    const drive = google.drive({ version: 'v3', auth });
    await drive.files.delete({ fileId });
    return true;
  } catch {
    return false;
  }
}
