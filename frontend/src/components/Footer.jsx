import { Link } from 'react-router-dom';
import { Instagram, Facebook, Mail } from 'lucide-react';
import MassiveLogo from '../assets/massive-logo.svg';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-purple-dark to-black border-t border-purple-main/30 py-12 mt-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Colonne 1 — Logo + tagline */}
          <div>
            <img 
              src={MassiveLogo} 
              alt="Massive Medias" 
              className="h-12 w-auto mb-4"
            />
            <p className="text-magenta font-semibold mb-2">Create. Print. Repeat.</p>
            <p className="text-grey-muted text-sm">
              Studio de production créative<br />
              Montréal, QC
            </p>
          </div>

          {/* Colonne 2 — Navigation */}
          <div>
            <h4 className="font-heading font-bold text-white mb-4">Navigation</h4>
            <ul className="space-y-2 text-grey-light">
              <li>
                <Link to="/services" className="hover:text-magenta transition-colors duration-300">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/tarifs" className="hover:text-magenta transition-colors duration-300">
                  Tarifs
                </Link>
              </li>
              <li>
                <Link to="/portfolio" className="hover:text-magenta transition-colors duration-300">
                  Portfolio
                </Link>
              </li>
              <li>
                <Link to="/boutique" className="hover:text-magenta transition-colors duration-300">
                  Boutique
                </Link>
              </li>
              <li>
                <Link to="/a-propos" className="hover:text-magenta transition-colors duration-300">
                  À propos
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-magenta transition-colors duration-300">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 3 — Services */}
          <div>
            <h4 className="font-heading font-bold text-white mb-4">Services</h4>
            <ul className="space-y-2 text-grey-light">
              <li>
                <Link to="/services/impression-fine-art" className="hover:text-magenta transition-colors duration-300">
                  Impression Fine Art
                </Link>
              </li>
              <li>
                <Link to="/services/stickers-custom" className="hover:text-magenta transition-colors duration-300">
                  Stickers Custom
                </Link>
              </li>
              <li>
                <Link to="/services/sublimation-merch" className="hover:text-magenta transition-colors duration-300">
                  Sublimation & Merch
                </Link>
              </li>
              <li>
                <Link to="/services/flyers-cartes" className="hover:text-magenta transition-colors duration-300">
                  Flyers & Cartes
                </Link>
              </li>
              <li>
                <Link to="/services/design-graphique" className="hover:text-magenta transition-colors duration-300">
                  Design Graphique
                </Link>
              </li>
              <li>
                <Link to="/services/developpement-web" className="hover:text-magenta transition-colors duration-300">
                  Développement Web
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 4 — Contact */}
          <div>
            <h4 className="font-heading font-bold text-white mb-4">Contact</h4>
            <ul className="space-y-3 text-grey-light">
              <li>Mile-End, Montréal</li>
              <li>Sur rendez-vous</li>
              <li>
                <a 
                  href="mailto:info@massivemedias.com" 
                  className="hover:text-magenta transition-colors duration-300 flex items-center gap-2"
                >
                  <Mail size={16} />
                  info@massivemedias.com
                </a>
              </li>
            </ul>

            {/* Réseaux sociaux */}
            <div className="flex gap-4 mt-6">
              <a 
                href="https://instagram.com/massivemedias" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-purple-main hover:bg-magenta transition-all duration-300 hover:shadow-glow"
              >
                <Instagram size={20} />
              </a>
              <a 
                href="https://facebook.com/massivemedias" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-purple-main hover:bg-magenta transition-all duration-300 hover:shadow-glow"
              >
                <Facebook size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* Bas de footer */}
        <div className="border-t border-purple-main/30 pt-8 text-center text-grey-muted text-sm">
          <p>
            © 2013-{currentYear} Massive Medias. Tous droits réservés. NEQ 2269057891
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
