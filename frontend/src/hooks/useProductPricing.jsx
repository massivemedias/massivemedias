import { useState, useEffect } from 'react';
// FIX-PUBLIC-401 (8 mai 2026) : apiPublic (sans Bearer) pour les endpoints CRUD
// publics. /products est public mais Strapi v5 rejette le Bearer Supabase JWT
// non-natif en 401, ce qui fait fallback silencieux sur null pour les admins.
import { apiPublic } from '../services/api';

export function useProductPricing(slug) {
  const [pricingData, setPricingData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    async function fetchPricing() {
      try {
        const { data } = await apiPublic.get('/products', {
          params: {
            'filters[slug][$eq]': slug,
            'fields[0]': 'pricingData',
            'fields[1]': 'slug',
          },
        });
        const product = data.data?.[0];
        setPricingData(product?.pricingData || null);
      } catch (err) {
        console.warn(`CMS pricing for ${slug} unavailable:`, err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchPricing();
  }, [slug]);

  return { pricingData, loading };
}
