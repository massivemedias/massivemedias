import api from './api';

/**
 * IG-FEED : lit NOTRE cache de posts Instagram (backend Strapi), jamais Meta.
 * Zero cookie tiers, zero appel a instagram.com cote client. Les images sont
 * deja proxifiees sur notre stockage par le backend.
 *
 * Retourne toujours un tableau (jamais throw) : en cas d'erreur reseau ou de
 * backend down, on renvoie [] et l'appelant retombe sur son fallback local
 * -> la section n'est JAMAIS vide.
 */
export async function getInstagramPosts(limit = 4) {
  try {
    const { data } = await api.get('/instagram-posts/latest', { params: { limit } });
    const posts = Array.isArray(data?.data) ? data.data : [];
    // On ne garde que les posts avec une image proxifiee exploitable.
    return posts.filter((p) => p && p.thumbUrl);
  } catch {
    return [];
  }
}
