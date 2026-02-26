import { useState, useEffect, createContext, useContext } from 'react';
import api from '../services/api';

const SiteContentContext = createContext(null);

export function SiteContentProvider({ children }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/site-content', {
      params: {
        populate: {
          homeSeo: true,
          serviceCards: { populate: ['image'] },
          featuredProjects: { populate: ['image'] },
          stats: true,
          advantages: true,
          testimonials: true,
          ctaBackgroundImage: true,
          heroImages: true,
          aboutSeo: true,
          aboutHistoryImages: true,
          aboutTimeline: true,
          aboutTeam: { populate: ['photo'] },
          aboutEquipmentImages: true,
          aboutEquipment: true,
          aboutSpaceImage: true,
          aboutUniverse: { populate: ['image'] },
          contactSeo: true,
          socialLinks: true,
        }
      }
    })
    .then(res => {
      // Strapi v5 flat format: res.data.data = { id, documentId, field1, ... }
      // Strapi v4 format: res.data.data = { id, attributes: { field1, ... } }
      const raw = res.data?.data;
      const data = raw?.attributes || raw;
      if (data && typeof data === 'object') {
        setContent(data);
      }
      setLoading(false);
    })
    .catch((err) => {
      console.warn('[SiteContent] API unavailable, using fallbacks', err?.response?.status || err.message);
      setLoading(false);
    });
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
