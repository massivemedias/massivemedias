import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const DAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAYS_FULL_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const DAYS_FULL_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS_FR = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const DEFAULT_SETTINGS = {
  availableDays: [2, 3, 4, 5],
  startTime: '10:00',
  endTime: '18:00',
  blockedDates: [],
};

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  return `${parseInt(h)}h${m && m !== '00' ? m : ''}`;
}

export default function AvailabilityCalendar({ calendarSettings, tatoueurName }) {
  const { lang, tx } = useLang();
  const [currentDate, setCurrentDate] = useState(new Date());

  const settings = useMemo(() => ({
    ...DEFAULT_SETTINGS,
    ...(calendarSettings || {}),
  }), [calendarSettings]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const dayNames = lang === 'en' ? DAYS_EN : DAYS_FR;
  const daysFullNames = lang === 'en' ? DAYS_FULL_EN : DAYS_FULL_FR;
  const monthNames = lang === 'en' ? MONTHS_EN : MONTHS_FR;
  const today = new Date();

  const blockedSet = useMemo(() => new Set(settings.blockedDates || []), [settings.blockedDates]);

  const isAvailable = (day) => {
    if (!day) return false;
    const date = new Date(year, month, day);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    // Past days are not available
    if (date < new Date(today.getFullYear(), today.getMonth(), today.getDate())) return false;
    // Blocked dates
    if (blockedSet.has(dateStr)) return false;
    // Check day of week (0=Sunday, 1=Monday, etc.)
    const dow = date.getDay();
    return settings.availableDays.includes(dow);
  };

  const isPast = (day) => {
    if (!day) return false;
    return new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  };

  const isToday = (day) => {
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Don't allow navigating to past months
  const canGoPrev = year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth());

  // Build cells
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  // Working hours summary
  const workingDaysLabel = useMemo(() => {
    const sorted = [...settings.availableDays].sort((a, b) => a - b);
    if (sorted.length === 0) return tx({ fr: 'Aucun jour disponible', en: 'No available days' });

    // Convert to Monday-first index for display grouping
    const dayLabelsShort = lang === 'en'
      ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      : ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

    // Group consecutive days
    const groups = [];
    let groupStart = sorted[0];
    let groupEnd = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === groupEnd + 1) {
        groupEnd = sorted[i];
      } else {
        groups.push([groupStart, groupEnd]);
        groupStart = sorted[i];
        groupEnd = sorted[i];
      }
    }
    groups.push([groupStart, groupEnd]);

    return groups.map(([start, end]) => {
      if (start === end) return dayLabelsShort[start];
      return `${dayLabelsShort[start]}-${dayLabelsShort[end]}`;
    }).join(', ');
  }, [settings.availableDays, lang, tx]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="max-w-md mx-auto"
    >
      <div className="bg-black/20 rounded-xl border border-white/5 overflow-hidden backdrop-blur-sm">
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

            return (
              <div
                key={i}
                className={`relative flex flex-col items-center justify-center py-2 rounded-lg text-sm transition-colors ${
                  !day ? '' :
                  todayCell ? 'bg-accent/10 ring-1 ring-accent/30' :
                  past ? 'opacity-30' :
                  available ? 'hover:bg-green-500/10' :
                  'opacity-40'
                }`}
              >
                {day && (
                  <>
                    <span className={`text-xs font-medium ${
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

        {/* Working hours */}
        <div className="px-4 py-3 border-t border-white/5 flex items-center gap-2 text-xs text-grey-muted">
          <Clock size={14} className="text-accent flex-shrink-0" />
          <span>
            {workingDaysLabel}: {formatTime(settings.startTime)}-{formatTime(settings.endTime)}
          </span>
        </div>

        {/* Legend */}
        <div className="px-4 pb-3 flex items-center gap-4 text-[10px] text-grey-muted">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            {tx({ fr: 'Disponible', en: 'Available' })}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-grey-muted/30" />
            {tx({ fr: 'Indisponible', en: 'Unavailable' })}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
