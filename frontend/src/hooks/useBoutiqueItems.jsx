import { useState, useEffect } from 'react';
import api from '../services/api';

export function useBoutiqueItems() {
  const [boutiqueItems, setBoutiqueItems] = useState(null);
  const [packages, setPackages] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // CMS boutique DESACTIVE - les donnees locales sont la source de verite.
    // Quand le CMS sera nettoye et fiable, reactiver ici.
    setLoading(false);
  }, []);

  return { boutiqueItems, packages, loading };
}
