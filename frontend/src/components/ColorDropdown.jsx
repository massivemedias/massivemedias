import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Elegant color dropdown selector with swatch + name list.
 * Styled like a native select but with color previews.
 */
function ColorDropdown({ colors, selected, onChange, label }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);
  const listRef = useRef(null);
  const searchRef = useRef(null);

  const current = colors.find(c => c.id === selected) || colors[0];

  const filtered = search
    ? colors.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : colors;

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search + scroll to selected item when opening (without moving the page)
  useEffect(() => {
    if (open) {
      if (searchRef.current) searchRef.current.focus({ preventScroll: true });
      if (listRef.current) {
        const active = listRef.current.querySelector('[data-active="true"]');
        if (active) {
          const list = listRef.current;
          list.scrollTop = active.offsetTop - list.offsetHeight / 2 + active.offsetHeight / 2;
        }
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
        onClick={() => { setOpen(!open); setSearch(''); }}
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
          {/* Search */}
          <div className="p-2.5 border-b border-gray-100">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-800 placeholder:text-gray-400 focus:border-accent/60 focus:outline-none transition-colors"
              ref={searchRef}
            />
          </div>

          {/* Color list */}
          <div ref={listRef} className="max-h-64 overflow-y-auto overscroll-contain py-1">
            {filtered.map(c => {
              const isActive = selected === c.id;
              return (
                <button
                  key={c.id}
                  data-active={isActive}
                  onClick={() => { onChange(c.id); setOpen(false); setSearch(''); }}
                  className={`w-full flex items-center gap-3 py-2 px-3.5 text-left text-sm transition-colors ${
                    isActive
                      ? 'bg-accent/10 text-gray-900 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: c.hex, boxShadow: `0 0 0 1px rgba(0,0,0,0.1)` }}
                  />
                  <span className={isActive ? 'font-medium' : ''}>{c.name}</span>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-gray-400 text-xs py-4 text-center">-</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ColorDropdown;
