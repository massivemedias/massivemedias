const LANG_SUFFIX = { fr: 'Fr', en: 'En', es: 'Es' };

/**
 * Multilingual field helper - picks Fr, En or Es value based on current language.
 * Usage: bl(content, 'heroSubtitle', lang)
 * Fallback chain: es -> en -> fr
 */
export function bl(content, fieldBase, lang) {
  if (!content) return '';
  const primary = content[`${fieldBase}${LANG_SUFFIX[lang] || 'Fr'}`];
  if (primary) return primary;
  if (lang === 'es') {
    const en = content[`${fieldBase}En`];
    if (en) return en;
  }
  return content[`${fieldBase}Fr`] || '';
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
