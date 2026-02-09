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
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-purple-main/30">
      <div className="absolute inset-0 bg-black/80"></div>
      
      <nav className="container mx-auto px-4 py-4 relative z-10">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src={MassiveLogo} 
              alt="Massive Medias" 
              className="h-10 w-auto transition-transform duration-300 group-hover:scale-110"
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
              <button className="flex items-center gap-1 text-grey-light hover:text-magenta transition-colors duration-300 font-medium">
                Services
                <ChevronDown size={16} className={`transition-transform duration-300 ${servicesDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {servicesDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-2 w-64 rounded-xl overflow-hidden shadow-glow"
                    style={{ background: 'linear-gradient(145deg, #3A0066, #5B0099)' }}
                  >
                    {services.map((service, index) => (
                      <Link
                        key={service.slug}
                        to={`/services/${service.slug}`}
                        className="block px-6 py-3 text-grey-light hover:text-white hover:bg-magenta/20 transition-all duration-300 border-b border-purple-main/30 last:border-0"
                      >
                        {service.name}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link to="/tarifs" className="text-grey-light hover:text-magenta transition-colors duration-300 font-medium">
              Tarifs
            </Link>
            <Link to="/portfolio" className="text-grey-light hover:text-magenta transition-colors duration-300 font-medium">
              Portfolio
            </Link>
            <Link to="/boutique" className="text-grey-light hover:text-magenta transition-colors duration-300 font-medium">
              Boutique
            </Link>
            <Link to="/a-propos" className="text-grey-light hover:text-magenta transition-colors duration-300 font-medium">
              À propos
            </Link>
            <Link to="/contact" className="btn-primary">
              Contact
            </Link>

            {/* Panier */}
            <Link to="/panier" className="relative p-2 hover:text-magenta transition-colors duration-300">
              <ShoppingCart size={24} />
              <span className="absolute -top-1 -right-1 bg-magenta text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                0
              </span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-white hover:text-magenta transition-colors"
          >
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden mt-4 overflow-hidden"
            >
              <div className="flex flex-col gap-4 py-4">
                {/* Services Mobile */}
                <div>
                  <button 
                    onClick={() => setServicesDropdownOpen(!servicesDropdownOpen)}
                    className="w-full flex items-center justify-between text-grey-light hover:text-magenta transition-colors duration-300 font-medium py-2"
                  >
                    Services
                    <ChevronDown size={16} className={`transition-transform duration-300 ${servicesDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {servicesDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pl-4 flex flex-col gap-2 mt-2"
                      >
                        {services.map((service) => (
                          <Link
                            key={service.slug}
                            to={`/services/${service.slug}`}
                            className="text-grey-light hover:text-magenta transition-colors duration-300 py-1"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {service.name}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Link to="/tarifs" className="text-grey-light hover:text-magenta transition-colors duration-300 font-medium py-2" onClick={() => setMobileMenuOpen(false)}>
                  Tarifs
                </Link>
                <Link to="/portfolio" className="text-grey-light hover:text-magenta transition-colors duration-300 font-medium py-2" onClick={() => setMobileMenuOpen(false)}>
                  Portfolio
                </Link>
                <Link to="/boutique" className="text-grey-light hover:text-magenta transition-colors duration-300 font-medium py-2" onClick={() => setMobileMenuOpen(false)}>
                  Boutique
                </Link>
                <Link to="/a-propos" className="text-grey-light hover:text-magenta transition-colors duration-300 font-medium py-2" onClick={() => setMobileMenuOpen(false)}>
                  À propos
                </Link>
                <Link to="/panier" className="text-grey-light hover:text-magenta transition-colors duration-300 font-medium py-2" onClick={() => setMobileMenuOpen(false)}>
                  Panier (0)
                </Link>
                <Link to="/contact" className="btn-primary text-center mt-2" onClick={() => setMobileMenuOpen(false)}>
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
