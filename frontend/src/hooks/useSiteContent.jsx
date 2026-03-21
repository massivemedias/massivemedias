import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const SiteContentContext = createContext(null);

export function SiteContentProvider({ children }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // CMS site content DESACTIVE - les donnees locales (translations.js) sont la source de verite.
    // Le CMS overridait les textes, dates (2013), adresses, emails, descriptions avec des donnees obsoletes.
    // Les seuls hooks CMS qui restent actifs sont ceux du panneau admin (commandes, contacts, etc.)
    // Quand le CMS sera nettoye et fiable, reactiver ici.
    setLoading(false);
  }, []);

  return (
    <SiteContentContext.Provider value={{ content, loading }}>
      {children}
    </SiteContentContext.Provider>
  );
}

export function useSiteContent() {
  return useContext(SiteContentContext) || { content: null, loading: false };
}
