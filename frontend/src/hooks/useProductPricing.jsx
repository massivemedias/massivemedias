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

    let cancelled = false;

    api.get('/products', {
      params: {
        filters: { slug, active: true },
        fields: ['pricingData', 'nameFr', 'nameEn'],
      },
    })
      .then((res) => {
        if (cancelled) return;
        const products = res.data?.data;
        if (Array.isArray(products) && products.length > 0) {
          setPricingData(products[0].pricingData);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [slug]);

  return { pricingData, loading };
}
