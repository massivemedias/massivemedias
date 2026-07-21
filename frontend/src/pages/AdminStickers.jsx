import { useState, useMemo } from 'react';
import { Sticker, Search, Eye, EyeOff, Baby, FileX, Filter } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { MASSIVE_STICKERS, MASSIVE_STICKER_CATEGORIES } from '../data/massiveStickers';
import { HIDDEN_STICKERS } from '../data/stickersModeration';
import { KIDS_SAFE, ETIQUETTE_LOWRES_EXCLUDED } from '../data/etiquettes';
import { STICKER_COLLECTION_UNIT_PRICE } from '../utils/pricingData';

/**
 * AdminStickers.jsx - ADMIN-STICKERS phase 1 : LISTE EN LECTURE SEULE.
 *
 * Volontairement SANS backend : tout ce qui est affiche ici existe deja en
 * statique dans le bundle (catalogue, listes de moderation, prix uniforme).
 * Aucune ecriture, aucun appel API, donc aucun risque sur la prod.
 *
 * Les phases suivantes (renommer / masquer / stroke / prix) brancheront un
 * content-type Strapi `sticker-override` par slug, selon l'architecture
 * validee : le fichier statique reste le catalogue de base, Strapi ne porte
 * que le delta, et le prix a une source unique servie au front ET verifiee
 * au checkout (jamais deux listes a synchroniser).
 *
 * Le slug est un identifiant technique A VIE : il n'apparait ici qu'en
 * lecture, aucune phase ne le rendra editable.
 */

const MINI_DIR = '/images/thumbs-mini/stickers-massive';

const KIDS_SET = new Set(KIDS_SAFE);

const STATUS_FILTERS = [
  { id: 'all', fr: 'Tous', en: 'All', es: 'Todos' },
  { id: 'visible', fr: 'Visibles', en: 'Visible', es: 'Visibles' },
  { id: 'hidden', fr: 'Masques', en: 'Hidden', es: 'Ocultos' },
  { id: 'kids', fr: 'Kids-safe', en: 'Kids-safe', es: 'Kids-safe' },
  { id: 'excluded', fr: 'Exclus etiquettes', en: 'Label-excluded', es: 'Excluidos etiquetas' },
];

