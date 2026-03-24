import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const DAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS_FR = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS_LONG_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const DAYS_LONG_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
 * Calendrier public de disponibilites du tatoueur.
 *
 * calendarSettings.availableDates = [
 *   { date: "2026-04-29", slots: ["13h"] },
 *   { date: "2026-05-05", slots: ["11h", "15h", "18h"] },
 * ]
 *
 * Fallback: si availableDays (ancien format) est present, on l'utilise aussi.
 */
export default function AvailabilityCalendar({ calendarSettings }) {
  const { lang, tx } = useLang();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [view, setView] = useState('calendar'); // 'calendar' | 'list'

  const settings = calendarSettings || {};
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const dayNames = lang === 'en' ? DAYS_EN : DAYS_FR;
  const monthNames = lang === 'en' ? MONTHS_EN : MONTHS_FR;
  const daysLong = lang === 'en' ? DAYS_LONG_EN : DAYS_LONG_FR;
  const today = new Date();

  // Build a map of available dates -> slots
  const availableMap = useMemo(() => {
    const map = {};
    // New format: specific dates with slots
    if (settings.availableDates?.length > 0) {
      for (const entry of settings.availableDates) {
        map[entry.date] = entry.slots || [];
      }
    }
    // Fallback: old format with availableDays (weekly recurring)
    if (settings.availableDays?.length > 0 && !settings.availableDates?.length) {
      const startTime = settings.startTime || '10:00';
      const endTime = settings.endTime || '18:00';
      const slots = [`${parseInt(startTime)}h-${parseInt(endTime)}h`];
      // Generate dates for next 3 months
      const start = new Date();
      for (let i = 0; i < 90; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        if (settings.availableDays.includes(d.getDay())) {
          const key = formatDateKey(d.getFullYear(), d.getMonth(), d.getDate());
          if (!settings.blockedDates?.includes(key)) {
            map[key] = slots;
          }
        }
      }
    }
    return map;
  }, [settings]);

  const isAvailable = (day) => {
    if (!day) return false;
    const date = new Date(year, month, day);
    if (date < new Date(today.getFullYear(), today.getMonth(), today.getDate())) return false;
    const key = formatDateKey(year, month, day);
    return !!availableMap[key];
  };

  const getSlots = (day) => {
    const key = formatDateKey(year, month, day);
    return availableMap[key] || [];
  };

  const isPast = (day) => {
    if (!day) return false;
    return new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  };

  const isToday = (day) => {
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  const prevMonth = () => { setCurrentDate(new Date(year, month - 1, 1)); setSelectedDay(null); };
  const nextMonth = () => { setCurrentDate(new Date(year, month + 1, 1)); setSelectedDay(null); };
  const canGoPrev = year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth());

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  // Count available dates this month
  const availableThisMonth = cells.filter(d => d && isAvailable(d)).length;

  // Selected day info
  const selectedDate = selectedDay ? new Date(year, month, selectedDay) : null;
  const selectedSlots = selectedDay ? getSlots(selectedDay) : [];

  // Upcoming dates list
  const todayStr = new Date().toISOString().split('T')[0];
  const upcoming = Object.entries(availableMap)
    .filter(([date]) => date >= todayStr)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, 12);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="max-w-md mx-auto"
    >
      <div className="bg-black/20 rounded-xl border border-white/5 overflow-hidden backdrop-blur-sm">
        {/* Tabs */}
        <div className="flex border-b border-white/5">
          <button
            onClick={() => setView('calendar')}
            className={`flex-1 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
              view === 'calendar' ? 'text-accent border-b-2 border-accent bg-accent/5' : 'text-grey-muted hover:text-heading'
            }`}
          >
            {tx({ fr: 'Calendrier', en: 'Calendar', es: 'Calendario' })}
          </button>
          <button
            onClick={() => setView('list')}
            className={`flex-1 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
              view === 'list' ? 'text-accent border-b-2 border-accent bg-accent/5' : 'text-grey-muted hover:text-heading'
            }`}
          >
            {tx({ fr: 'Prochaines dates', en: 'Upcoming dates', es: 'Proximas fechas' })}
            {upcoming.length > 0 && (
              <span className="ml-1.5 bg-green-500/20 text-green-400 text-[10px] px-1.5 py-0.5 rounded-full">{upcoming.length}</span>
            )}
          </button>
        </div>

        {/* Calendar view */}
        {view === 'calendar' && (
          <>
            {/* Month navigation */}
            <div className="flex items-center justify-between p-3 border-b border-white/5">
              <button
                onClick={prevMonth}
                disabled={!canGoPrev}
                className={`p-1.5 rounded-lg transition-colors ${canGoPrev ? 'hover:bg-bg-elevated text-grey-muted hover:text-heading' : 'text-grey-muted/30 cursor-not-allowed'}`}
              >
                <ChevronLeft size={18} />
              </button>
              <h3 className="text-sm font-heading font-bold text-heading capitalize">
                {monthNames[month]} {year}
              </h3>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg hover:bg-bg-elevated transition-colors text-grey-muted hover:text-heading"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-white/5">
              {dayNames.map(d => (
                <div key={d} className="py-1.5 text-center text-[10px] font-bold text-grey-muted uppercase tracking-wider">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 p-1 gap-0.5">
              {cells.map((day, i) => {
                const available = isAvailable(day);
                const past = isPast(day);
                const todayCell = isToday(day);
                const selected = day === selectedDay;

                return (
                  <div
                    key={i}
                    onClick={() => { if (day && available && !past) setSelectedDay(day === selectedDay ? null : day); }}
                    className={`relative flex flex-col items-center justify-center py-2 rounded-lg text-sm transition-colors ${
                      !day ? '' :
                      selected ? 'bg-green-500/20 ring-1 ring-green-500/50 cursor-pointer' :
                      todayCell ? 'bg-accent/10 ring-1 ring-accent/30' :
                      past ? 'opacity-30' :
                      available ? 'hover:bg-green-500/10 cursor-pointer' :
                      'opacity-40'
                    }`}
                  >
                    {day && (
                      <>
                        <span className={`text-xs font-medium ${
                          selected ? 'text-green-400 font-bold' :
                          todayCell ? 'text-accent font-bold' :
                          past ? 'text-grey-muted' :
                          available ? 'text-heading' :
                          'text-grey-muted'
                        }`}>
                          {day}
                        </span>
                        {available && !past && (
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-0.5" />
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Selected day slots */}
            {selectedDay && selectedSlots.length > 0 && (
              <div className="px-4 py-3 border-t border-white/5">
                <div className="text-xs text-grey-muted mb-2">
                  {daysLong[selectedDate.getDay()]} {selectedDay} {monthNames[month]}
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedSlots.map((slot, i) => (
                    <span key={i} className="flex items-center gap-1 bg-green-500/15 text-green-400 text-xs font-semibold px-3 py-1.5 rounded-full">
                      <Clock size={12} />
                      {slot}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between text-[10px] text-grey-muted">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  {tx({ fr: 'Disponible', en: 'Available', es: 'Disponible' })}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-grey-muted/30" />
                  {tx({ fr: 'Indisponible', en: 'Unavailable', es: 'No disponible' })}
                </span>
              </div>
              {availableThisMonth > 0 && (
                <span className="text-green-400 font-semibold">
                  {availableThisMonth} {tx({ fr: 'dispo', en: 'avail.', es: 'disp.' })}
                </span>
              )}
            </div>
          </>
        )}

        {/* List view */}
        {view === 'list' && (
          <>
            {upcoming.length === 0 ? (
              <div className="px-4 py-8 text-center text-grey-muted text-sm">
                {tx({ fr: 'Aucune disponibilite programmee', en: 'No availability scheduled', es: 'Sin disponibilidades programadas' })}
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {upcoming.map(([dateStr, slots]) => {
                  const d = new Date(dateStr + 'T12:00:00');
                  const dayName = daysLong[d.getDay()];
                  const day = d.getDate();
                  const mo = monthNames[d.getMonth()];
                  return (
                    <div key={dateStr} className="px-4 py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                        <span className="text-sm text-heading font-medium">
                          {dayName} {day} {mo}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {slots.map((slot, i) => (
                          <span key={i} className="text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full font-medium">
                            {slot}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
