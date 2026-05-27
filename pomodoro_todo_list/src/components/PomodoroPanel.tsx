import { usePomodoro } from '../context/PomodoroContext';
import { useApp } from '../context/AppContext';
import { usePipManager } from '../hooks/usePipManager';
import type { PomodoroPhase, KanbanCard } from '../types';

const PHASE_LABELS: Record<PomodoroPhase, string> = {
  work: 'Trabajo',
  'short-break': 'Descanso corto',
  'long-break': 'Descanso largo',
};

const PHASE_COLORS: Record<PomodoroPhase, string> = {
  work: '#ef4444',
  'short-break': '#22c55e',
  'long-break': '#3b82f6',
};

const STATUS_COLS: { status: KanbanCard['status']; label: string; color: string }[] = [
  { status: 'pending', label: 'Por hacer',   color: '#f59e0b' },
  { status: 'doing',   label: 'En progreso', color: '#3b82f6' },
  { status: 'done',    label: 'Hecho',       color: '#10b981' },
];

function fmt(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

function CircleTimer({ progress, phase, timeLeft, isRunning }: {
  progress: number; phase: PomodoroPhase; timeLeft: number; isRunning: boolean;
}) {
  const r = 80;
  const circ = 2 * Math.PI * r;
  const color = PHASE_COLORS[phase];
  return (
    <div className="circle-timer" style={{ width: 196, height: 196 }}>
      <svg viewBox="0 0 220 220" width="220" height="220" className="ct-glow-svg"
        style={{ top: -12, left: -12 }}>
        <circle cx="110" cy="110" r={r + 10} fill="none" stroke={color} strokeWidth="1"
          opacity={isRunning ? 0.18 : 0} style={{ transition: 'opacity 0.4s' }} />
      </svg>
      <svg viewBox="0 0 196 196" width="196" height="196">
        <circle cx="98" cy="98" r={r} fill="none" stroke="var(--ring-track)" strokeWidth="7" />
        <circle cx="98" cy="98" r={r} fill="none" stroke={color} strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - progress)}
          transform="rotate(-90 98 98)"
          style={{ transition: 'stroke-dashoffset 0.8s linear, stroke 0.3s',
            filter: isRunning ? `drop-shadow(0 0 7px ${color}70)` : undefined }} />
      </svg>
      <div className="circle-center">
        <div className="timer-time" style={{ fontSize: 40, letterSpacing: -2 }}>{fmt(timeLeft)}</div>
        <div className="timer-phase-label">{PHASE_LABELS[phase]}</div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
      textTransform: 'uppercase', color: 'var(--text3)', margin: '0 0 8px',
    }}>
      {children}
    </p>
  );
}

function IconBtn({ onClick, title, children, active, activeColor }: {
  onClick: () => void; title: string; children: React.ReactNode;
  active?: boolean; activeColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 9, border: '1px solid var(--border2)',
        background: active ? `${activeColor}12` : 'var(--hover)',
        color: active ? activeColor : 'var(--text3)',
        cursor: 'pointer', fontSize: 14, transition: 'all 0.1s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--hover2)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = active ? `${activeColor}12` : 'var(--hover)'; (e.currentTarget as HTMLButtonElement).style.color = active ? activeColor! : 'var(--text3)'; }}
    >
      {children}
    </button>
  );
}

