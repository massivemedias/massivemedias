// @vitest-environment jsdom
/**
 * FILET DE RENDU - les pages critiques doivent MONTER.
 *
 * POURQUOI CE FICHIER EXISTE : le 22 juillet 2026, /stickers est tombee en prod
 * sur un `ReferenceError: strokeBySlug is not defined` (variable declaree dans
 * le composant page, utilisee dans InfiniteGrid, un composant separe). Les trois
 * filets en place ont laisse passer :
 *   - le BUILD : le JSX etait valide, Vite ne resout pas les portees d'execution ;
 *   - les TESTS : 364 tests, tous sur des fonctions pures, AUCUN ne montait un
 *     composant React ;
 *   - le PRERENDU : 28 pages "OK", parce que la garde __MASSIVE_PRERENDER__
 *     court-circuitait justement le code fautif. Le crash n'arrivait qu'a
 *     l'hydratation, chez un vrai visiteur.
 *
 * Ce test ne verifie PAS l'apparence. Il verifie qu'une page MONTE sans lancer
 * d'exception. C'est volontairement grossier : c'est exactement le filet qui
 * manquait, et il aurait casse au CI sur ce bug.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
// SEO.jsx utilise Helmet : sans son provider, le dispatcher casse au montage.
import { HelmetProvider } from 'react-helmet-async';

// --- Le reseau ne doit JAMAIS partir depuis un test. -------------------------
vi.mock('../services/api', () => {
  const rien = () => Promise.resolve({ data: { data: [] } });
  const api = { get: rien, post: rien, put: rien, patch: rien, delete: rien };
  return { default: api, api, apiPublic: api };
});
vi.mock('../lib/supabase', () => ({
  default: null,
  getSupabase: () => null,
  supabase: {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
  },
}));

import { ThemeProvider } from '../i18n/ThemeContext';
import { LanguageProvider } from '../i18n/LanguageContext';
import { SiteContentProvider } from '../hooks/useSiteContent';
import { ServicePagesProvider } from '../hooks/useServicePages';
import { ArtistsProvider } from '../hooks/useArtists';
import { ProductsProvider } from '../hooks/useProducts';
import { CookieProvider } from '../contexts/CookieContext';
import { AuthProvider } from '../contexts/AuthContext';
import { UserRoleProvider } from '../contexts/UserRoleContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { CartProvider } from '../contexts/CartContext';
import { FavoritesProvider } from '../contexts/FavoritesContext';

import MassiveStickers from './MassiveStickers';
import Etiquettes from './Etiquettes';
import Shop from './Shop';

/** Reproduit l'arbre de providers de main.jsx. */
function monte(ui, route = '/') {
  return render(
    <HelmetProvider>
    <MemoryRouter initialEntries={[route]}>
      <ThemeProvider><LanguageProvider>
        <SiteContentProvider><ServicePagesProvider><ArtistsProvider><ProductsProvider>
          <CookieProvider><AuthProvider><UserRoleProvider><NotificationProvider>
            <CartProvider><FavoritesProvider>
              {ui}
            </FavoritesProvider></CartProvider>
          </NotificationProvider></UserRoleProvider></AuthProvider></CookieProvider>
        </ProductsProvider></ArtistsProvider></ServicePagesProvider></SiteContentProvider>
      </LanguageProvider></ThemeProvider>
    </MemoryRouter>
    </HelmetProvider>,
  );
}

let erreurs;
beforeEach(() => {
  // Une exception avalee par un ErrorBoundary n'echoue pas le test toute seule :
  // React la re-loggue via console.error. On la traite comme un echec.
  erreurs = [];
  vi.spyOn(console, 'error').mockImplementation((...a) => { erreurs.push(a.join(' ')); });
  // jsdom n'implemente ni IntersectionObserver ni matchMedia, utilises par les
  // reveals et le theme. Sans ca la page casse pour une raison SANS RAPPORT
  // avec ce qu'on veut tester.
  global.IntersectionObserver = class {
    observe() {} unobserve() {} disconnect() {} takeRecords() { return []; }
  };
  // jsdom n'implemente pas le canvas 2D. L'apercu Mini Massive mesure du texte
  // (etiquetteLayout.labelLineGapPx) : sans stub il casse pour une raison de
  // plomberie de test, pas pour un vrai defaut de la page.
  if (!HTMLCanvasElement.prototype.getContext.__stub) {
    const stub = function () {
      return {
        measureText: () => ({
          width: 42, actualBoundingBoxAscent: 8, actualBoundingBoxDescent: 2,
          fontBoundingBoxAscent: 10, fontBoundingBoxDescent: 3,
        }),
        fillText() {}, clearRect() {}, drawImage() {}, save() {}, restore() {},
        translate() {}, rotate() {}, scale() {}, beginPath() {}, closePath() {},
        fill() {}, stroke() {}, arc() {}, moveTo() {}, lineTo() {},
        setTransform() {}, createPattern: () => null, getImageData: () => ({ data: [] }),
        putImageData() {}, fillRect() {},
      };
    };
    stub.__stub = true;
    HTMLCanvasElement.prototype.getContext = stub;
  }
  if (!document.fonts) {
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: { ready: Promise.resolve(), load: () => Promise.resolve([]), addEventListener() {} },
    });
  }
  if (!window.matchMedia) {
    window.matchMedia = () => ({
      matches: false, addEventListener() {}, removeEventListener() {},
      addListener() {}, removeListener() {},
    });
  }
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const PAGES = [
  { nom: '/stickers', Comp: MassiveStickers, route: '/stickers' },
  { nom: '/etiquettes', Comp: Etiquettes, route: '/etiquettes' },
  { nom: '/boutique', Comp: Shop, route: '/boutique' },
];

describe('les pages critiques montent sans exception', () => {
  for (const { nom, Comp, route } of PAGES) {
    it(`${nom} monte`, () => {
      expect(() => monte(<Comp />, route)).not.toThrow();
      // Le crash du 22 juillet passait par un ErrorBoundary : la page renvoyait
      // HTTP 200 en etant blanche. On refuse donc aussi les ReferenceError et
      // consorts remontees en console.
      const graves = erreurs.filter((e) => /ReferenceError|TypeError|is not defined|is not a function/.test(e));
      expect(graves).toEqual([]);
    });
  }

  it('/stickers rend reellement des vignettes (pas une coquille vide)', () => {
    const { container } = monte(<MassiveStickers />, '/stickers');
    // Un ErrorBoundary rendrait un fallback sans aucune image de sticker.
    expect(container.querySelectorAll('img').length).toBeGreaterThan(0);
  });
});
