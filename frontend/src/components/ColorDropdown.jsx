import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

// Returns true if the color is light (needs dark text)
function isLight(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) > 150;
}

function ColorDropdown({ colors, selected, onChange, label }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const listRef = useRef(null);

  const current = colors.find(c => c.id === selected) || colors[0];

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Scroll to selected item when opening (without moving the page)
  useEffect(() => {
    if (open && listRef.current) {
      const active = listRef.current.querySelector('[data-active="true"]');
      if (active) {
        const list = listRef.current;
        list.scrollTop = active.offsetTop - list.offsetHeight / 2 + active.offsetHeight / 2;
      }
    }
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {label && (
        <label className="block text-heading font-semibold text-xs uppercase tracking-wider mb-2">
          {label}
        </label>
      )}

      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl border transition-all text-left ${
          open
            ? 'border-accent/60 bg-white/[0.03]'
            : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
        }`}
      >
        <span
          className="w-5 h-5 rounded-full flex-shrink-0 shadow-sm"
          style={{ backgroundColor: current.hex, boxShadow: `0 0 0 1px rgba(255,255,255,0.1)` }}
        />
        <span className="text-heading text-sm font-medium flex-1 truncate">{current.name}</span>
        <ChevronDown
          size={15}
          className={`text-grey-muted/60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1.5 rounded-xl border border-gray-200 bg-white shadow-2xl shadow-black/15 overflow-hidden">
          <div ref={listRef} className="max-h-64 overflow-y-auto overscroll-contain">
            {colors.map(c => {
              const isActive = selected === c.id;
              const light = isLight(c.hex);
              const textColor = light ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.95)';
              return (
                <button
                  key={c.id}
                  data-active={isActive}
                  onClick={() => { onChange(c.id); setOpen(false); }}
                  className="w-full flex items-center gap-3 py-2 px-3.5 text-left text-sm transition-all hover:opacity-80"
                  style={{ backgroundColor: c.hex, color: textColor }}
                >
                  <span
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: c.hex,
                      boxShadow: light
                        ? '0 0 0 1.5px rgba(0,0,0,0.15)'
                        : '0 0 0 1.5px rgba(255,255,255,0.25)',
                    }}
                  />
                  <span className={isActive ? 'font-bold' : 'font-medium'}>{c.name}</span>
                  {isActive && <Check size={16} className="ml-auto" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ColorDropdown;
