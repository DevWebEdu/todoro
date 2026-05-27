import { usePomodoro } from '../context/PomodoroContext';
import { useApp } from '../context/AppContext';
import { usePipManager } from '../hooks/usePipManager';
import type { PomodoroPhase } from '../types';

const COLORS: Record<PomodoroPhase, string> = {
  work: '#ef4444',
  'short-break': '#22c55e',
  'long-break': '#3b82f6',
};

const PHASE_LABEL: Record<PomodoroPhase, string> = {
  work: 'Trabajo',
  'short-break': 'Descanso',
  'long-break': 'Descanso largo',
};

function fmt(s: number): string {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

function Btn({ onClick, title, children, accent, color }: {
  onClick: () => void; title: string; children: React.ReactNode;
  accent?: boolean; color?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 28, height: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 7, border: accent ? `1px solid ${color}30` : '1px solid var(--border2)',
        background: accent ? `${color}15` : 'var(--hover)',
        color: accent ? color : 'var(--text2)',
        cursor: 'pointer', fontSize: 12, transition: 'all 0.1s', flexShrink: 0,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = color ?? 'var(--border2)';
        (e.currentTarget as HTMLButtonElement).style.color = color ?? 'var(--text)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = accent ? `${color}30` : 'var(--border2)';
        (e.currentTarget as HTMLButtonElement).style.color = accent ? color! : 'var(--text2)';
      }}
    >
      {children}
    </button>
  );
}

export default function FloatingTimer() {
  const {
    isOpen, phase, status, timeLeft, totalDuration,
    currentCardId, dayId, workSessionsCount, dispatch,
  } = usePomodoro();
  const { days } = useApp();
  const { openPip, isPipOpen, isSupported } = usePipManager();

  if (isOpen || status === 'idle') return null;

  const color = COLORS[phase];
  const currentCard = currentCardId && dayId
    ? (days[dayId]?.cards ?? []).find(c => c.id === currentCardId) ?? null
    : null;
  const progress = totalDuration > 0 ? (totalDuration - timeLeft) / totalDuration : 0;
  const isRunning = status === 'running';
  const isDone = status === 'session-done' || status === 'break-done';
  const breakLabel = workSessionsCount >= 4 ? 'Largo' : 'Descanso';

  const r = 20;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - progress);

  return (
    <div
      className="fixed bottom-5 right-5 z-50 select-none"
      style={{
        background: 'var(--bg)',
        border: '1px solid var(--border2)',
        borderLeft: `3px solid ${color}`,
        borderRadius: 10,
        boxShadow: 'var(--shadow-lg)',
        minWidth: 256,
        maxWidth: 300,
        overflow: 'hidden',
        '--ft-color': color,
        animation: isDone
          ? 'ft-pulse-ring 2s ease-in-out 0.3s infinite'
          : 'ft-appear 0.26s cubic-bezier(0.34,1.56,0.64,1)',
      } as React.CSSProperties}
    >
      {isDone ? (
        /* ── Done state ── */
        <div style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 20, lineHeight: 1 }}>
              {status === 'session-done' ? '🎉' : '⚡'}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', margin: 0, lineHeight: 1.3 }}>
                {status === 'session-done' ? '¡Pomodoro listo!' : '¡Break terminado!'}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text3)', margin: 0 }}>
                {status === 'session-done'
                  ? `Sesión #${workSessionsCount} completada`
                  : '¿Listo para trabajar?'}
              </p>
            </div>
            <Btn onClick={() => dayId && dispatch({ type: 'SHOW' })} title="Abrir panel" color={color} accent>
              ↗
            </Btn>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            {status === 'session-done' ? (
              <>
                <button
                  onClick={() => dispatch({ type: 'CONTINUE_AFTER_SESSION' })}
                  style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: 'none',
                    fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.1s',
                    background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.75')}
                  onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
                >▶ Trabajar</button>
                <button
                  onClick={() => dispatch({ type: 'START_BREAK' })}
                  style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: 'none',
                    fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.1s',
                    background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.75')}
                  onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
                >☕ {breakLabel}</button>
              </>
            ) : (
              <button
                onClick={() => dispatch({ type: 'CONTINUE_AFTER_SESSION' })}
                style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: 'none',
                  fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.1s',
                  background: 'var(--accent-bg)', color: 'var(--accent)' }}
                onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.75')}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
              >🚀 ¡A trabajar!</button>
            )}
          </div>
        </div>
      ) : (
        /* ── Running / paused state ── */
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
          {/* Ring */}
          <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
            <svg width="44" height="44" viewBox="0 0 50 50" style={{ position: 'absolute', inset: 0 }}>
              <circle cx="25" cy="25" r={r} fill="none" stroke="var(--ring-track)" strokeWidth="3" />
              <circle
                cx="25" cy="25" r={r} fill="none" stroke={color} strokeWidth="3"
                strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
                transform="rotate(-90 25 25)"
                style={{ transition: 'stroke-dashoffset 0.8s linear' }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 9, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
                color, fontFamily: 'Inter, sans-serif', letterSpacing: '-0.3px' }}>
                {fmt(timeLeft)}
              </span>
            </div>
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{
              display: 'inline-block', fontSize: 9, fontWeight: 800, letterSpacing: '0.07em',
              textTransform: 'uppercase', padding: '2px 7px', borderRadius: 99,
              background: `${color}18`, color, marginBottom: 3,
            }}>
              {PHASE_LABEL[phase]}
            </span>
            <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', margin: 0,
              overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {currentCard ? currentCard.title || 'Sin título' : 'Sin tarea'}
            </p>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
            <Btn
              onClick={() => dispatch({ type: isRunning ? 'PAUSE' : 'START' })}
              title={isRunning ? 'Pausar' : 'Continuar'}
              color="var(--text)"
            >
              {isRunning ? '⏸' : '▶'}
            </Btn>

            {isSupported && (
              <Btn
                onClick={openPip}
                title={isPipOpen ? 'PiP activo' : 'Minimizar flotante'}
                accent={isPipOpen}
                color="var(--accent)"
              >
                {isPipOpen ? '⬡' : '⧉'}
              </Btn>
            )}

            <Btn
              onClick={() => dayId && dispatch({ type: 'SHOW' })}
              title="Abrir panel"
              accent
              color={color}
            >
              ↗
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}
