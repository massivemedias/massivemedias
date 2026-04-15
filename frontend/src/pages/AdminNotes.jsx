import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2, Search, StickyNote, Loader2 } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import api from '../services/api';

const STORAGE_KEY = 'mm-admin-notes';

function loadLocalNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function AdminNotes() {
  const { tx } = useLang();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const saveTimeout = useRef(null);
  const inputRef = useRef(null);

  // Charger les notes depuis le CMS
  const fetchNotes = useCallback(async () => {
    try {
      const res = await api.get('/admin-notes/list');
      const cmsNotes = (res.data?.data || []).map(n => ({
        id: n.documentId,
        title: n.title || '',
        updatedAt: new Date(n.updatedAt).getTime(),
      }));
      setNotes(cmsNotes);

      // Migration localStorage -> CMS (une seule fois)
      const hasRealContent = cmsNotes.some(n => (n.title || '').trim());
      const alreadyMigrated = localStorage.getItem(STORAGE_KEY + '-migrated') === 'true';
      if (!hasRealContent && !alreadyMigrated) {
        const localNotes = loadLocalNotes();
        if (localNotes.length > 0) {
          const migrated = [];
          for (const ln of localNotes) {
            try {
              const r = await api.post('/admin-notes/create', { title: ln.title || '', body: '' });
              const created = r.data?.data;
              if (created) migrated.push({ id: created.documentId, title: created.title || '', updatedAt: Date.now() });
            } catch {}
          }
          if (migrated.length > 0) {
            setNotes(migrated);
            localStorage.setItem(STORAGE_KEY + '-migrated', 'true');
          }
        }
      }
    } catch (err) {
      // Fallback localStorage
      const localNotes = loadLocalNotes();
      setNotes(localNotes.map(n => ({ id: n.id, title: n.title || '', updatedAt: n.updatedAt || Date.now() })));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  // Sauvegarder le titre (debounced)
  const saveTitle = useCallback(async (id, title) => {
    try {
      await api.put(`/admin-notes/${id}`, { title });
    } catch (err) {
      console.error('[AdminNotes] Erreur sauvegarde:', err.message);
    }
  }, []);

  const commitEdit = useCallback((id, value) => {
    const title = value.trim();
    setNotes(prev => prev.map(n => n.id === id ? { ...n, title, updatedAt: Date.now() } : n));
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => saveTitle(id, title), 600);
    setEditingId(null);
    setEditValue('');
  }, [saveTitle]);

  const startEdit = (note) => {
    setEditingId(note.id);
    setEditValue(note.title);
    setTimeout(() => inputRef.current?.focus(), 30);
  };

  const addNote = async () => {
    try {
      const res = await api.post('/admin-notes/create', { title: '', body: '' });
      const created = res.data?.data;
      if (created) {
        const newNote = { id: created.documentId, title: '', updatedAt: Date.now() };
        setNotes(prev => [newNote, ...prev]);
        // Commencer l'edition immediate
        setEditingId(newNote.id);
        setEditValue('');
        setTimeout(() => inputRef.current?.focus(), 30);
      }
    } catch (err) {
      console.error('[AdminNotes] Erreur creation:', err.message);
    }
  };

  const deleteNote = async (id) => {
    try {
      await api.delete(`/admin-notes/${id}`);
      setNotes(prev => prev.filter(n => n.id !== id));
      if (editingId === id) { setEditingId(null); setEditValue(''); }
    } catch (err) {
      console.error('[AdminNotes] Erreur suppression:', err.message);
    }
  };

  const filtered = notes
    .filter(n => !search || (n.title || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.updatedAt - a.updatedAt);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-grey-muted">
        <Loader2 size={24} className="animate-spin mr-2" />
        {tx({ fr: 'Chargement...', en: 'Loading...', es: 'Cargando...' })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3" style={{ minHeight: 'max(600px, calc(100dvh - 220px))' }}>
      {/* Recherche + bouton nouveau */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-muted" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={tx({ fr: 'Rechercher...', en: 'Search...', es: 'Buscar...' })}
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-black/20 text-heading text-sm placeholder:text-grey-muted focus:outline-none focus:ring-1 focus:ring-accent/40"
          />
        </div>
        <button
          onClick={addNote}
          className="p-2 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition-colors"
          title={tx({ fr: 'Nouvelle note', en: 'New note', es: 'Nueva nota' })}
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Liste des notes */}
      <div className="flex-1 space-y-1 overflow-y-auto pr-1">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-grey-muted">
            <StickyNote size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {search
                ? tx({ fr: 'Aucun resultat', en: 'No results', es: 'Sin resultados' })
                : tx({ fr: 'Aucune note', en: 'No notes', es: 'Sin notas' })}
            </p>
            {!search && (
              <button onClick={addNote} className="mt-3 text-accent text-sm hover:underline">
                + {tx({ fr: 'Ajouter une note', en: 'Add a note', es: 'Agregar nota' })}
              </button>
            )}
          </div>
        )}

        {filtered.map(n => (
          <div
            key={n.id}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-black/10 hover:bg-black/20 group transition-colors"
          >
            <StickyNote size={14} className="text-grey-muted flex-shrink-0 opacity-50" />

            {editingId === n.id ? (
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onBlur={() => commitEdit(n.id, editValue)}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitEdit(n.id, editValue);
                  if (e.key === 'Escape') { setEditingId(null); setEditValue(''); }
                }}
                placeholder={tx({ fr: 'Titre de la note...', en: 'Note title...', es: 'Titulo...' })}
                className="flex-1 bg-transparent text-heading text-sm focus:outline-none placeholder:text-grey-muted/50"
              />
            ) : (
              <span
                onClick={() => startEdit(n)}
                className="flex-1 text-sm cursor-text select-none"
              >
                {n.title
                  ? <span className="text-heading">{n.title}</span>
                  : <span className="text-grey-muted italic opacity-50">{tx({ fr: 'Sans titre...', en: 'Untitled...', es: 'Sin titulo...' })}</span>}
              </span>
            )}

            <button
              onClick={() => deleteNote(n.id)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded text-red-400 hover:bg-red-400/10 transition-all flex-shrink-0"
              title={tx({ fr: 'Supprimer', en: 'Delete', es: 'Eliminar' })}
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminNotes;