function AdminStickers() {
  const { tx, lang } = useLang();
  const [search, setSearch] = useState('');
  const [family, setFamily] = useState('all');
  const [status, setStatus] = useState('all');

  // Un seul passage sur les 385 : on annote chaque sticker de son etat.
  const annotated = useMemo(() => MASSIVE_STICKERS.map((s) => ({
    ...s,
    hidden: HIDDEN_STICKERS.has(s.slug),
    kids: KIDS_SET.has(s.slug),
    excluded: ETIQUETTE_LOWRES_EXCLUDED.has(s.slug),
    price: STICKER_COLLECTION_UNIT_PRICE,
  })), []);

  const counts = useMemo(() => ({
    total: annotated.length,
    hidden: annotated.filter((s) => s.hidden).length,
    kids: annotated.filter((s) => s.kids).length,
    excluded: annotated.filter((s) => s.excluded).length,
  }), [annotated]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return annotated.filter((s) => {
      if (family !== 'all' && s.cat !== family) return false;
      if (status === 'visible' && s.hidden) return false;
      if (status === 'hidden' && !s.hidden) return false;
      if (status === 'kids' && !s.kids) return false;
      if (status === 'excluded' && !s.excluded) return false;
      if (!q) return true;
      // La recherche couvre le slug ET les 3 langues : on cherche souvent un
      // design par le nom qu'on a en tete, pas par sa langue d'affichage.
      return [s.slug, s.fr, s.en, s.es].some((v) => (v || '').toLowerCase().includes(q));
    });
  }, [annotated, search, family, status]);

  const famLabel = (id) => {
    const c = MASSIVE_STICKER_CATEGORIES.find((x) => x.id === id);
    return c ? (c[lang] || c.fr) : id;
  };

  return (
    <div className="space-y-5">
      {/* ---------- En-tete + compteurs ---------- */}
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl flex items-center justify-center bg-accent/10 flex-shrink-0">
          <Sticker size={20} className="text-accent" />
        </span>
        <div>
          <h1 className="text-2xl font-heading font-bold text-heading leading-tight">Stickers</h1>
          <p className="text-xs text-grey-muted">
            {tx({
              fr: 'Catalogue de la collection Massive. Lecture seule (phase 1).',
              en: 'Massive collection catalogue. Read-only (phase 1).',
              es: 'Catalogo de la coleccion Massive. Solo lectura (fase 1).',
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { n: counts.total, l: tx({ fr: 'Designs', en: 'Designs', es: 'Disenos' }), Icon: Sticker },
          { n: counts.hidden, l: tx({ fr: 'Masques', en: 'Hidden', es: 'Ocultos' }), Icon: EyeOff },
          { n: counts.kids, l: tx({ fr: 'Kids-safe', en: 'Kids-safe', es: 'Kids-safe' }), Icon: Baby },
          { n: counts.excluded, l: tx({ fr: 'Exclus etiquettes', en: 'Label-excluded', es: 'Excluidos' }), Icon: FileX },
        ].map(({ n, l, Icon }) => (
          <div key={l} className="rounded-xl p-4 card-bg text-center">
            <Icon size={16} className="text-accent mx-auto mb-1.5" />
            <div className="text-2xl font-heading font-bold text-heading tabular-nums">{n}</div>
            <div className="text-[11px] text-grey-muted mt-0.5">{l}</div>
          </div>
        ))}
      </div>

      {/* ---------- Recherche + filtres ---------- */}
      <div className="rounded-2xl p-4 card-bg space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tx({
              fr: 'Chercher un nom (FR/EN/ES) ou un slug...',
              en: 'Search a name (FR/EN/ES) or a slug...',
              es: 'Buscar un nombre (FR/EN/ES) o un slug...',
            })}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-glass text-heading text-sm placeholder:text-grey-muted/50 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Filter size={13} className="text-grey-muted mr-0.5" />
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setStatus(f.id)}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                status === f.id ? 'bg-accent text-white font-semibold' : 'bg-glass text-grey-light hover:text-heading'
              }`}
            >
              {tx(f)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setFamily('all')}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
              family === 'all' ? 'bg-accent text-white font-semibold' : 'bg-glass text-grey-light hover:text-heading'
            }`}
          >
            {tx({ fr: 'Toutes familles', en: 'All families', es: 'Todas las familias' })}
          </button>
          {MASSIVE_STICKER_CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setFamily(c.id)}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                family === c.id ? 'bg-accent text-white font-semibold' : 'bg-glass text-grey-light hover:text-heading'
              }`}
            >
              {c[lang] || c.fr}
            </button>
          ))}
        </div>

        <p className="text-xs text-grey-muted pt-1">
          {filtered.length} / {counts.total} {tx({ fr: 'affiches', en: 'shown', es: 'mostrados' })}
        </p>
      </div>

      {/* ---------- Grille ---------- */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl p-10 card-bg text-center text-sm text-grey-muted">
          {tx({ fr: 'Aucun design ne correspond.', en: 'No design matches.', es: 'Ningun diseno coincide.' })}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map((s) => (
            <div key={s.slug} className="rounded-xl p-3 card-bg flex flex-col min-w-0">
              <div className="relative aspect-square rounded-lg bg-glass flex items-center justify-center overflow-hidden mb-2">
                <img
                  src={`${MINI_DIR}/${s.slug}.webp`}
                  alt={s.fr}
                  loading="lazy"
                  className={`w-full h-full object-contain p-1.5 ${s.hidden ? 'opacity-35 grayscale' : ''}`}
                />
                {s.hidden && (
                  <span className="absolute top-1.5 right-1.5 w-6 h-6 rounded-md bg-black/70 flex items-center justify-center">
                    <EyeOff size={12} className="text-white" />
                  </span>
                )}
              </div>

              <p className="text-sm font-semibold text-heading truncate" title={s.fr}>{s.fr}</p>
              <p className="text-[11px] text-grey-muted truncate" title={s.slug}>{s.slug}</p>

              <div className="flex flex-wrap gap-1 mt-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-glass text-grey-light">{famLabel(s.cat)}</span>
                {s.hidden ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 inline-flex items-center gap-0.5">
                    <EyeOff size={9} /> {tx({ fr: 'Masque', en: 'Hidden', es: 'Oculto' })}
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 inline-flex items-center gap-0.5">
                    <Eye size={9} /> {tx({ fr: 'Visible', en: 'Visible', es: 'Visible' })}
                  </span>
                )}
                {s.kids && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-400 inline-flex items-center gap-0.5">
                    <Baby size={9} /> Kids
                  </span>
                )}
                {s.excluded && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 inline-flex items-center gap-0.5">
                    <FileX size={9} /> {tx({ fr: 'Hors etiq.', en: 'No label', es: 'Sin etiq.' })}
                  </span>
                )}
              </div>

              {/* Prix uniforme aujourd'hui (STICKER_COLLECTION_UNIT_PRICE).
                  Le prix par sticker arrive en phase 4, source unique servie
                  au front et verifiee au checkout. */}
              <p className="text-sm font-bold text-accent mt-2 tabular-nums">{s.price} $</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminStickers;
