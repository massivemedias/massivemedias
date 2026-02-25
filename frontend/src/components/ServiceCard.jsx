import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLang } from '../i18n/LanguageContext';
import { useTheme } from '../i18n/ThemeContext';

function ServiceCard({ icon: Icon, title, description, link, image }) {
  const { t } = useLang();
  const { theme } = useTheme();

  return (
    <motion.div
      whileHover={{ y: theme === 'light' ? -3 : -8 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={link} className={`block overflow-hidden h-full group transition-colors duration-300 card-bg-bordered ${theme === 'light' ? 'rounded-xl' : 'rounded-2xl'}`}>
        {/* Image */}
        {image && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-purple-dark/90 to-transparent"></div>
            <div className="absolute bottom-3 left-4 p-2 rounded-lg icon-glass">
              <Icon size={24} className="text-white" />
            </div>
          </div>
        )}

        <div className="p-6 flex flex-col" style={{ minHeight: image ? 'auto' : '100%' }}>
          {!image && (
            <div className="mb-4 p-3 rounded-lg w-fit icon-bg">
              <Icon size={32} className="text-white" />
            </div>
          )}

          <h3 className="font-heading text-xl font-bold text-heading mb-3">
            {title}
          </h3>

          <p className="text-grey-light mb-6 flex-grow text-sm leading-relaxed">
            {description}
          </p>

          <div className="flex items-center gap-2 text-accent font-semibold text-sm">
            <span>{t('common.learnMore')}</span>
            <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-2" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default ServiceCard;
