/**
 * ADMIN-STICKERS phase 2 - fusion catalogue statique + overrides admin.
 *
 * Ce qui est verrouille ici : un override ne doit JAMAIS effacer une valeur
 * d'origine par accident. C'est le risque de la fusion : un champ vide renvoye
 * par l'API ne doit pas vider le nom affiche des 385 fiches.
 */
import { describe, it, expect } from 'vitest';
import { applyOverrides, adminHiddenSlugs, strokeStyle } from './stickerOverrides';

const BASE = [
  { slug: 'massive-a', fr: 'Alpha', en: 'Alpha EN', es: 'Alpha ES', cat: 'fun' },
  { slug: 'massive-b', fr: 'Beta', en: 'Beta EN', es: 'Beta ES', cat: 'dark' },
];

describe('applyOverrides', () => {
  it('renvoie la liste inchangee sans override', () => {
    expect(applyOverrides(BASE, [])).toBe(BASE);
    expect(applyOverrides(BASE, null)).toBe(BASE);
  });

  it('remplace uniquement le slug cible', () => {
    const out = applyOverrides(BASE, [{ slug: 'massive-a', nameFr: 'Renomme' }]);
    expect(out[0].fr).toBe('Renomme');
    expect(out[1].fr).toBe('Beta'); // le voisin ne bouge pas
  });

  it('ne vide JAMAIS un nom quand l override est vide ou null', () => {
    const out = applyOverrides(BASE, [{ slug: 'massive-a', nameFr: '', nameEn: null }]);
    expect(out[0].fr).toBe('Alpha');
    expect(out[0].en).toBe('Alpha EN');
  });

  it('preserve les champs non geres par l override', () => {
    const out = applyOverrides(BASE, [{ slug: 'massive-a', nameFr: 'X' }]);
    expect(out[0].cat).toBe('fun');
    expect(out[0].slug).toBe('massive-a');
  });

  it('annote hiddenByAdmin', () => {
    const out = applyOverrides(BASE, [{ slug: 'massive-b', hidden: true }]);
    expect(out[1].hiddenByAdmin).toBe(true);
    expect(out[0].hiddenByAdmin).toBeUndefined();
  });

  it('ignore un override dont le slug ne correspond a rien', () => {
    const out = applyOverrides(BASE, [{ slug: 'massive-inconnu', nameFr: 'Z' }]);
    expect(out.map((s) => s.fr)).toEqual(['Alpha', 'Beta']);
  });

  it('ne mute pas la liste d origine', () => {
    applyOverrides(BASE, [{ slug: 'massive-a', nameFr: 'Mutant' }]);
    expect(BASE[0].fr).toBe('Alpha');
  });
});

describe('adminHiddenSlugs', () => {
  it('ne retient que les hidden=true', () => {
    const s = adminHiddenSlugs([
      { slug: 'massive-a', hidden: true },
      { slug: 'massive-b', hidden: false },
      { slug: 'massive-c' },
    ]);
    expect([...s]).toEqual(['massive-a']);
  });

  it('tolere une entree vide', () => {
    expect(adminHiddenSlugs(null).size).toBe(0);
  });
});

describe('strokeStyle', () => {
  it('ne pose AUCUN style quand rien n est surcharge', () => {
    // Important : sans ca les 385 vignettes recevraient un attribut style inutile.
    expect(strokeStyle({ slug: 'massive-a' })).toBeUndefined();
    expect(strokeStyle(null)).toBeUndefined();
  });

  it('pose la variable CSS quand une epaisseur existe', () => {
    expect(strokeStyle({ strokeWidth: 3 })).toEqual({ '--stk': '3px' });
    expect(strokeStyle({ strokeWidth: 0 })).toEqual({ '--stk': '0px' });
  });

  it('porte strokeWidth a travers la fusion', () => {
    const out = applyOverrides(
      [{ slug: 'massive-a', fr: 'A', en: 'A', es: 'A' }],
      [{ slug: 'massive-a', strokeWidth: 2.5 }],
    );
    expect(strokeStyle(out[0])).toEqual({ '--stk': '2.5px' });
  });
});
