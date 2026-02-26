import { useState, useEffect, createContext, useContext } from 'react';
import api from '../services/api';

const ServicePagesContext = createContext(null);

export function ServicePagesProvider({ children }) {
  const [servicePages, setServicePages] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/service-pages', {
      params: {
        populate: {
          heroImage: true,
          gallery: true,
          webProjectImages: true,
          seo: true,
        },
        sort: 'sortOrder',
        filters: { active: true },
      }
    })
    .then(res => {
      setServicePages(res.data.data);
      setLoading(false);
    })
    .catch(() => {
      setLoading(false);
    });
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
