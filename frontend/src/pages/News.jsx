import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Calendar, Tag } from 'lucide-react';
import SEO from '../components/SEO';
import { useLang } from '../i18n/LanguageContext';
import api from '../services/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:1337/api';

function News() {
  const { t, lang } = useLang();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState(null);

  useEffect(() => {
    async function fetchArticles() {
      try {
        const { data } = await api.get('/news-articles', {
          params: {
            'sort': 'createdAt:desc',
            'populate': 'coverImage',
          },
        });
        setArticles(data.data || []);
      } catch (err) {
        console.error('Failed to fetch news:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchArticles();
  }, []);

  const categoryLabels = {
    announcement: lang === 'fr' ? 'Annonce' : 'Announcement',
    blog: 'Blog',
    promo: 'Promo',
    update: lang === 'fr' ? 'Mise à jour' : 'Update',
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getImageUrl = (article) => {
    const img = article.coverImage;
    if (!img) return null;
    const url = img.formats?.medium?.url || img.formats?.small?.url || img.url;
    if (url?.startsWith('http')) return url;
    const base = API_URL.replace('/api', '');
    return `${base}${url}`;
  };

  if (selectedArticle) {
    return (
      <>
        <SEO
          title={lang === 'fr' ? selectedArticle.titleFr : selectedArticle.titleEn}
          description={lang === 'fr' ? (selectedArticle.excerptFr || '') : (selectedArticle.excerptEn || '')}
        />
        <section className="section-container pt-32 max-w-4xl mx-auto">
          <button
            onClick={() => setSelectedArticle(null)}
            className="text-accent hover:underline mb-8 inline-block"
          >
            &larr; {lang === 'fr' ? 'Retour aux nouvelles' : 'Back to news'}
          </button>

          {getImageUrl(selectedArticle) && (
            <img
              src={getImageUrl(selectedArticle)}
              alt={lang === 'fr' ? selectedArticle.titleFr : selectedArticle.titleEn}
              className="w-full h-64 md:h-96 object-cover rounded-2xl mb-8"
              loading="lazy"
            />
          )}

          <div className="flex items-center gap-4 mb-4 text-sm text-grey-muted">
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {formatDate(selectedArticle.createdAt)}
            </span>
            {selectedArticle.category && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-semibold">
                <Tag size={12} />
                {categoryLabels[selectedArticle.category] || selectedArticle.category}
              </span>
            )}
          </div>

          <h1 className="text-4xl md:text-5xl font-heading font-bold text-heading mb-8">
            {lang === 'fr' ? selectedArticle.titleFr : selectedArticle.titleEn}
          </h1>

          <div
            className="prose prose-lg text-body max-w-none"
            dangerouslySetInnerHTML={{
              __html: lang === 'fr' ? selectedArticle.contentFr : selectedArticle.contentEn,
            }}
          />
        </section>
      </>
    );
  }

  return (
    <>
      <SEO
        title={lang === 'fr' ? 'Nouvelles - Massive Medias' : 'News - Massive Medias'}
        description={lang === 'fr' ? 'Dernières nouvelles, annonces et promotions de Massive Medias.' : 'Latest news, announcements and promotions from Massive Medias.'}
        breadcrumbs={[
          { name: lang === 'fr' ? 'Accueil' : 'Home', url: '/' },
          { name: lang === 'fr' ? 'Nouvelles' : 'News' },
        ]}
      />

      <section className="section-container pt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-heading font-bold text-heading mb-6">
            {lang === 'fr' ? 'Nouvelles' : 'News'}
          </h1>
          <p className="text-xl text-grey-light">
            {lang === 'fr'
              ? 'Annonces, promotions et mises à jour du studio.'
              : 'Announcements, promotions and studio updates.'}
          </p>
        </motion.div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto" />
          </div>
        ) : articles.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-grey-muted text-lg">
              {lang === 'fr' ? 'Aucune nouvelle pour le moment. Revenez bientôt!' : 'No news yet. Check back soon!'}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {articles.map((article, index) => (
              <motion.article
                key={article.documentId || article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onClick={() => setSelectedArticle(article)}
                className="cursor-pointer group rounded-2xl overflow-hidden transition-all duration-300 bg-glass hover:shadow-lg"
              >
                {getImageUrl(article) ? (
                  <img
                    src={getImageUrl(article)}
                    alt={lang === 'fr' ? article.titleFr : article.titleEn}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-48 bg-accent/10 flex items-center justify-center">
                    <Tag size={32} className="text-accent/50" />
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3 text-xs text-grey-muted">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDate(article.createdAt)}
                    </span>
                    {article.category && (
                      <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent font-semibold">
                        {categoryLabels[article.category] || article.category}
                      </span>
                    )}
                    {article.pinned && (
                      <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 font-semibold">
                        {lang === 'fr' ? 'Épinglé' : 'Pinned'}
                      </span>
                    )}
                  </div>

                  <h2 className="font-heading font-bold text-heading text-lg mb-2 group-hover:text-accent transition-colors">
                    {lang === 'fr' ? article.titleFr : article.titleEn}
                  </h2>

                  {(lang === 'fr' ? article.excerptFr : article.excerptEn) && (
                    <p className="text-grey-muted text-sm line-clamp-3">
                      {lang === 'fr' ? article.excerptFr : article.excerptEn}
                    </p>
                  )}
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export default News;
