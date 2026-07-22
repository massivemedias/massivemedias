import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Sticker, Search, Eye, EyeOff, Baby, FileX, Filter,
  Pencil, Loader2, X, Save, AlertTriangle, RotateCcw,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { MASSIVE_STICKERS, MASSIVE_STICKER_CATEGORIES } from '../data/massiveStickers';
import { HIDDEN_STICKERS } from '../data/stickersModeration';
import { KIDS_SAFE, ETIQUETTE_LOWRES_EXCLUDED } from '../data/etiquettes';
import { STICKER_COLLECTION_UNIT_PRICE } from '../utils/pricingData';
import { applyOverrides, fetchStickerOverrides, saveStickerOverride, strokeStyle } from '../utils/stickerOverrides';

/**
 * AdminStickers.jsx - ADMIN-STICKERS.
 *
 * Phase 1 : liste en lecture seule.
 * Phase 2 : RENOMMER (FR/EN/ES) et MASQUER / REACTIVER.
 *
 * ARCHITECTURE : le catalogue de base reste le fichier statique ; Strapi ne
 * porte que le delta (sticker-override). Un slug absent des overrides garde
 * ses valeurs d'origine.
 *
 * "RIEN NE MEURT" : aucun bouton ne supprime. Retirer de la vente = masquer,
 * reversible d'un clic depuis le filtre "Masques".
 *
 * Le SLUG n'est jamais editable : identifiant technique a vie (URLs, SKU
 * `sticker-massive-<slug>`, favoris enregistres, commandes passees).
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

  const [overrides, setOverrides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);   // sticker en cours de renommage
  const [maskTarget, setMaskTarget] = useState(null); // sticker a masquer/reactiver
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setOverrides(await fetchStickerOverrides());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Catalogue de base + delta admin, puis annotation des etats.
  const annotated = useMemo(() => {
    const merged = applyOverrides(MASSIVE_STICKERS, overrides);
    return merged.map((s) => ({
      ...s,
      // Deux sources de masquage : la liste STATIQUE (NSFW cures, non
      // reversible ici) et le masquage ADMIN (reversible d'un clic).
      hiddenStatic: HIDDEN_STICKERS.has(s.slug),
      hiddenByAdmin: !!s.hiddenByAdmin,
      hidden: HIDDEN_STICKERS.has(s.slug) || !!s.hiddenByAdmin,
      kids: KIDS_SET.has(s.slug),
      excluded: ETIQUETTE_LOWRES_EXCLUDED.has(s.slug),
      price: STICKER_COLLECTION_UNIT_PRICE,
      strokeWidth: s.strokeWidth,
    }));
  }, [overrides]);

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
      return [s.slug, s.fr, s.en, s.es].some((v) => (v || '').toLowerCase().includes(q));
    });
  }, [annotated, search, family, status]);

  const famLabel = (id) => {
    const c = MASSIVE_STICKER_CATEGORIES.find((x) => x.id === id);
    return c ? (c[lang] || c.fr) : id;
  };

  const persist = async (slug, patch) => {
    setSaving(true);
    setError('');
    try {
      await saveStickerOverride(slug, patch);
      await load();
      setEditing(null);
      setMaskTarget(null);
    } catch (e) {
      setError(e?.response?.data?.error?.message || e?.message || 'Echec de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* ---------- En-tete ---------- */}
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl flex items-center justify-center bg-accent/10 flex-shrink-0">
          <Sticker size={20} className="text-accent" />
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-heading font-bold text-heading leading-tight">Stickers</h1>
          <p className="text-xs text-grey-muted">
            {tx({
              fr: 'Renommer et retirer de la vente. Rien n\'est jamais supprime.',
              en: 'Rename and pull from sale. Nothing is ever deleted.',
              es: 'Renombrar y retirar de la venta. Nada se elimina nunca.',
            })}
          </p>
        </div>
        {loading && <Loader2 size={16} className="text-accent animate-spin ml-auto" />}
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

      {error && (
        <div className="rounded-xl p-3 bg-red-500/10 text-red-400 text-sm flex items-center gap-2">
          <AlertTriangle size={15} /> {error}
        </div>
      )}

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
                  style={strokeStyle(s)}
                  className={`sticker-stroke w-full h-full object-contain p-1.5 ${s.hidden ? 'opacity-35 grayscale' : ''}`}
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
                    <EyeOff size={9} /> {s.hiddenStatic
                      ? tx({ fr: 'Masque (liste)', en: 'Hidden (list)', es: 'Oculto (lista)' })
                      : tx({ fr: 'Retire', en: 'Pulled', es: 'Retirado' })}
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

              <p className="text-sm font-bold text-accent mt-2 tabular-nums">{s.price} $</p>

              {/* ---- Actions ---- */}
              <div className="flex gap-1.5 mt-2.5">
                <button
                  onClick={() => setEditing(s)}
                  className="flex-1 text-[11px] py-1.5 rounded-lg bg-glass text-grey-light hover:text-heading transition-colors inline-flex items-center justify-center gap-1"
                >
                  <Pencil size={11} /> {tx({ fr: 'Renommer', en: 'Rename', es: 'Renombrar' })}
                </button>
                {s.hiddenStatic ? (
                  // Masque par la liste statique curee : pas reversible ici, ca
                  // se decide dans stickersModeration.js (NSFW, verrouille CI).
                  <span
                    className="flex-1 text-[11px] py-1.5 rounded-lg bg-glass text-grey-muted/60 text-center cursor-not-allowed"
                    title={tx({
                      fr: 'Masque par la liste de moderation, pas reversible ici',
                      en: 'Hidden by the moderation list, not reversible here',
                      es: 'Oculto por la lista de moderacion',
                    })}
                  >
                    {tx({ fr: 'Verrouille', en: 'Locked', es: 'Bloqueado' })}
                  </span>
                ) : (
                  <button
                    onClick={() => setMaskTarget(s)}
                    className={`flex-1 text-[11px] py-1.5 rounded-lg transition-colors inline-flex items-center justify-center gap-1 ${
                      s.hiddenByAdmin
                        ? 'bg-green-500/15 text-green-400 hover:bg-green-500/25'
                        : 'bg-glass text-grey-light hover:text-red-400'
                    }`}
                  >
                    {s.hiddenByAdmin
                      ? <><RotateCcw size={11} /> {tx({ fr: 'Remettre', en: 'Restore', es: 'Restaurar' })}</>
                      : <><EyeOff size={11} /> {tx({ fr: 'Retirer', en: 'Pull', es: 'Retirar' })}</>}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---------- Modal RENOMMER ---------- */}
      {editing && (
        <EditModal
          sticker={editing}
          saving={saving}
          tx={tx}
          onClose={() => setEditing(null)}
          onSave={(patch) => persist(editing.slug, patch)}
        />
      )}

      {/* ---------- Modal RETIRER / REMETTRE ---------- */}
      {maskTarget && (
        <MaskModal
          sticker={maskTarget}
          saving={saving}
          tx={tx}
          onClose={() => setMaskTarget(null)}
          onConfirm={() => persist(maskTarget.slug, { hidden: !maskTarget.hiddenByAdmin })}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

// Defaut du site (index.css .sticker-stroke). Sert de valeur de depart au
// curseur ET de reference dans l'apercu "avant / apres".
const STROKE_DEFAULT = 1.5;

function EditModal({ sticker, saving, tx, onClose, onSave }) {
  const [fr, setFr] = useState(sticker.fr || '');
  const [en, setEn] = useState(sticker.en || '');
  const [es, setEs] = useState(sticker.es || '');
  const [stroke, setStroke] = useState(
    typeof sticker.strokeWidth === 'number' ? sticker.strokeWidth : STROKE_DEFAULT,
  );

  const strokeChanged = typeof sticker.strokeWidth === 'number'
    ? stroke !== sticker.strokeWidth
    : stroke !== STROKE_DEFAULT;

  const dirty = fr !== sticker.fr || en !== sticker.en || es !== sticker.es || strokeChanged;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl p-5 card-bg space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-heading font-bold text-heading">
            {tx({ fr: 'Renommer', en: 'Rename', es: 'Renombrar' })}
          </h2>
          <button onClick={onClose} className="text-grey-muted hover:text-heading"><X size={18} /></button>
        </div>

        <div className="flex items-center gap-3">
          <img src={`${MINI_DIR}/${sticker.slug}.webp`} alt="" className="w-14 h-14 object-contain rounded-lg bg-glass p-1" />
          <div className="min-w-0">
            <p className="text-xs text-grey-muted">{tx({ fr: 'Slug (jamais modifiable)', en: 'Slug (never editable)', es: 'Slug (nunca editable)' })}</p>
            <p className="text-sm font-mono text-grey-light truncate">{sticker.slug}</p>
          </div>
        </div>

        {[
          { l: 'FR', v: fr, set: setFr },
          { l: 'EN', v: en, set: setEn },
          { l: 'ES', v: es, set: setEs },
        ].map(({ l, v, set }) => (
          <div key={l}>
            <label className="text-xs text-grey-muted block mb-1">{l}</label>
            <input
              type="text"
              value={v}
              maxLength={80}
              onChange={(e) => set(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-glass text-heading text-sm focus:outline-none"
            />
          </div>
        ))}

        {/* ---- Contour die-cut, avec apercu avant / apres ---- */}
        <div className="pt-1">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-grey-muted">
              {tx({ fr: 'Contour die-cut', en: 'Die-cut outline', es: 'Contorno die-cut' })}
            </label>
            <span className="text-xs font-mono text-heading tabular-nums">{stroke.toFixed(1)} px</span>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            {[
              { w: STROKE_DEFAULT, l: tx({ fr: 'Defaut du site', en: 'Site default', es: 'Por defecto' }) },
              { w: stroke, l: tx({ fr: 'Apercu', en: 'Preview', es: 'Vista previa' }) },
            ].map(({ w, l }, i) => (
              <div key={i} className="rounded-lg bg-glass p-2 text-center">
                <img
                  src={`${MINI_DIR}/${sticker.slug}.webp`}
                  alt=""
                  style={{ '--stk': `${w}px` }}
                  className="sticker-stroke w-full aspect-square object-contain"
                />
                <span className="text-[10px] text-grey-muted block mt-1">{l}</span>
              </div>
            ))}
          </div>

          <input
            type="range"
            min="0" max="6" step="0.5"
            value={stroke}
            onChange={(e) => setStroke(Number(e.target.value))}
            className="w-full accent-accent"
          />
          <button
            onClick={() => setStroke(STROKE_DEFAULT)}
            className="text-[11px] text-grey-muted hover:text-accent mt-1"
          >
            {tx({ fr: 'Revenir au defaut', en: 'Back to default', es: 'Volver al valor por defecto' })}
          </button>
        </div>

        <p className="text-[11px] text-grey-muted leading-relaxed">
          {tx({
            fr: 'Les URLs, le slug et les fichiers images ne changent jamais. Seuls le nom affiche et le contour sont modifies.',
            en: 'URLs, slug and image files never change. Only the displayed name and outline are modified.',
            es: 'Las URLs, el slug y las imagenes nunca cambian. Solo el nombre y el contorno.',
          })}
        </p>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-glass text-grey-light text-sm hover:text-heading">
            {tx({ fr: 'Annuler', en: 'Cancel', es: 'Cancelar' })}
          </button>
          <button
            onClick={() => onSave({ nameFr: fr, nameEn: en, nameEs: es, strokeWidth: stroke })}
            disabled={saving || !dirty}
            className="flex-1 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-40"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {tx({ fr: 'Enregistrer', en: 'Save', es: 'Guardar' })}
          </button>
        </div>
      </div>
    </div>
  );
}

function MaskModal({ sticker, saving, tx, onClose, onConfirm }) {
  const restoring = sticker.hiddenByAdmin;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl p-5 card-bg space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <span className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${restoring ? 'bg-green-500/15' : 'bg-amber-500/15'}`}>
            {restoring ? <RotateCcw size={18} className="text-green-400" /> : <AlertTriangle size={18} className="text-amber-400" />}
          </span>
          <h2 className="text-lg font-heading font-bold text-heading">
            {restoring
              ? tx({ fr: 'Remettre en vente ?', en: 'Put back on sale?', es: 'Volver a poner a la venta?' })
              : tx({ fr: 'Retirer de la vente ?', en: 'Pull from sale?', es: 'Retirar de la venta?' })}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <img src={`${MINI_DIR}/${sticker.slug}.webp`} alt="" className="w-14 h-14 object-contain rounded-lg bg-glass p-1" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-heading truncate">{sticker.fr}</p>
            <p className="text-[11px] font-mono text-grey-muted truncate">{sticker.slug}</p>
          </div>
        </div>

        <p className="text-sm text-grey-light leading-relaxed">
          {restoring
            ? tx({
                fr: 'Le design redevient visible sur la boutique et achetable.',
                en: 'The design becomes visible on the shop and purchasable again.',
                es: 'El diseno vuelve a ser visible y comprable.',
              })
            : tx({
                fr: 'Le design est retire des vues publiques et refuse au paiement, mais il est CONSERVE. Aucune suppression : tu peux le remettre a tout moment depuis le filtre "Masques".',
                en: 'The design is pulled from public views and refused at checkout, but it is KEPT. Nothing is deleted: you can restore it any time from the "Hidden" filter.',
                es: 'El diseno se retira de las vistas publicas y se rechaza en el pago, pero se CONSERVA. Nada se elimina: puedes restaurarlo cuando quieras.',
              })}
        </p>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-glass text-grey-light text-sm hover:text-heading">
            {tx({ fr: 'Annuler', en: 'Cancel', es: 'Cancelar' })}
          </button>
          <button
            onClick={onConfirm}
            disabled={saving}
            className={`flex-1 py-2.5 rounded-lg text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-40 ${
              restoring ? 'bg-green-600' : 'bg-amber-600'
            }`}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : (restoring ? <RotateCcw size={14} /> : <EyeOff size={14} />)}
            {restoring
              ? tx({ fr: 'Remettre', en: 'Restore', es: 'Restaurar' })
              : tx({ fr: 'Retirer', en: 'Pull', es: 'Retirar' })}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminStickers;
