import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const ServicePagesContext = createContext(null);

export function ServicePagesProvider({ children }) {
  const [servicePages, setServicePages] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // CMS services DESACTIVE - les donnees locales (services.js) sont la source de verite.
    // Quand le CMS sera nettoye et fiable, reactiver ici.
    setLoading(false);
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
