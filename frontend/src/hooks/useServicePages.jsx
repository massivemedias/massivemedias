import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const ServicePagesContext = createContext(null);

export function ServicePagesProvider({ children }) {
  const [servicePages, setServicePages] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchServicePages() {
      try {
        const { data } = await api.get('/service-pages', {
          params: {
            'populate[0]': 'heroImage',
            'populate[1]': 'gallery',
            'populate[2]': 'seo',
            'populate[3]': 'webProjectImages',
            'filters[active][$eq]': true,
            'sort': 'sortOrder:asc',
            'pagination[pageSize]': 50,
          },
        });
        setServicePages(data.data || []);
      } catch (err) {
        console.warn('CMS service pages unavailable:', err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchServicePages();
  }, []);

  return (
    <ServicePagesContext.Provider value={{ servicePages, loading }}>
      {children}
    </ServicePagesContext.Provider>
  );
}

export function useServicePages() {
  return useContext(ServicePagesContext);
}
