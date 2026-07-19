import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

/**
 * RABAIS-CLIENT (front) : rabais personnel du client CONNECTE.
 *
 * Appelle GET /clients/me/discount (garde requireUserAuth ; l'interceptor
 * api.js injecte le JWT Supabase). Le serveur ne renvoie QUE les rabais ACTIFS
 * (type + valeur>0 + non expires) - meme definition que celle appliquee au
 * checkout. Invite ou client sans rabais => `personal` reste null et rien ne
 * change dans le panier.
 *
 * Affichage seulement : le montant facture est toujours recalcule serveur.
 *
 * @returns {{ personal: {type,value,expiresAt,note}|null, loading: boolean }}
 */
export function usePersonalDiscount() {
  const { session } = useAuth();
  const [personal, setPersonal] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Pas de session => invite : aucun appel (eviterait un 401 inutile).
    if (!session) {
      setPersonal(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api.get('/clients/me/discount')
      .then((res) => {
        if (cancelled) return;
        const d = res?.data?.discount;
        setPersonal(d && d.type ? d : null);
      })
      .catch(() => {
        // Silencieux : un rabais absent ne doit jamais casser le panier.
        if (!cancelled) setPersonal(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [session]);

  return { personal, loading };
}
