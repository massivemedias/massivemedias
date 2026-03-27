import { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Save, Trash2, Clock, Calendar, Check } from 'lucide-react';
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

export default function TatoueurCalendar({ tatoueur }) {
  const { lang, tx } = useLang();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null); // dateKey of the day being edited
  const [dirty, setDirty] = useState(false);

  // Load available dates from CMS or localStorage
  const initial = tatoueur?.calendarSettings || {};
  const localCalendar = (() => {
    try {
      const slug = tatoueur?.slug;
      if (!slug) return null;
      const raw = localStorage.getItem(`mm-tatoueur-calendar-${slug}`);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  })();
  const [availableDates, setAvailableDates] = useState(
    initial.availableDates?.length > 0 ? initial.availableDates : (localCalendar?.availableDates || [])
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const dayNames = lang === 'en' ? DAYS_EN : DAYS_FR;
  const daysFullNames = lang === 'en' ? DAYS_FULL_EN : DAYS_FULL_FR;
  const monthNames = lang === 'en' ? MONTHS_EN : MONTHS_FR;
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Build available dates map
  const availableMap = useMemo(() => {
    const map = {};
    for (const entry of availableDates) {
      map[entry.date] = entry.slots || [];
    }
    return map;
  }, [availableDates]);

  // Fetch calendar events
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

  // Click on a day to select it for slot editing
  const handleDayClick = useCallback((day) => {
    if (!day) return;
    const dateKey = formatDateKey(year, month, day);
    if (dateKey < todayKey) return; // Can't select past dates

    if (selectedDay === dateKey) {
      setSelectedDay(null);
    } else {
      setSelectedDay(dateKey);
    }
  }, [year, month, todayKey, selectedDay]);

  // Toggle a date's availability (quick toggle without slots - adds default slots)
  const toggleDateAvailability = useCallback((dateKey) => {
    if (availableMap[dateKey]) {
      // Remove this date
      setAvailableDates(prev => prev.filter(d => d.date !== dateKey));
    } else {
      // Add with default slots (10h-18h)
      setAvailableDates(prev => [...prev, { date: dateKey, slots: ['10h', '11h', '13h', '14h', '15h', '16h', '17h'] }].sort((a, b) => a.date.localeCompare(b.date)));
    }
    setDirty(true);
  }, [availableMap]);

  // Toggle a specific slot for the selected day
  const toggleSlot = useCallback((dateKey, slot) => {
    const existing = availableDates.find(d => d.date === dateKey);
    if (existing) {
      const hasSlot = existing.slots.includes(slot);
      if (hasSlot) {
        const newSlots = existing.slots.filter(s => s !== slot);
        if (newSlots.length === 0) {
          setAvailableDates(prev => prev.filter(d => d.date !== dateKey));
        } else {
          setAvailableDates(prev => prev.map(d => d.date === dateKey ? { ...d, slots: newSlots } : d));
        }
      } else {
        setAvailableDates(prev => prev.map(d => d.date === dateKey ? { ...d, slots: [...d.slots, slot].sort() } : d));
      }
    } else {
      setAvailableDates(prev => [...prev, { date: dateKey, slots: [slot] }].sort((a, b) => a.date.localeCompare(b.date)));
    }
    setDirty(true);
  }, [availableDates]);

  // Remove a full date
  const removeDate = useCallback((dateKey) => {
    setAvailableDates(prev => prev.filter(d => d.date !== dateKey));
    if (selectedDay === dateKey) setSelectedDay(null);
    setDirty(true);
  }, [selectedDay]);

  // Save
  const handleSave = async () => {
    setSaving(true);
    try {
      if (tatoueur?.documentId) {
        await api.put(`/tatoueurs/${tatoueur.documentId}`, {
          data: { calendarSettings: { availableDates } },
        });
      }
      const slug = tatoueur?.slug;
      if (slug) {
        localStorage.setItem(`mm-tatoueur-calendar-${slug}`, JSON.stringify({ availableDates }));
      }
      setSaved(true);
      setDirty(false);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('[CalendarSettings] Erreur CMS:', err.message);
      const slug = tatoueur?.slug;
      if (slug) {
        localStorage.setItem(`mm-tatoueur-calendar-${slug}`, JSON.stringify({ availableDates }));
        setSaved(true);
        setDirty(false);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  };

  const formatDateLabel = (dateStr) => {
    const d = new Date(dateStr + 'T12:00:00');
    const dayName = daysFullNames[d.getDay()];
    const day = d.getDate();
    const m = monthNames[d.getMonth()];
    return `${dayName} ${day} ${m}`;
  };

  // Future dates only for the list
  const futureDates = availableDates.filter(d => d.date >= todayKey).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      {/* ============ CALENDAR ============ */}
      <div className="bg-bg-card rounded-xl border border-white/5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-bg-elevated text-grey-muted hover:text-heading transition-colors">
            <ChevronLeft size={20} />
          </button>
          <h3 className="text-lg font-heading font-bold text-heading capitalize">{monthNames[month]} {year}</h3>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-bg-elevated text-grey-muted hover:text-heading transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Instruction */}
        <div className="px-4 py-2 bg-accent/5 border-b border-white/5">
          <p className="text-xs text-accent/80 text-center">
            {tx({
              fr: 'Clique sur un jour pour gerer tes creneaux. Double-clique pour activer/desactiver rapidement.',
              en: 'Click a day to manage slots. Double-click to quickly toggle availability.',
              es: 'Haz clic en un dia para gestionar horarios. Doble clic para activar/desactivar.'
            })}
          </p>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-white/5">
          {dayNames.map(d => (
            <div key={d} className="py-2.5 text-center text-xs font-bold text-grey-muted uppercase">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 p-1.5 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={i} className="min-h-[64px]" />;

            const dateKey = formatDateKey(year, month, day);
            const isPast = dateKey < todayKey;
            const isToday = dateKey === todayKey;
            const isSelected = selectedDay === dateKey;
            const available = !!availableMap[dateKey];
            const slots = availableMap[dateKey] || [];
            const dayEvents = getDateEvents(day);

            return (
              <div
                key={i}
                onClick={() => !isPast && handleDayClick(day)}
                onDoubleClick={() => !isPast && toggleDateAvailability(dateKey)}
                className={`min-h-[64px] p-1.5 rounded-xl text-xs cursor-pointer transition-all select-none ${
                  isPast ? 'opacity-30 cursor-not-allowed' :
                  isSelected ? 'ring-2 ring-accent bg-accent/10 scale-[1.02]' :
                  available ? 'bg-green-500/10 hover:bg-green-500/15 border border-green-500/20' :
                  'hover:bg-bg-elevated/80 border border-transparent hover:border-white/5'
                } ${isToday ? 'ring-1 ring-accent/40' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-bold text-[13px] ${
                    isToday ? 'text-accent' :
                    available ? 'text-green-400' :
                    'text-heading'
                  }`}>
                    {day}
                  </span>
                  {available && (
                    <span className="flex items-center gap-0.5 text-[9px] text-green-400 font-medium">
                      <Check size={10} />
                      {slots.length}
                    </span>
                  )}
                </div>
                {/* Show events */}
                {dayEvents.map((evt, j) => (
                  <div key={j} className={`mt-0.5 px-1 py-0.5 rounded text-[8px] text-white truncate ${
                    evt.type === 'rendez-vous' ? 'bg-green-600' :
                    evt.type === 'flash-day' ? 'bg-accent' :
                    evt.type === 'conge' ? 'bg-red-500' : 'bg-blue-500'
                  }`}>
                    {evt.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 px-4 py-3 border-t border-white/5 text-[10px] text-grey-muted">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-green-500/20 border border-green-500/30" />
            {tx({ fr: 'Disponible', en: 'Available', es: 'Disponible' })}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-accent/20 border border-accent/30" />
            {tx({ fr: "Aujourd'hui", en: 'Today', es: 'Hoy' })}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded ring-2 ring-accent" />
            {tx({ fr: 'Selectionne', en: 'Selected', es: 'Seleccionado' })}
          </span>
        </div>
      </div>

      {/* ============ SLOT EDITOR (when a day is selected) ============ */}
      {selectedDay && (
        <div className="bg-bg-card rounded-xl border border-accent/20 overflow-hidden animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between p-4 border-b border-white/5 bg-accent/5">
            <h4 className="text-sm font-heading font-bold text-heading flex items-center gap-2">
              <Clock size={16} className="text-accent" />
              {formatDateLabel(selectedDay)}
            </h4>
            <button
              onClick={() => setSelectedDay(null)}
              className="p-1.5 rounded-lg hover:bg-bg-elevated text-grey-muted hover:text-heading transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <div className="p-4 space-y-3">
            <p className="text-xs text-grey-muted">
              {tx({
                fr: 'Selectionne les creneaux disponibles pour cette journee:',
                en: 'Select available time slots for this day:',
                es: 'Selecciona los horarios disponibles para este dia:'
              })}
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
              {SLOT_OPTIONS.map(slot => {
                const isActive = availableMap[selectedDay]?.includes(slot);
                return (
                  <button
                    key={slot}
                    onClick={() => toggleSlot(selectedDay, slot)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30 shadow-sm shadow-green-500/10'
                        : 'bg-black/20 text-grey-muted border border-white/5 hover:border-white/15 hover:text-heading'
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
            {availableMap[selectedDay]?.length > 0 && (
              <button
                onClick={() => removeDate(selectedDay)}
                className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors mt-2"
              >
                <Trash2 size={12} />
                {tx({
                  fr: 'Supprimer tous les creneaux de cette date',
                  en: 'Remove all slots for this date',
                  es: 'Eliminar todos los horarios de esta fecha'
                })}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ============ SAVE BUTTON ============ */}
      <button
        onClick={handleSave}
        disabled={saving || (!dirty && !saved)}
        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
          saved ? 'bg-green-500/20 text-green-400 border border-green-500/20' :
          dirty ? 'bg-accent/20 text-accent hover:bg-accent/30 border border-accent/20 animate-pulse' :
          'bg-bg-card text-grey-muted border border-white/5 opacity-50 cursor-not-allowed'
        }`}
      >
        <Save size={16} />
        {saved
          ? tx({ fr: 'Sauvegarde!', en: 'Saved!', es: 'Guardado!' })
          : saving
          ? '...'
          : dirty
          ? tx({ fr: 'Sauvegarder les changements', en: 'Save changes', es: 'Guardar cambios' })
          : tx({ fr: 'Aucun changement', en: 'No changes', es: 'Sin cambios' })
        }
      </button>

      {/* ============ DATE LIST ============ */}
      <div className="bg-bg-card rounded-xl border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h3 className="flex items-center gap-2 text-sm font-heading font-bold text-heading">
            <Calendar size={16} className="text-accent" />
            {tx({ fr: 'Mes disponibilites', en: 'My availability', es: 'Mis disponibilidades' })}
            {futureDates.length > 0 && (
              <span className="ml-auto text-xs font-normal text-grey-muted bg-bg-elevated px-2 py-0.5 rounded-full">
                {futureDates.length} {tx({ fr: 'dates', en: 'dates', es: 'fechas' })}
              </span>
            )}
          </h3>
        </div>

        {futureDates.length > 0 ? (
          <div className="divide-y divide-white/5">
            {futureDates.map(entry => (
              <div
                key={entry.date}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-bg-elevated/50 transition-colors ${
                  selectedDay === entry.date ? 'bg-accent/5' : ''
                }`}
              >
                {/* Date badge */}
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-green-400 uppercase leading-none">
                    {(() => {
                      const d = new Date(entry.date + 'T12:00:00');
                      return (lang === 'en' ? DAYS_EN : DAYS_FR)[d.getDay() === 0 ? 6 : d.getDay() - 1];
                    })()}
                  </span>
                  <span className="text-lg font-bold text-green-400 leading-none mt-0.5">
                    {new Date(entry.date + 'T12:00:00').getDate()}
                  </span>
                </div>

                {/* Date info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-heading">{formatDateLabel(entry.date)}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {entry.slots.map(slot => (
                      <span
                        key={slot}
                        className="flex items-center gap-0.5 bg-green-500/10 text-green-400 text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                      >
                        <Clock size={8} />
                        {slot}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => {
                      // Navigate to the month and select the day
                      const d = new Date(entry.date + 'T12:00:00');
                      setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
                      setSelectedDay(entry.date);
                    }}
                    className="p-2 rounded-lg hover:bg-accent/10 text-grey-muted hover:text-accent transition-colors"
                    title={tx({ fr: 'Modifier', en: 'Edit', es: 'Editar' })}
                  >
                    <Clock size={14} />
                  </button>
                  <button
                    onClick={() => removeDate(entry.date)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-grey-muted hover:text-red-400 transition-colors"
                    title={tx({ fr: 'Supprimer', en: 'Delete', es: 'Eliminar' })}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-grey-muted">
            <Calendar size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">
              {tx({
                fr: 'Aucune disponibilite configuree',
                en: 'No availability configured',
                es: 'No hay disponibilidad configurada'
              })}
            </p>
            <p className="text-xs mt-1 opacity-60">
              {tx({
                fr: 'Clique sur les jours du calendrier pour ajouter des creneaux',
                en: 'Click on calendar days to add time slots',
                es: 'Haz clic en los dias del calendario para agregar horarios'
              })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
