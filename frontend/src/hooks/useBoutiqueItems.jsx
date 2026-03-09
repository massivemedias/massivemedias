import { useState, useEffect } from 'react';
import api from '../services/api';

export function useBoutiqueItems() {
  const [boutiqueItems, setBoutiqueItems] = useState(null);
  const [packages, setPackages] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBoutiqueData() {
      try {
        const [itemsRes, pkgRes] = await Promise.all([
          api.get('/boutique-items', {
            params: {
              'populate': 'image',
              'filters[active][$eq]': true,
              'sort': 'sortOrder:asc',
            },
          }),
          api.get('/service-packages', {
            params: {
              'filters[active][$eq]': true,
              'sort': 'sortOrder:asc',
            },
          }),
        ]);
        setBoutiqueItems(itemsRes.data.data || []);
        setPackages(pkgRes.data.data || []);
      } catch (err) {
        console.warn('CMS boutique items unavailable:', err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchBoutiqueData();
  }, []);

  return { boutiqueItems, packages, loading };
}
