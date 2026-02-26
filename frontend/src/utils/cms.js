/**
 * Bilingual field helper — picks Fr or En value based on current language.
 * Usage: bl(content, 'heroSubtitle', lang)
 * → returns content.heroSubtitleFr or content.heroSubtitleEn
 */
export function bl(content, fieldBase, lang) {
  if (!content) return '';
  const key = `${fieldBase}${lang === 'en' ? 'En' : 'Fr'}`;
  return content[key] || content[`${fieldBase}Fr`] || '';
}

/**
 * Get Strapi media URL from a media field.
 * Returns the URL string or a fallback.
 */
export function mediaUrl(media, fallback = '') {
  if (!media) return fallback;
  const url = media.url || media.data?.attributes?.url;
  if (!url) return fallback;
  // If URL is relative, prepend the API base
  if (url.startsWith('/')) {
    const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:1337/api').replace('/api', '');
    return apiBase + url;
  }
  return url;
}
