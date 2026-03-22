import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const TatoueursContext = createContext(null);

export function TatoueursProvider({ children }) {
  const [tatoueurs, setTatoueurs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchTatoueurs() {
      try {
        const res = await api.get('/tatoueurs', {
          params: {
            populate: '*',
            'filters[active][$eq]': true,
            'filters[approved][$eq]': true,
            'sort[0]': 'sortOrder:asc',
            'pagination[pageSize]': 100,
          },
        });
        if (!cancelled) {
          setTatoueurs(res.data?.data || []);
        }
      } catch (err) {
        console.warn('[useTatoueurs] CMS indisponible, fallback local:', err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchTatoueurs();
    return () => { cancelled = true; };
  }, []);

  return (
    <TatoueursContext.Provider value={{ tatoueurs, loading }}>
      {children}
    </TatoueursContext.Provider>
  );
}

export function useTatoueurs() {
  return useContext(TatoueursContext) || { tatoueurs: null, loading: false };
}
