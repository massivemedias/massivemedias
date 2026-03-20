import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const SiteContentContext = createContext(null);

export function SiteContentProvider({ children }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSiteContent() {
      try {
        const { data } = await api.get('/site-content', {
          params: {
            'populate[0]': 'heroImages',
            'populate[1]': 'serviceCards',
            'populate[2]': 'serviceCards.image',
            'populate[3]': 'featuredProjects',
            'populate[4]': 'featuredProjects.image',
            'populate[5]': 'stats',
            'populate[6]': 'advantages',
            'populate[7]': 'testimonials',
            'populate[8]': 'ctaBackgroundImage',
            'populate[9]': 'homeSeo',
            'populate[10]': 'aboutSeo',
            'populate[11]': 'aboutHistoryImages',
            'populate[12]': 'aboutTimeline',
            'populate[13]': 'aboutTeam',
            'populate[14]': 'aboutTeam.photo',
            'populate[15]': 'aboutEquipment',
            'populate[16]': 'aboutEquipmentImages',
            'populate[17]': 'aboutSpaceImage',
            'populate[18]': 'aboutUniverse',
            'populate[19]': 'aboutUniverse.image',
            'populate[20]': 'contactSeo',
            'populate[21]': 'socialLinks',
          },
        });
        const raw = data.data || null;
        if (raw) {
          // Supprimer TOUS les champs about* du CMS - la page A propos
          // est entierement geree par les donnees locales (translations.js)
          // Le CMS a des donnees obsoletes qui ecrasent les corrections
          Object.keys(raw).forEach(key => {
            if (key.startsWith('about')) delete raw[key];
          });
          delete raw.contactEmail;
          // Testimonials geres localement (Jeremy G. toujours en premier)
          delete raw.testimonials;
        }
        setContent(raw);
      } catch (err) {
        console.warn('CMS site content unavailable:', err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchSiteContent();
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
