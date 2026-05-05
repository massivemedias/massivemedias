/**
 * Routes Ads Generator (3 mai 2026).
 * Genere du materiel publicitaire (titre / corps / CTA) pour un produit Massive
 * via Gemini text generation. Utilise dans l'onglet "Ads" du panel ai.massive.
 */
export default {
  routes: [
    {
      // POST /api/ads-generator/generate
      // Body : { productName, productType, artistName?, description?, language? }
      // Response : { variants: [{ headline, body, cta }, ...] }
      method: 'POST',
      path: '/ads-generator/generate',
      handler: 'ads-generator.generate',
      config: { auth: false },
    },
  ],
};
