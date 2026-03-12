import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLang } from '../i18n/LanguageContext';
import { useTheme } from '../i18n/ThemeContext';

function ServiceCard({ icon: Icon, title, description, link, image, mirror }) {
  const { t } = useLang();
  const { theme } = useTheme();

  return (
    <motion.div
      whileHover={{ y: theme === 'light' ? -3 : -8 }}
      transition={{ duration: 0.3 }}
      className="h-full flex flex-col"
    >
      <Link to={link} className={`block overflow-hidden h-full group transition-colors duration-300 card-bg-bordered ${theme === 'light' ? 'rounded-xl' : 'rounded-2xl'}`}>
        {/* Image */}
        {image && (
          <div className="relative aspect-[2/1] overflow-hidden flex items-center justify-center">
            <img
              src={image}
              alt={title}
              className={`w-full h-full object-contain transition-transform duration-500 drop-shadow-xl${mirror ? ' -scale-x-100 group-hover:-scale-x-110 group-hover:scale-y-110' : ' group-hover:scale-110'}`}
              loading="lazy"
            />
            <div className="absolute bottom-3 left-4 p-2 rounded-lg icon-glass">
              <Icon size={18} className="text-white" />
            </div>
          </div>
        )}

        <div className="p-4 flex flex-col" style={{ minHeight: image ? 'auto' : '100%' }}>
          {!image && (
            <div className="mb-4 p-3 rounded-lg w-fit icon-bg">
              <Icon size={32} className="text-white" />
            </div>
          )}

          <h3 className="font-heading text-xl font-bold text-heading mb-2">
            {title}
          </h3>

          <p className="text-grey-light mb-3 flex-grow text-sm leading-relaxed">
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
