import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { useLang } from '../../i18n/LanguageContext';
import api from '../../services/api';

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const DAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS_FR = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const EVENT_COLORS = {
  'rendez-vous': 'bg-green-500',
  'flash-day': 'bg-accent',
  'conge': 'bg-red-500',
  'personnel': 'bg-blue-500',
  'bloque': 'bg-gray-500',
};

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
}

export default function TatoueurCalendar({ tatoueur }) {
  const { lang, tx } = useLang();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const dayNames = lang === 'en' ? DAYS_EN : DAYS_FR;
  const monthNames = lang === 'en' ? MONTHS_EN : MONTHS_FR;

  useEffect(() => {
    async function fetchEvents() {
      if (!tatoueur?.documentId) { setLoading(false); return; }
      try {
        const startDate = new Date(year, month, 1).toISOString();
        const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
        const { data } = await api.get('/calendar-events', {
          params: {
            'filters[tatoueur][documentId][$eq]': tatoueur.documentId,
            'filters[startTime][$gte]': startDate,
            'filters[startTime][$lte]': endDate,
            'populate[reservation]': '*',
            sort: 'startTime:asc',
          },
        });
        setEvents(data.data || []);
      } catch (err) {
        console.warn('[TatoueurCalendar] Erreur:', err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, [tatoueur?.documentId, year, month]);

  const eventsByDay = useMemo(() => {
    const map = {};
    events.forEach(evt => {
      const day = new Date(evt.startTime).getDate();
      if (!map[day]) map[day] = [];
      map[day].push(evt);
    });
    return map;
  }, [events]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const today = new Date();
  const isToday = (day) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const cells = [];
  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) cells.push(null);
  // Day cells
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-bold text-heading">
          {tx({ fr: 'Calendrier', en: 'Calendar' })}
        </h2>
      </div>

      <div className="bg-bg-card rounded-xl border border-white/5 overflow-hidden">
        {/* Month navigation */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-bg-elevated transition-colors text-grey-muted">
            <ChevronLeft size={20} />
          </button>
          <h3 className="text-lg font-heading font-bold text-heading">
            {monthNames[month]} {year}
          </h3>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-bg-elevated transition-colors text-grey-muted">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-white/5">
          {dayNames.map(d => (
            <div key={d} className="py-2 text-center text-xs font-bold text-grey-muted uppercase">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const dayEvents = day ? (eventsByDay[day] || []) : [];
            const isPast = day && new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

            return (
              <div
                key={i}
                className={`min-h-[80px] md:min-h-[100px] p-1.5 border-b border-r border-white/5 transition-colors ${
                  day ? (isToday(day) ? 'bg-accent/5' : isPast ? 'bg-bg-elevated/30' : 'hover:bg-bg-elevated/50 cursor-pointer') : ''
                }`}
                onClick={() => day && setSelectedDay(day === selectedDay ? null : day)}
              >
                {day && (
                  <>
                    <div className={`text-sm font-medium mb-1 ${isToday(day) ? 'text-accent font-bold' : isPast ? 'text-grey-muted/50' : 'text-grey-light'}`}>
                      {day}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map((evt, j) => (
                        <div key={j} className={`text-[10px] px-1.5 py-0.5 rounded ${EVENT_COLORS[evt.type] || 'bg-accent'} text-white truncate`}>
                          {evt.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-[10px] text-grey-muted pl-1">+{dayEvents.length - 3}</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected day details */}
      {selectedDay && (
        <div className="bg-bg-card rounded-xl border border-white/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-heading">
              {selectedDay} {monthNames[month]}
            </h3>
            <button onClick={() => setSelectedDay(null)} className="text-grey-muted hover:text-heading">
              <X size={16} />
            </button>
          </div>
          {(eventsByDay[selectedDay] || []).length === 0 ? (
            <p className="text-sm text-grey-muted">{tx({ fr: 'Aucun evenement', en: 'No events' })}</p>
          ) : (
            <div className="space-y-2">
              {(eventsByDay[selectedDay] || []).map((evt, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-bg-elevated rounded-lg">
                  <span className={`w-3 h-3 rounded-full flex-shrink-0 ${EVENT_COLORS[evt.type]}`} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-heading">{evt.title}</span>
                    {evt.notes && <p className="text-xs text-grey-muted mt-0.5">{evt.notes}</p>}
                  </div>
                  <span className="text-xs text-grey-muted flex-shrink-0">
                    {evt.startTime && new Date(evt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-grey-muted">
        {Object.entries(EVENT_COLORS).map(([type, color]) => (
          <span key={type} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
            {type.replace('-', ' ')}
          </span>
        ))}
      </div>
    </div>
  );
}
