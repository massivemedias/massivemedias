import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Settings, Save, Trash2, Clock, Calendar } from 'lucide-react';
import { useLang } from '../../i18n/LanguageContext';
import api from '../../services/api';

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const DAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAYS_FULL_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const DAYS_FULL_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS_FR = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const SLOT_OPTIONS = ['9h', '10h', '11h', '12h', '13h', '14h', '15h', '16h', '17h', '18h', '19h', '20h'];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function formatDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Panneau config disponibilites du tatoueur.
 * Le tatoueur ajoute des dates specifiques avec des creneaux horaires.
 */
function CalendarSettingsPanel({ tatoueur, tx, lang }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const initial = tatoueur?.calendarSettings || {};
  const [availableDates, setAvailableDates] = useState(initial.availableDates || []);
  const [newDate, setNewDate] = useState('');
  const [newSlots, setNewSlots] = useState([]);

  const daysFullNames = lang === 'en' ? DAYS_FULL_EN : DAYS_FULL_FR;
  const monthNames = lang === 'en' ? MONTHS_EN : MONTHS_FR;

  const toggleSlot = (slot) => {
    setNewSlots(prev => prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot].sort());
  };

  const addDate = () => {
    if (!newDate || newSlots.length === 0) return;
    // Check if date already exists
    const existing = availableDates.findIndex(d => d.date === newDate);
    if (existing >= 0) {
      // Merge slots
      const merged = [...new Set([...availableDates[existing].slots, ...newSlots])].sort();
      setAvailableDates(prev => prev.map((d, i) => i === existing ? { ...d, slots: merged } : d));
    } else {
      setAvailableDates(prev => [...prev, { date: newDate, slots: [...newSlots] }].sort((a, b) => a.date.localeCompare(b.date)));
    }
    setNewDate('');
    setNewSlots([]);
  };

  const removeDate = (date) => {
    setAvailableDates(prev => prev.filter(d => d.date !== date));
  };

  const removeSlot = (date, slot) => {
    setAvailableDates(prev => prev.map(d => {
      if (d.date !== date) return d;
      const slots = d.slots.filter(s => s !== slot);
      return slots.length > 0 ? { ...d, slots } : null;
    }).filter(Boolean));
  };

  const handleSave = async () => {
    if (!tatoueur?.documentId) return;
    setSaving(true);
    try {
      await api.put(`/tatoueurs/${tatoueur.documentId}`, {
        data: {
          calendarSettings: { availableDates },
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('[CalendarSettings] Erreur:', err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatDateLabel = (dateStr) => {
    const d = new Date(dateStr + 'T12:00:00');
    const dayName = daysFullNames[d.getDay()];
    const day = d.getDate();
    const month = monthNames[d.getMonth()];
    return `${dayName} ${day} ${month}`;
  };

  // Filter out past dates
  const today = new Date().toISOString().split('T')[0];
  const futureDates = availableDates.filter(d => d.date >= today);

  return (
    <div className="bg-bg-card rounded-xl border border-white/5 overflow-hidden mb-6">
      <div className="p-4 space-y-5">
        <h3 className="flex items-center gap-2 text-sm font-heading font-bold text-heading">
          <Calendar size={18} className="text-accent" />
          {tx({ fr: 'Gerer mes disponibilites', en: 'Manage my availability', es: 'Gestionar mis disponibilidades' })}
        </h3>

        {/* Add new date */}
        <div className="bg-bg-elevated rounded-xl p-4 space-y-3">
          <label className="block text-xs font-bold text-grey-muted uppercase tracking-wider">
            {tx({ fr: 'Ajouter une date', en: 'Add a date', es: 'Agregar una fecha' })}
          </label>
          <input
            type="date"
            value={newDate}
            min={today}
            onChange={e => setNewDate(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-heading focus:border-accent focus:outline-none"
          />

          {newDate && (
            <>
              <label className="block text-xs font-bold text-grey-muted uppercase tracking-wider">
                {tx({ fr: 'Creneaux horaires', en: 'Time slots', es: 'Horarios' })}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SLOT_OPTIONS.map(slot => (
                  <button
                    key={slot}
                    onClick={() => toggleSlot(slot)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      newSlots.includes(slot)
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-black/20 text-grey-muted border border-white/5 hover:border-white/10'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
              <button
                onClick={addDate}
                disabled={newSlots.length === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium hover:bg-green-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Plus size={16} />
                {tx({ fr: 'Ajouter', en: 'Add', es: 'Agregar' })}
              </button>
            </>
          )}
        </div>

        {/* List of available dates */}
        {futureDates.length > 0 && (
          <div className="space-y-2">
            <label className="block text-xs font-bold text-grey-muted uppercase tracking-wider">
              {tx({ fr: 'Dates disponibles', en: 'Available dates', es: 'Fechas disponibles' })} ({futureDates.length})
            </label>
            {futureDates.map(entry => (
              <div key={entry.date} className="flex items-center gap-2 bg-bg-elevated rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-heading">{formatDateLabel(entry.date)}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {entry.slots.map(slot => (
                      <span
                        key={slot}
                        onClick={() => removeSlot(entry.date, slot)}
                        className="flex items-center gap-1 bg-green-500/15 text-green-400 text-[10px] font-semibold px-2 py-0.5 rounded-full cursor-pointer hover:bg-red-500/15 hover:text-red-400 transition-colors"
                        title={tx({ fr: 'Cliquer pour retirer', en: 'Click to remove' })}
                      >
                        <Clock size={10} />
                        {slot}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => removeDate(entry.date)}
                  className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {futureDates.length === 0 && (
          <div className="text-center py-6 text-grey-muted text-sm">
            <Calendar size={32} className="mx-auto mb-2 opacity-30" />
            {tx({ fr: 'Aucune date disponible configuree', en: 'No available dates configured', es: 'No hay fechas disponibles configuradas' })}
          </div>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors ${
            saved ? 'bg-green-500/20 text-green-400' : 'bg-accent/20 text-accent hover:bg-accent/30'
          } disabled:opacity-50`}
        >
          <Save size={16} />
          {saved ? tx({ fr: 'Sauvegarde!', en: 'Saved!', es: 'Guardado!' }) : saving ? '...' : tx({ fr: 'Sauvegarder', en: 'Save', es: 'Guardar' })}
        </button>
      </div>
    </div>
  );
}

export default function TatoueurCalendar({ tatoueur }) {
  const { lang, tx } = useLang();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const dayNames = lang === 'en' ? DAYS_EN : DAYS_FR;
  const monthNames = lang === 'en' ? MONTHS_EN : MONTHS_FR;
  const today = new Date();

  // Build available dates map
  const settings = tatoueur?.calendarSettings || {};
  const availableMap = useMemo(() => {
    const map = {};
    if (settings.availableDates?.length > 0) {
      for (const entry of settings.availableDates) {
        map[entry.date] = entry.slots || [];
      }
    }
    return map;
  }, [settings]);

  useEffect(() => {
    if (!tatoueur?.documentId) return;
    api.get('/calendar-events', {
      params: {
        filters: { tatoueur: { documentId: { $eq: tatoueur.documentId } } },
        populate: '*',
        sort: 'startTime:asc',
      },
    }).then(res => {
      setEvents(res.data?.data || []);
    }).catch(() => {});
  }, [tatoueur?.documentId]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const getDateEvents = (day) => {
    if (!day) return [];
    const dateStr = formatDateKey(year, month, day);
    return events.filter(e => e.startTime?.startsWith(dateStr));
  };

  const isAvailable = (day) => {
    if (!day) return false;
    const key = formatDateKey(year, month, day);
    return !!availableMap[key];
  };

  return (
    <div className="space-y-6">
      {/* Settings panel */}
      <CalendarSettingsPanel tatoueur={tatoueur} tx={tx} lang={lang} />

      {/* Calendar view */}
      <div className="bg-bg-card rounded-xl border border-white/5 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-bg-elevated text-grey-muted hover:text-heading transition-colors">
            <ChevronLeft size={18} />
          </button>
          <h3 className="text-base font-heading font-bold text-heading capitalize">{monthNames[month]} {year}</h3>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-bg-elevated text-grey-muted hover:text-heading transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 border-b border-white/5">
          {dayNames.map(d => (
            <div key={d} className="py-2 text-center text-xs font-bold text-grey-muted uppercase">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 p-1 gap-0.5">
          {cells.map((day, i) => {
            const dayEvents = getDateEvents(day);
            const available = isAvailable(day);
            const isCurrentDay = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

            return (
              <div
                key={i}
                className={`min-h-[60px] p-1 rounded-lg text-xs ${
                  !day ? '' :
                  isCurrentDay ? 'bg-accent/10 ring-1 ring-accent/30' :
                  available ? 'bg-green-500/5' :
                  'hover:bg-bg-elevated/50'
                }`}
              >
                {day && (
                  <>
                    <div className="flex items-center gap-1">
                      <span className={`font-medium ${isCurrentDay ? 'text-accent' : 'text-heading'}`}>{day}</span>
                      {available && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                    </div>
                    {dayEvents.map((evt, j) => (
                      <div key={j} className={`mt-0.5 px-1 py-0.5 rounded text-[9px] text-white truncate ${
                        evt.type === 'rendez-vous' ? 'bg-green-600' :
                        evt.type === 'flash-day' ? 'bg-accent' :
                        evt.type === 'conge' ? 'bg-red-500' : 'bg-blue-500'
                      }`}>
                        {evt.title}
                      </div>
                    ))}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
