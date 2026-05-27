import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import KanbanBoard from './KanbanBoard';

import { todayPeru } from '../utils/peru';

function formatDayFull(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

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

export default function DayView({ onBack }: { onBack: () => void }) {
  const { days, selectedDate, dispatch } = useApp();
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const today = todayPeru();
  const isToday = selectedDate === today;

  // Summary counts
  const dayCards = days[selectedDate]?.cards ?? [];
  const pending  = dayCards.filter(c => c.status === 'pending').length;
  const doing    = dayCards.filter(c => c.status === 'doing').length;
  const done     = dayCards.filter(c => c.status === 'done').length;

  const goToday = () => dispatch({ type: 'SELECT_DATE', date: today });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>

      {/* ── Top bar ── */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '0 20px', height: 48, flexShrink: 0,
        borderBottom: '1px solid var(--border)',
      }}>
        {/* Back */}
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 10px 5px 8px', borderRadius: 8,
            background: 'none', border: '1px solid var(--border2)',
            cursor: 'pointer', color: 'var(--text2)',
            fontSize: 13, fontWeight: 500, flexShrink: 0,
            transition: 'all 0.12s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--hover2)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border2)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text2)'; }}
        >
          <span style={{ fontSize: 15, lineHeight: 1 }}>←</span>
          Calendario
        </button>

        <span style={{ width: 1, height: 18, background: 'var(--border2)', margin: '0 4px', flexShrink: 0 }} />

        {/* Date title */}
        <h1 style={{
          fontSize: 14, fontWeight: 600, color: 'var(--text)',
          textTransform: 'capitalize', letterSpacing: '-0.2px',
          margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          minWidth: 0,
        }}>
          {formatDayFull(selectedDate)}
        </h1>

        {isToday && (
          <span style={{
            fontSize: 10, fontWeight: 700, color: 'var(--accent)',
            background: 'var(--accent-bg)', padding: '2px 8px', borderRadius: 99,
            flexShrink: 0, whiteSpace: 'nowrap',
          }}>
            Hoy
          </span>
        )}

        {!isToday && (
          <button onClick={goToday} style={{
            fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 8,
            background: 'var(--hover)', border: '1px solid var(--border2)',
            color: 'var(--text2)', cursor: 'pointer', transition: 'all 0.12s',
            flexShrink: 0,
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border2)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text2)'; }}
          >Hoy</button>
        )}

        {/* Summary chips */}
        {dayCards.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 8 }}>
            {pending > 0 && <StatChip color="#f59e0b" label={`${pending} por hacer`} />}
            {doing   > 0 && <StatChip color="#3b82f6" label={`${doing} en progreso`} />}
            {done    > 0 && <StatChip color="#10b981" label={`${done} listas`} />}
          </div>
        )}

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

      {/* ── Kanban content ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div
          key={selectedDate}
          className="animate-day-in"
          style={{ maxWidth: 1500, margin: '0 auto', padding: '32px 40px 64px' }}
        >
          <KanbanBoard dayId={selectedDate} />
        </div>
      </div>
    </div>
  );
}

function StatChip({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color, fontWeight: 500 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
      {label}
    </span>
  );
}
