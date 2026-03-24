import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Search, StickyNote, ChevronLeft,
  Bold, Italic, List, ListOrdered, CheckSquare, Heading2, Minus, Link2,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';

const STORAGE_KEY = 'mm-admin-notes';

function loadNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveNotes(notes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function createNote() {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    title: '',
    body: '',
    updatedAt: Date.now(),
  };
}

// Barre d'outils WYSIWYG simple
function EditorToolbar({ editorRef }) {
  const exec = (cmd, val = null) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
  };

  const insertChecklist = () => {
    exec('insertHTML', '<div class="checklist-item"><input type="checkbox" onclick="this.toggleAttribute(\'checked\')" /> <span></span></div>');
  };

  const insertLink = () => {
    const url = prompt('URL:');
    if (url) exec('createLink', url);
  };

  const btns = [
    { icon: Bold, action: () => exec('bold'), title: 'Gras' },
    { icon: Italic, action: () => exec('italic'), title: 'Italique' },
    { icon: Heading2, action: () => exec('formatBlock', 'h3'), title: 'Titre' },
    { icon: Minus, action: () => exec('insertHorizontalRule'), title: 'Separateur' },
    { icon: List, action: () => exec('insertUnorderedList'), title: 'Liste' },
    { icon: ListOrdered, action: () => exec('insertOrderedList'), title: 'Liste numerotee' },
    { icon: CheckSquare, action: insertChecklist, title: 'Checklist' },
    { icon: Link2, action: insertLink, title: 'Lien' },
  ];

  return (
    <div className="flex flex-wrap gap-1 p-2 bg-black/15">
      {btns.map((b, i) => (
        <button
          key={i}
          type="button"
          onMouseDown={(e) => { e.preventDefault(); b.action(); }}
          title={b.title}
          className="p-1.5 rounded hover:bg-white/10 text-grey-muted hover:text-heading transition-colors"
        >
          <b.icon size={16} />
        </button>
      ))}
    </div>
  );
}

