import { useState, useEffect } from 'react';
import api from '../services/api';
import { bl, mediaUrl } from '../utils/cms';

export function useBoutiqueItems(lang) {
  const [boutiqueItems, setBoutiqueItems] = useState(null);
  const [packages, setPackages] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      api.get('/boutique-items', {
        params: {
          populate: ['image'],
          sort: 'sortOrder',
          filters: { active: true },
        },
      }).catch(() => null),
      api.get('/service-packages', {
        params: {
          sort: 'sortOrder',
          filters: { active: true },
        },
      }).catch(() => null),
    ]).then(([itemsRes, packagesRes]) => {
      if (cancelled) return;

      if (itemsRes?.data?.data) {
        const items = itemsRes.data.data.map((item) => ({
          slug: item.slug,
          title: bl(item, 'title', lang),
          subtitle: bl(item, 'subtitle', lang),
          serviceKey: item.serviceKey,
          startingPrice: item.startingPrice,
          image: mediaUrl(item.image, null),
          hasCart: item.hasCart !== false,
        }));
        setBoutiqueItems(items);
      }

      if (packagesRes?.data?.data) {
        const pkgs = packagesRes.data.data.map((pkg) => ({
          name: bl(pkg, 'name', lang),
          description: bl(pkg, 'description', lang),
          items: Array.isArray(pkg.items)
            ? pkg.items.map((i) => (lang === 'en' ? i.labelEn : i.labelFr) || i.labelFr)
            : [],
          price: bl(pkg, 'price', lang),
          popular: pkg.popular || false,
          ctaType: pkg.ctaType || 'price',
        }));
        setPackages(pkgs);
      }

      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [lang]);

  return { boutiqueItems, packages, loading };
}
