"use strict";

const MIME_MAP = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".pdf": "application/pdf",
};

function getMime(file) {
  if (file.mime && file.mime !== "application/octet-stream") return file.mime;
  return MIME_MAP[file.ext?.toLowerCase()] || file.mime || "application/octet-stream";
}

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

module.exports = {
  init({ apiUrl, apiKey, bucket, directory = "" }) {
    const storageBase = `${apiUrl}/storage/v1`;

    const getPath = (file) => {
      const key = `${file.hash}${file.ext}`;
      return directory ? `${directory}/${key}` : key;
    };

    const getPublicUrl = (path) =>
      `${storageBase}/object/public/${bucket}/${path}`;

    const uploadFile = async (file) => {
      const path = getPath(file);
      const contentType = getMime(file);

      let body;
      if (file.stream) {
        body = await streamToBuffer(file.stream);
      } else if (file.buffer) {
        body = Buffer.isBuffer(file.buffer) ? file.buffer : Buffer.from(file.buffer);
      } else if (typeof file.getStream === "function") {
        body = await streamToBuffer(file.getStream());
      } else {
        throw new Error("No file data available");
      }

      const res = await fetch(`${storageBase}/object/${bucket}/${path}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          apikey: apiKey,
          "Content-Type": contentType,
          "x-upsert": "true",
          "cache-control": "max-age=3600",
        },
        body,
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Supabase upload failed (${res.status}): ${err}`);
      }

      file.url = getPublicUrl(path);
    };

    const deleteFile = async (file) => {
      const path = getPath(file);

      const res = await fetch(`${storageBase}/object/${bucket}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          apikey: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prefixes: [path] }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Supabase delete failed (${res.status}): ${err}`);
      }
    };

    return {
      upload: uploadFile,
      uploadStream: uploadFile,
      delete: deleteFile,
      checkFileSize: async () => {},
    };
  },
};
