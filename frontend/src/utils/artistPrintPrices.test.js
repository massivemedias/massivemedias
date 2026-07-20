import { describe, it, expect } from 'vitest';
import { ARTIST_PRINT_PRICES } from './pricingData';

// FIX-PRIX-SECURITE : SSOT unique de la grille marketplace artiste (fini les 4
// copies dont 2 fausses : A6 studio 15 / musee 25 dans AccountArtistDashboard,
// musee 20/30/60/80/120 dans ArtisteDetail). Ce verrou fait echouer toute
// regression vers ces anciennes valeurs.
describe('ARTIST_PRINT_PRICES — grille marketplace artiste canonique', () => {
  it('Studio conforme (A2 = null : 12 encres = musee only)', () => {
    expect(ARTIST_PRINT_PRICES.studio).toEqual({ postcard: 25, a4: 35, a3: 50, a3plus: 65, a2: null });
  });

  it('Musee conforme', () => {
    expect(ARTIST_PRINT_PRICES.museum).toEqual({ postcard: 50, a4: 75, a3: 120, a3plus: 160, a2: 190 });
  });

  it('Cadre conforme', () => {
    expect(ARTIST_PRINT_PRICES.framePriceByFormat).toEqual({ postcard: 20, a4: 20, a3: 30, a3plus: 35, a2: 45 });
  });

  it('coherence interne : musee > studio pour chaque format ou studio existe', () => {
    for (const k of ['postcard', 'a4', 'a3', 'a3plus']) {
      expect(ARTIST_PRINT_PRICES.museum[k]).toBeGreaterThan(ARTIST_PRINT_PRICES.studio[k]);
    }
  });
});
