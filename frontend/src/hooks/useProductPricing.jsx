import { useState, useEffect } from 'react';
import api from '../services/api';

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
        const { data } = await api.get('/products', {
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