function AdminNotes({ embedded = false }) {
  const { tx } = useLang();
  const [notes, setNotes] = useState(loadNotes);
  const [activeId, setActiveId] = useState(null);
  const [search, setSearch] = useState('');
  const editorRef = useRef(null);
  const titleRef = useRef(null);
  const saveTimeout = useRef(null);

  // Auto-select first note on load
  useEffect(() => {
    if (!activeId && notes.length > 0) {
      const sorted = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);
      setActiveId(sorted[0].id);
    }
  }, [notes.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeNote = notes.find(n => n.id === activeId) || null;

  // Sauvegarder a chaque changement
  useEffect(() => { saveNotes(notes); }, [notes]);

  // Quand on selectionne une note, mettre le contenu dans l'editeur
  useEffect(() => {
    if (activeNote && editorRef.current) {
      editorRef.current.innerHTML = activeNote.body;
    }
  }, [activeId]);

  const updateNote = useCallback((id, updates) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n));
  }, []);

  const handleBodyChange = useCallback(() => {
    if (!activeId || !editorRef.current) return;
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      updateNote(activeId, { body: editorRef.current.innerHTML });
    }, 300);
  }, [activeId, updateNote]);

  const addNote = () => {
    const n = createNote();
    setNotes(prev => [n, ...prev]);
    setActiveId(n.id);
    setTimeout(() => titleRef.current?.focus(), 50);
  };

  const deleteNote = (id) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const filtered = notes
    .filter(n => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (n.title || '').toLowerCase().includes(s) || (n.body || '').toLowerCase().includes(s);
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const containerClass = embedded
    ? ''
    : '';

  return (
    <div className={`${containerClass}`}>
      <div className="flex flex-col lg:flex-row gap-4 min-h-[500px]">
        {/* Liste des notes (sidebar) */}
        <div className={`${activeNote && !embedded ? 'hidden lg:block' : ''} lg:w-72 flex-shrink-0`}>
          {/* Recherche + bouton nouveau */}
          <div className="flex gap-2 mb-3">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-muted" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={tx({ fr: 'Rechercher...', en: 'Search...', es: 'Buscar...' })}
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-black/20 text-heading text-sm placeholder:text-grey-muted focus:outline-none"
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

          {/* Liste */}
          <div className="space-y-1 max-h-[450px] overflow-y-auto pr-1 scrollbar-thin">
            {filtered.length === 0 && (
              <div className="text-center py-8 text-grey-muted text-sm">
                <StickyNote size={32} className="mx-auto mb-2 opacity-40" />
                {tx({ fr: 'Aucune note', en: 'No notes', es: 'Sin notas' })}
              </div>
            )}
            {filtered.map(n => (
              <button
                key={n.id}
                onClick={() => setActiveId(n.id)}
                className={`w-full text-left p-3 rounded-lg transition-all text-sm group ${
                  activeId === n.id
                    ? 'bg-accent/15'
                    : 'bg-black/10 hover:bg-black/20'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className={`font-medium truncate text-sm ${activeId === n.id ? 'text-accent' : 'text-heading'}`} style={{ fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif" }}>
                      {n.title || tx({ fr: 'Sans titre', en: 'Untitled', es: 'Sin titulo' })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNote(n.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-red-400 hover:bg-red-400/10 transition-all flex-shrink-0"
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Editeur */}
        <div className="flex-1 min-w-0">
          {activeNote ? (
            <div className="rounded-xl bg-black/10 overflow-hidden flex flex-col h-full min-h-[450px]">
              {/* Bouton retour mobile */}
              <div className="lg:hidden flex items-center gap-2 p-2 bg-black/10">
                <button
                  onClick={() => setActiveId(null)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-grey-muted"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-xs text-grey-muted">
                  {tx({ fr: 'Retour aux notes', en: 'Back to notes', es: 'Volver a notas' })}
                </span>
              </div>

              {/* Titre */}
              <input
                ref={titleRef}
                type="text"
                value={activeNote.title}
                onChange={(e) => updateNote(activeId, { title: e.target.value })}
                placeholder={tx({ fr: 'Titre de la note...', en: 'Note title...', es: 'Titulo de la nota...' })}
                className="w-full px-4 py-3 bg-transparent text-heading text-xl font-normal placeholder:text-grey-muted/50 focus:outline-none"
                style={{ fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif" }}
              />

              {/* Toolbar WYSIWYG */}
              <EditorToolbar editorRef={editorRef} />

              {/* Editeur contentEditable */}
              <div
                ref={editorRef}
                contentEditable
                onInput={handleBodyChange}
                style={{ fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif" }}
                className="flex-1 p-4 text-body text-sm leading-relaxed focus:outline-none overflow-y-auto prose-invert prose-sm max-w-none
                  [&_h3]:text-heading [&_h3]:font-heading [&_h3]:font-bold [&_h3]:text-base [&_h3]:mt-3 [&_h3]:mb-1
                  [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4
                  [&_a]:text-accent [&_a]:underline
                  [&_hr]:border-white/10 [&_hr]:my-3
                  [&_.checklist-item]:flex [&_.checklist-item]:items-start [&_.checklist-item]:gap-2 [&_.checklist-item]:my-1
                  [&_input[type=checkbox]]:mt-1 [&_input[type=checkbox]]:accent-accent
                "
                suppressContentEditableWarning
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full min-h-[300px] text-grey-muted">
              <div className="text-center">
                <StickyNote size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">{tx({ fr: 'Sélectionne ou crée une note', en: 'Select or create a note', es: 'Selecciona o crea una nota' })}</p>
                <button onClick={addNote} className="mt-3 text-accent text-sm hover:underline">
                  + {tx({ fr: 'Nouvelle note', en: 'New note', es: 'Nueva nota' })}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminNotes;
