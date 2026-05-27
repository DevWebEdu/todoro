import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

// ── helpers ─────────────────────────────────────────────────────
import { todayPeru, toDateStrPeru as toDateStr } from '../utils/peru';

function getMonthCells(year: number, month: number): { date: string; current: boolean }[] {
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = firstDow === 0 ? 6 : firstDow - 1; // Monday-aligned
  const cells: { date: string; current: boolean }[] = [];
  for (let i = leading; i > 0; i--)
    cells.push({ date: toDateStr(new Date(year, month, 1 - i)), current: false });
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ date: toDateStr(new Date(year, month, d)), current: true });
  const tail = cells.length % 7 === 0 ? 0 : 7 - (cells.length % 7);
  for (let i = 1; i <= tail; i++)
    cells.push({ date: toDateStr(new Date(year, month + 1, i)), current: false });
  return cells;
}

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAY_ABBRS = ['Lu','Ma','Mi','Ju','Vi','Sá','Do'];
const COL_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  doing:   '#3b82f6',
  done:    '#10b981',
};

// ── NavBtn ───────────────────────────────────────────────────────
function NavBtn({ onClick, title, children }: { onClick: () => void; title?: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={title} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minWidth: 28, height: 28, padding: '0 6px',
      background: 'none', border: 'none', borderRadius: 7,
      cursor: 'pointer', color: 'var(--text3)', fontSize: 14,
      transition: 'background 0.1s, color 0.1s', flexShrink: 0,
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--hover2)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)'; }}
    >{children}</button>
  );
}

// ── DayCell ──────────────────────────────────────────────────────
function DayCell({ date, current, onSelect }: {
  date: string; current: boolean; onSelect: () => void;
}) {
  const { days } = useApp();
  const today = todayPeru();
  const isToday = date === today;
  const dayNum = new Date(date + 'T12:00:00').getDate();
  const tasks = days[date]?.cards ?? [];
  const visible = tasks.slice(0, 3);
  const hidden = Math.max(0, tasks.length - 3);

  return (
    <button
      onClick={onSelect}
      style={{
        display: 'flex', flexDirection: 'column', gap: 5,
        padding: '10px 10px 8px',
        background: isToday ? 'color-mix(in srgb, var(--accent) 5%, var(--bg))' : 'var(--bg)',
        border: 'none', cursor: 'pointer', textAlign: 'left',
        opacity: current ? 1 : 0.38,
        transition: 'background 0.12s',
        minHeight: 0, overflow: 'hidden',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = isToday ? 'color-mix(in srgb, var(--accent) 10%, var(--bg))' : 'var(--hover)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = isToday ? 'color-mix(in srgb, var(--accent) 5%, var(--bg))' : 'var(--bg)'; }}
    >
      {/* Day number */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: '50%', fontSize: 13, fontWeight: 700, lineHeight: 1, flexShrink: 0,
          background: isToday ? 'var(--accent)' : 'transparent',
          color: isToday ? '#fff' : 'var(--text)',
        }}>
          {dayNum}
        </span>
        {isToday && (
          <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Hoy
          </span>
        )}
      </div>

      {/* Task chips */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2.5, flex: 1 }}>
        {visible.map(task => (
          <div key={task.id} style={{
            fontSize: 10.5, fontWeight: 500, color: 'var(--text)',
            background: `${COL_COLORS[task.status]}14`,
            borderLeft: `2px solid ${COL_COLORS[task.status]}`,
            borderRadius: '0 3px 3px 0',
            padding: '2px 6px',
            overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
            lineHeight: 1.4,
          }}>
            {task.title || <em style={{ color: 'var(--text3)', fontStyle: 'italic' }}>Sin título</em>}
          </div>
        ))}
        {hidden > 0 && (
          <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500, paddingLeft: 6 }}>
            +{hidden} más
          </span>
        )}
      </div>
    </button>
  );
}

// ── CalendarView ─────────────────────────────────────────────────
export default function CalendarView({ onSelectDay }: { onSelectDay: (date: string) => void }) {
  const { selectedDate } = useApp();
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();

  const initDate = new Date(selectedDate + 'T12:00:00');
  const [year, setYear]   = useState(initDate.getFullYear());
  const [month, setMonth] = useState(initDate.getMonth());

  const cells = getMonthCells(year, month);
  const weeks = cells.length / 7;
  const today = todayPeru();

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };
  const goToday   = () => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    onSelectDay(today);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>

      {/* ── Top bar ── */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '0 20px', height: 48, flexShrink: 0,
        borderBottom: '1px solid var(--border)',
      }}>
        <span style={{ fontSize: 18 }}>🍅</span>
        <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.4px', color: 'var(--text)', marginRight: 4 }}>
          PomodoroFlow
        </span>
        <span style={{ width: 1, height: 18, background: 'var(--border2)', margin: '0 6px' }} />

        <NavBtn onClick={prevMonth} title="Mes anterior">‹</NavBtn>
        <span style={{
          fontSize: 14, fontWeight: 600, color: 'var(--text)', minWidth: 160,
          textAlign: 'center', textTransform: 'capitalize', letterSpacing: '-0.2px',
        }}>
          {MONTHS[month]} {year}
        </span>
        <NavBtn onClick={nextMonth} title="Mes siguiente">›</NavBtn>

        <button onClick={goToday} style={{
          fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 8,
          background: 'var(--hover)', border: '1px solid var(--border2)',
          color: 'var(--text2)', cursor: 'pointer', transition: 'all 0.12s',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border2)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text2)'; }}
        >Hoy</button>

        <div style={{ flex: 1 }} />

        <NavBtn onClick={toggle} title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
          <span style={{ fontSize: 15 }}>{theme === 'dark' ? '☀' : '🌙'}</span>
        </NavBtn>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '4px 10px 4px 6px',
              borderRadius: 99, border: '1px solid var(--border2)', background: 'var(--hover)',
            }}>
              <span style={{
                width: 22, height: 22, borderRadius: '50%', background: 'var(--accent)',
                color: '#fff', fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {user.name.charAt(0).toUpperCase()}
              </span>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name}
              </span>
            </div>
            <NavBtn onClick={logout} title="Cerrar sesión">
              <span style={{ fontSize: 13 }}>⏏</span>
            </NavBtn>
          </div>
        )}
      </header>

      {/* ── Day-of-week headers ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        {DAY_ABBRS.map(d => (
          <div key={d} style={{
            padding: '8px 0', textAlign: 'center',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
            textTransform: 'uppercase', color: 'var(--text3)',
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* ── Month grid ── */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gridTemplateRows: `repeat(${weeks}, 1fr)`,
        background: 'var(--border)',  // shows as grid lines
        gap: 1,
        overflow: 'hidden',
      }}>
        {cells.map(({ date, current }) => (
          <DayCell
            key={date}
            date={date}
            current={current}
            onSelect={() => onSelectDay(date)}
          />
        ))}
      </div>
    </div>
  );
}
