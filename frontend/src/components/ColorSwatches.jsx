/**
 * ColorSwatches - selecteur de couleur via petits carres colores.
 * Pas de nom visible. Tooltip natif au hover (title attr).
 * Anneau de selection + scale sur hover.
 */

// Retourne true si la couleur est claire (besoin d'un contour pour etre visible)
function isLight(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) > 180;
}

function ColorSwatches({ colors, selected, onChange, label }) {
  return (
    <div>
      {label && (
        <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2">
          {label}
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        {colors.map(c => {
          const active = selected === c.id;
          const light = isLight(c.hex);
          return (
            <button
              key={c.id}
              type="button"
              title={c.name}
              aria-label={c.name}
              onClick={() => onChange(c.id)}
              className={`
                w-8 h-8 rounded-xl transition-all duration-150
                ${active
                  ? 'ring-2 ring-offset-2 ring-accent scale-110 ring-offset-[var(--bg-card,#1a1a2e)]'
                  : 'hover:scale-110 hover:ring-1 hover:ring-white/30 hover:ring-offset-1 hover:ring-offset-[var(--bg-card,#1a1a2e)]'
                }
              `}
              style={{
                backgroundColor: c.hex,
                boxShadow: light
                  ? '0 0 0 1px rgba(0,0,0,0.18)'
                  : '0 0 0 1px rgba(255,255,255,0.08)',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

export default ColorSwatches;
