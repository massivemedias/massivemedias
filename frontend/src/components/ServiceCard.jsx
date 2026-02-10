import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLang } from '../i18n/LanguageContext';

function ServiceCard({ icon: Icon, title, description, link, image }) {
  const { t } = useLang();

  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={link} className="block rounded-2xl overflow-hidden h-full group transition-colors duration-300" style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', boxShadow: 'var(--card-shadow)' }}>
        {/* Image */}
        {image && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-purple-dark/90 to-transparent"></div>
            <div className="absolute bottom-3 left-4 p-2 rounded-lg" style={{ background: 'var(--icon-glass)', backdropFilter: 'var(--icon-glass-blur)' }}>
              <Icon size={24} className="text-magenta" />
            </div>
          </div>
        )}

        <div className="p-6 flex flex-col" style={{ minHeight: image ? 'auto' : '100%' }}>
          {!image && (
            <div className="mb-4 p-3 rounded-lg w-fit" style={{ background: 'var(--icon-bg)' }}>
              <Icon size={32} className="text-magenta" />
            </div>
          )}

          <h3 className="font-heading text-xl font-bold text-heading mb-3">
            {title}
          </h3>

          <p className="text-grey-light mb-6 flex-grow text-sm leading-relaxed">
            {description}
          </p>

          <div className="flex items-center gap-2 text-magenta font-semibold text-sm">
            <span>{t('common.learnMore')}</span>
            <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-2" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default ServiceCard;