export default function PomodoroPanel() {
  const {
    isOpen, phase, status, timeLeft, totalDuration,
    currentCardId, dayId, workSessionsCount, dispatch,
  } = usePomodoro();
  const { days, dispatch: appDispatch } = useApp();
  const { openPip, isPipOpen, isSupported: pipSupported } = usePipManager();

  if (!isOpen) return null;

  const currentCard = currentCardId && dayId
    ? (days[dayId]?.cards ?? []).find(c => c.id === currentCardId) ?? null
    : null;

  const progress = totalDuration > 0 ? (totalDuration - timeLeft) / totalDuration : 0;
  const dotsCount = workSessionsCount === 0 ? 0 : (workSessionsCount % 4 || 4);
  const sessionsDots = Array.from({ length: 4 }, (_, i) => i < dotsCount);
  const color = PHASE_COLORS[phase];

  const isRunning     = status === 'running';
  const isSessionDone = status === 'session-done';
  const isBreakDone   = status === 'break-done';
  const nextBreakLabel = workSessionsCount >= 4 ? 'largo (15 min)' : 'corto (5 min)';

  const changeCardStatus = (s: KanbanCard['status']) => {
    if (!dayId || !currentCardId) return;
    appDispatch({ type: 'UPDATE_CARD', date: dayId, cardId: currentCardId, updates: { status: s } });
  };

  return (
    <div
      className="animate-panel-in"
      style={{
        width: 308, flexShrink: 0, height: '100vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        background: 'var(--bg)', borderLeft: '1px solid var(--border)',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '0 16px', height: 48, flexShrink: 0,
        borderBottom: '1px solid var(--border)',
      }}>
        <span style={{ fontSize: 15 }}>🍅</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', flex: 1, letterSpacing: '-0.2px' }}>
          Pomodoro
        </span>
        {dayId && (
          <span style={{
            fontSize: 11, color: 'var(--text3)', background: 'var(--hover)',
            padding: '3px 9px', borderRadius: 99, border: '1px solid var(--border2)',
          }}>
            {new Date(dayId + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
          </span>
        )}
        <div style={{ display: 'flex', gap: 4, marginLeft: 4 }}>
          {pipSupported && (
            <IconBtn onClick={openPip} title={isPipOpen ? 'PiP activo' : 'Minimizar flotante'} active={isPipOpen} activeColor="var(--accent)">
              {isPipOpen ? '⬡' : '⧉'}
            </IconBtn>
          )}
          <IconBtn onClick={() => dispatch({ type: 'CLOSE' })} title="Cerrar panel">×</IconBtn>
        </div>
      </div>

      {/* Phase tabs */}
      <div style={{
        display: 'flex', gap: 3, margin: '14px 16px 0',
        background: 'var(--surface)', borderRadius: 12, padding: 3,
        flexShrink: 0,
      }}>
        {(['work', 'short-break', 'long-break'] as const).map(p => (
          <div
            key={p}
            style={{
              flex: 1, textAlign: 'center', fontSize: 11, fontWeight: 600,
              padding: '7px 4px', borderRadius: 9, cursor: 'default',
              transition: 'all 0.15s',
              ...(phase === p
                ? { background: 'var(--bg)', color: 'var(--text)', boxShadow: 'var(--shadow-sm)' }
                : { color: 'var(--text3)' }),
            }}
          >
            {PHASE_LABELS[p]}
          </div>
        ))}
      </div>

      {/* Timer */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0 12px', flexShrink: 0 }}>
        <CircleTimer progress={progress} phase={phase} timeLeft={timeLeft} isRunning={isRunning} />
      </div>

      {/* Session dots */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16, flexShrink: 0 }}>
        {sessionsDots.map((filled, i) => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: '50%',
            background: filled ? 'var(--accent)' : 'var(--border2)',
            transform: filled ? 'scale(1.2)' : 'scale(1)',
            transition: 'all 0.3s',
          }} />
        ))}
        <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 4 }}>
          Sesión {workSessionsCount}
        </span>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 20px' }}>

        {/* Working on */}
        <div style={{
          background: 'var(--surface)', borderRadius: 12,
          padding: '12px 14px', marginBottom: 14,
          border: '1px solid var(--border)',
        }}>
          <SectionLabel>Trabajando en</SectionLabel>
          {currentCard ? (
            <p style={{
              fontSize: 13, fontWeight: 500, color: 'var(--text)', margin: 0,
              overflow: 'hidden', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.45,
            } as React.CSSProperties}>
              {currentCard.title || <em style={{ color: 'var(--text3)', fontWeight: 400 }}>Sin título</em>}
            </p>
          ) : (
            <p style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--text3)', margin: 0 }}>
              Sin tarea activa
            </p>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {isRunning ? (
            <button
              onClick={() => dispatch({ type: 'PAUSE' })}
              style={{
                flex: 1, padding: '9px 0', borderRadius: 10, fontWeight: 600,
                fontSize: 13, cursor: 'pointer', border: 'none',
                background: 'var(--hover2)', color: 'var(--text)',
                transition: 'opacity 0.1s',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.75')}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
            >⏸ Pausar</button>
          ) : (status === 'idle' || status === 'paused') ? (
            <button
              onClick={() => dispatch({ type: 'START' })}
              style={{
                flex: 1, padding: '9px 0', borderRadius: 10, fontWeight: 600,
                fontSize: 13, cursor: 'pointer', border: 'none',
                background: 'var(--accent)', color: '#fff',
                transition: 'opacity 0.1s',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.88')}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
            >{status === 'paused' ? '▶ Continuar' : '▶ Iniciar'}</button>
          ) : null}
          <IconBtn onClick={() => dispatch({ type: 'RESET' })} title="Reiniciar">↺</IconBtn>
          <IconBtn onClick={() => dispatch({ type: 'SKIP' })} title="Saltar fase">⏭</IconBtn>
        </div>

        {/* Stats + status (only when there's a card) */}
        {currentCard && (
          <>
            {/* Stat pills */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {[
                { icon: '🍅', n: currentCard.pomodoroCount ?? 0, label: 'Sesiones' },
                { icon: '☕', n: currentCard.shortBreakCount ?? 0, label: 'Descanso' },
                { icon: '🌙', n: currentCard.longBreakCount ?? 0, label: 'Largo' },
              ].map(({ icon, n, label }) => (
                <div key={label} style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 3, background: 'var(--surface)', borderRadius: 10,
                  padding: '9px 6px', border: '1px solid var(--border)',
                }}>
                  <span style={{ fontSize: 14 }}>{icon}</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{n}</span>
                  <span style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Status changer */}
            <SectionLabel>Estado de la tarea</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {STATUS_COLS.map(col => {
                const active = currentCard.status === col.status;
                return (
                  <button
                    key={col.status}
                    onClick={() => changeCardStatus(col.status)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 9,
                      padding: '8px 12px', borderRadius: 9,
                      border: `1.5px solid ${active ? col.color : 'transparent'}`,
                      background: active ? `${col.color}10` : 'var(--surface)',
                      color: active ? col.color : 'var(--text2)',
                      cursor: 'pointer', transition: 'all 0.12s',
                      fontSize: 12, fontWeight: 600, textAlign: 'left',
                    }}
                    onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.background = 'var(--hover2)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)'; } }}
                    onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text2)'; } }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color, flexShrink: 0 }} />
                    {col.label}
                    {active && <span style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.7 }}>✓</span>}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {!currentCard && (
          <p style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--text3)', textAlign: 'center', marginTop: 8 }}>
            Inicia un pomodoro desde una tarjeta del tablero
          </p>
        )}
      </div>

      {/* Session/break done overlay */}
      {(isSessionDone || isBreakDone) && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10, background: 'color-mix(in srgb, var(--bg) 94%, transparent)',
          backdropFilter: 'blur(8px)',
        }}
          className="animate-overlay-in"
        >
          <div
            className="animate-card-pop"
            style={{
              width: 260, padding: '28px 24px 24px', borderRadius: 20, textAlign: 'center',
              background: 'var(--bg)', border: '1px solid var(--border2)',
              boxShadow: 'var(--shadow-xl)', margin: '0 24px',
            }}
          >
            {isSessionDone ? (
              <>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px' }}>
                  ¡Pomodoro completado!
                </h3>
                {currentCard && (
                  <p style={{ fontSize: 13, color: 'var(--text2)', margin: '0 0 4px' }}>
                    <span style={{ fontWeight: 700, color: '#e67e22' }}>+1 🍅</span>{' '}en{' '}
                    <em style={{ color: 'var(--text)' }}>{currentCard.title || 'Sin título'}</em>
                  </p>
                )}
                <p style={{ fontSize: 11, color: 'var(--text3)', margin: '0 0 20px' }}>
                  Sesión #{workSessionsCount} completada · 🍅 ×{currentCard?.pomodoroCount ?? 0}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button
                    onClick={() => dispatch({ type: 'CONTINUE_AFTER_SESSION' })}
                    style={{
                      padding: '10px 0', borderRadius: 10, fontWeight: 700,
                      fontSize: 13, border: 'none', cursor: 'pointer',
                      background: 'var(--accent)', color: '#fff',
                    }}
                  >▶ Seguir trabajando</button>
                  <button
                    onClick={() => dispatch({ type: 'START_BREAK' })}
                    style={{
                      padding: '10px 0', borderRadius: 10, fontWeight: 600,
                      fontSize: 13, border: '1px solid var(--border2)', cursor: 'pointer',
                      background: 'var(--surface)', color: 'var(--text)',
                    }}
                  >☕ Descanso {nextBreakLabel}</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 40, marginBottom: 12 }}>⚡</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px' }}>
                  ¡Descansaste bien!
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text2)', margin: '0 0 20px' }}>
                  ¿Listo para el siguiente pomodoro?
                </p>
                <button
                  onClick={() => dispatch({ type: 'CONTINUE_AFTER_SESSION' })}
                  style={{
                    width: '100%', padding: '10px 0', borderRadius: 10, fontWeight: 700,
                    fontSize: 13, border: 'none', cursor: 'pointer',
                    background: 'var(--accent)', color: '#fff',
                  }}
                >🚀 ¡A trabajar!</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
