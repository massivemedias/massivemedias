import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ChevronDown, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MassiveLogo from '../assets/massive-logo.svg';

function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);

  const services = [
    { name: 'Impression Fine Art', slug: 'impression-fine-art' },
    { name: 'Stickers Custom', slug: 'stickers-custom' },
    { name: 'Sublimation & Merch', slug: 'sublimation-merch' },
    { name: 'Flyers & Cartes', slug: 'flyers-cartes' },
    { name: 'Design Graphique', slug: 'design-graphique' },
    { name: 'Développement Web', slug: 'developpement-web' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50" style={{ background: 'rgba(65, 0, 130, 0.95)', backdropFilter: 'blur(12px)' }}>
      <nav className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img 
              src={MassiveLogo} 
              alt="Massive Medias" 
              className="h-9 w-auto"
            />
          </Link>

          {/* Navigation Desktop */}
          <div className="hidden lg:flex items-center gap-8">
            {/* Services Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setServicesDropdownOpen(true)}
              onMouseLeave={() => setServicesDropdownOpen(false)}
            >
              <button className="flex items-center gap-1 text-white/80 hover:text-white transition-colors duration-200 font-medium text-sm">
                Services
                <ChevronDown size={14} className={`transition-transform duration-200 ${servicesDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {servicesDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-2 w-56 rounded-lg overflow-hidden border border-white/10"
                    style={{ background: '#4A0080', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)' }}
                  >
                    {services.map((service) => (
                      <Link
                        key={service.slug}
                        to={`/services/${service.slug}`}
                        className="block px-5 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors duration-150 border-b border-white/5 last:border-0"
                      >
                        {service.name}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link to="/tarifs" className="text-white/80 hover:text-white transition-colors duration-200 font-medium text-sm">
              Tarifs
            </Link>
            <Link to="/portfolio" className="text-white/80 hover:text-white transition-colors duration-200 font-medium text-sm">
              Portfolio
            </Link>
            <Link to="/boutique" className="text-white/80 hover:text-white transition-colors duration-200 font-medium text-sm">
              Boutique
            </Link>
            <Link to="/a-propos" className="text-white/80 hover:text-white transition-colors duration-200 font-medium text-sm">
              À propos
            </Link>
            <Link to="/contact" className="btn-primary text-sm py-2 px-5">
              Contact
            </Link>

            {/* Panier */}
            <Link to="/panier" className="relative p-2 text-white/80 hover:text-white transition-colors duration-200">
              <ShoppingCart size={20} />
              <span className="absolute -top-1 -right-1 bg-magenta text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold text-[10px]">
                0
              </span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-white/80 hover:text-white transition-colors"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden mt-3 overflow-hidden border-t border-white/10 pt-4"
            >
              <div className="flex flex-col gap-1">
                {/* Services Mobile */}
                <div>
                  <button 
                    onClick={() => setServicesDropdownOpen(!servicesDropdownOpen)}
                    className="w-full flex items-center justify-between text-white/80 hover:text-white transition-colors duration-200 font-medium py-2.5 text-sm"
                  >
                    Services
                    <ChevronDown size={14} className={`transition-transform duration-200 ${servicesDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {servicesDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pl-4 flex flex-col gap-0.5 mb-2"
                      >
                        {services.map((service) => (
                          <Link
                            key={service.slug}
                            to={`/services/${service.slug}`}
                            className="text-white/60 hover:text-white transition-colors duration-200 py-2 text-sm"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {service.name}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Link to="/tarifs" className="text-white/80 hover:text-white transition-colors duration-200 font-medium py-2.5 text-sm" onClick={() => setMobileMenuOpen(false)}>
                  Tarifs
                </Link>
                <Link to="/portfolio" className="text-white/80 hover:text-white transition-colors duration-200 font-medium py-2.5 text-sm" onClick={() => setMobileMenuOpen(false)}>
                  Portfolio
                </Link>
                <Link to="/boutique" className="text-white/80 hover:text-white transition-colors duration-200 font-medium py-2.5 text-sm" onClick={() => setMobileMenuOpen(false)}>
                  Boutique
                </Link>
                <Link to="/a-propos" className="text-white/80 hover:text-white transition-colors duration-200 font-medium py-2.5 text-sm" onClick={() => setMobileMenuOpen(false)}>
                  À propos
                </Link>
                <Link to="/panier" className="text-white/80 hover:text-white transition-colors duration-200 font-medium py-2.5 text-sm" onClick={() => setMobileMenuOpen(false)}>
                  Panier (0)
                </Link>
                <Link to="/contact" className="btn-primary text-center mt-3 text-sm py-2.5" onClick={() => setMobileMenuOpen(false)}>
                  Contact
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}

export default Header;
