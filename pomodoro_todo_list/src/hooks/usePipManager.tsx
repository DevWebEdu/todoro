import { useState, useRef, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { usePomodoro } from '../context/PomodoroContext';
import { useApp } from '../context/AppContext';
import type { PomodoroPhase, PomodoroStatus } from '../types';

// ── Styles injected into the PiP window ──────────────────────────────────────
const PIP_CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;overflow:hidden;background:#0a0a14;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  -webkit-font-smoothing:antialiased}
.pip-wrap{
  display:flex;align-items:center;height:100%;padding:0 14px;gap:10px;
  border-left:3px solid var(--c,#7c3aed);
  transition:border-color .3s}
.pip-ring{position:relative;width:56px;height:56px;flex-shrink:0}
.pip-ring svg{position:absolute;top:0;left:0}
.pip-ring-center{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
.pip-time{font-size:13px;font-weight:700;font-variant-numeric:tabular-nums;letter-spacing:-.5px}
.pip-done-emoji{font-size:22px}
.pip-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
.pip-phase{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em}
.pip-task{font-size:12px;color:rgba(255,255,255,.6);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pip-done-msg{font-size:13px;font-weight:600;color:rgba(255,255,255,.9);white-space:nowrap}
.pip-btns{display:flex;gap:5px;flex-shrink:0}
.pip-btn{width:34px;height:34px;border-radius:50%;border:1px solid rgba(255,255,255,.12);
  background:rgba(255,255,255,.07);color:rgba(255,255,255,.6);
  cursor:pointer;display:flex;align-items:center;justify-content:center;
  font-size:13px;transition:all .15s}
.pip-btn:hover{background:rgba(255,255,255,.18);color:#fff;border-color:rgba(255,255,255,.25)}
.pip-btn-open{background:rgba(124,58,237,.2);border-color:rgba(124,58,237,.45);
  color:#c4b5fd;font-size:15px}
.pip-btn-open:hover{background:rgba(124,58,237,.35);color:#fff}
`;

const COLORS: Record<PomodoroPhase, string> = {
  work: '#ef4444',
  'short-break': '#22c55e',
  'long-break': '#3b82f6',
};

const LABELS: Record<PomodoroPhase, string> = {
  work: 'Trabajo',
  'short-break': 'Descanso',
  'long-break': 'Descanso largo',
};

function fmt(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

// ── Pure component rendered inside PiP window (no React contexts) ─────────────
interface PipContentProps {
  timeLeft: number;
  totalDuration: number;
  phase: PomodoroPhase;
  status: PomodoroStatus;
  taskTitle: string | null;
  onToggle: () => void;
  onExpand: () => void;
}

function PipContent({ timeLeft, totalDuration, phase, status, taskTitle, onToggle, onExpand }: PipContentProps) {
  const color = COLORS[phase];
  const isRunning = status === 'running';
  const isDone = status === 'session-done' || status === 'break-done';
  const progress = totalDuration > 0 ? (totalDuration - timeLeft) / totalDuration : 0;

  const r = 22;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - progress);

  return (
    <div className="pip-wrap" style={{ '--c': color } as React.CSSProperties}>
      {/* Ring */}
      <div className="pip-ring">
        <svg width="56" height="56" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
          <circle
            cx="28" cy="28" r={r}
            fill="none" stroke={color} strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            transform="rotate(-90 28 28)"
            style={{ transition: 'stroke-dashoffset 0.8s linear' }}
          />
        </svg>
        <div className="pip-ring-center">
          {isDone
            ? <span className="pip-done-emoji">{status === 'session-done' ? '🎉' : '⚡'}</span>
            : <span className="pip-time" style={{ color }}>{fmt(timeLeft)}</span>
          }
        </div>
      </div>

      {/* Info */}
      <div className="pip-info">
        {isDone ? (
          <span className="pip-done-msg">
            {status === 'session-done' ? '¡Pomodoro listo!' : '¡Break terminado!'}
          </span>
        ) : (
          <>
            <span className="pip-phase" style={{ color }}>{LABELS[phase]}</span>
            <span className="pip-task">{taskTitle ?? 'Sin tarea seleccionada'}</span>
          </>
        )}
      </div>

      {/* Buttons */}
      <div className="pip-btns">
        {!isDone && (
          <button className="pip-btn" onClick={onToggle}>
            {isRunning ? '⏸' : '▶'}
          </button>
        )}
        <button className="pip-btn pip-btn-open" onClick={onExpand} title="Abrir app">
          ↗
        </button>
      </div>
    </div>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function usePipManager() {
  const pomo = usePomodoro();
  const { tasks } = useApp();

  const pipWinRef  = useRef<Window | null>(null);
  const pipRootRef = useRef<ReturnType<typeof createRoot> | null>(null);
  const [isPipOpen, setIsPipOpen] = useState(false);

  const isSupported = typeof window !== 'undefined' && 'documentPictureInPicture' in window;

  // Re-render PiP content whenever pomodoro state changes
  useEffect(() => {
    if (!pipRootRef.current) return;

    const currentTask = pomo.currentTaskId ? tasks[pomo.currentTaskId] : null;

    const onToggle = () => pomo.dispatch({ type: pomo.status === 'running' ? 'PAUSE' : 'START' });
    const onExpand = () => {
      // Focus the opener tab and open the panel
      window.focus();
      pomo.dispatch({ type: 'SHOW' });
    };

    pipRootRef.current.render(
      <PipContent
        timeLeft={pomo.timeLeft}
        totalDuration={pomo.totalDuration}
        phase={pomo.phase}
        status={pomo.status}
        taskTitle={currentTask?.title ?? null}
        onToggle={onToggle}
        onExpand={onExpand}
      />
    );
  }, [pomo, tasks]);

  const openPip = useCallback(async () => {
    if (!isSupported) {
      alert('Picture-in-Picture no está disponible.\nNecesitas Chrome 116 o superior.');
      return;
    }

    try {
      const pip: Window = await (window as any).documentPictureInPicture.requestWindow({
        width: 310,
        height: 80,
        disallowReturnToOpener: false,
      });

      // Inject CSS
      const style = pip.document.createElement('style');
      style.textContent = PIP_CSS;
      pip.document.head.appendChild(style);

      // Create React root
      const root = createRoot(pip.document.body);
      pipWinRef.current  = pip;
      pipRootRef.current = root;
      setIsPipOpen(true);

      pip.addEventListener('pagehide', () => {
        pipRootRef.current = null;
        pipWinRef.current  = null;
        setIsPipOpen(false);
      });

    } catch (e) {
      console.warn('PiP error:', e);
    }
  }, [isSupported]);

  const closePip = useCallback(() => {
    pipWinRef.current?.close();
  }, []);

  return { openPip, closePip, isPipOpen, isSupported };
}
