import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import type { PomodoroPhase, PomodoroStatus } from '../types';
import { useApp } from './AppContext';

export const DURATIONS: Record<PomodoroPhase, number> = {
  work: 25 * 60,
  'short-break': 5 * 60,
  'long-break': 15 * 60,
};

const TIMER_WORKER_CODE = `
var id = null;
self.onmessage = function(e) {
  if (e.data === 'start') {
    if (id !== null) return;
    id = setInterval(function() { self.postMessage('tick'); }, 1000);
  } else if (e.data === 'stop') {
    if (id !== null) { clearInterval(id); id = null; }
  }
};
`;

function createTimerWorker(): Worker {
  const blob = new Blob([TIMER_WORKER_CODE], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
}

interface CardSnapshot {
  phase: PomodoroPhase;
  status: 'idle' | 'paused' | 'session-done' | 'break-done';
  timeLeft: number;
  workSessionsCount: number;
}

interface PomodoroState {
  phase: PomodoroPhase;
  status: PomodoroStatus;
  timeLeft: number;
  endTime: number | null;
  currentCardId: string | null;
  dayId: string | null;
  workSessionsCount: number;
  isOpen: boolean;
  snapshots: Record<string, CardSnapshot>;
}

type PomodoroAction =
  | { type: 'OPEN'; dayId: string; cardId: string }
  | { type: 'SHOW' }
  | { type: 'CLOSE' }
  | { type: 'START' }
  | { type: 'PAUSE' }
  | { type: 'RESET' }
  | { type: 'TICK' }
  | { type: 'SESSION_COMPLETE' }
  | { type: 'BREAK_COMPLETE' }
  | { type: 'SKIP' }
  | { type: 'CONTINUE_AFTER_SESSION' }
  | { type: 'START_BREAK' }
  | { type: 'PURGE_SNAPSHOT'; cardId: string };

const INITIAL: PomodoroState = {
  phase: 'work', status: 'idle', timeLeft: DURATIONS.work,
  endTime: null, currentCardId: null, dayId: null,
  workSessionsCount: 0, isOpen: false, snapshots: {},
};

const STORAGE_KEY = 'pomo_timer_state';

function loadPersistedState(): PomodoroState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL;
    const p = JSON.parse(raw) as Partial<PomodoroState>;
    return {
      ...INITIAL,
      snapshots:         p.snapshots         ?? {},
      currentCardId:     p.currentCardId     ?? null,
      dayId:             p.dayId             ?? null,
      phase:             p.phase             ?? 'work',
      // never restore as 'running' — freeze at paused so user resumes manually
      status:            (p.status === 'running' ? 'paused' : p.status) ?? 'idle',
      timeLeft:          p.timeLeft          ?? DURATIONS.work,
      workSessionsCount: p.workSessionsCount ?? 0,
    };
  } catch {
    return INITIAL;
  }
}

function reducer(state: PomodoroState, action: PomodoroAction): PomodoroState {
  switch (action.type) {
    case 'OPEN': {
      const same = action.cardId === state.currentCardId && action.dayId === state.dayId;
      if (same) return { ...state, isOpen: true };

      // Save current card progress (running → paused so time is frozen)
      const snapshots = { ...state.snapshots };
      if (state.currentCardId && state.status !== 'idle') {
        snapshots[state.currentCardId] = {
          phase: state.phase,
          status: state.status === 'running' ? 'paused' : state.status,
          timeLeft: state.timeLeft,
          workSessionsCount: state.workSessionsCount,
        };
      }

      // Restore snapshot for the new card, or start fresh
      const snap = snapshots[action.cardId];
      return {
        ...state,
        isOpen: true,
        dayId: action.dayId,
        currentCardId: action.cardId,
        phase: snap?.phase ?? 'work',
        status: snap?.status ?? 'idle',
        timeLeft: snap?.timeLeft ?? DURATIONS.work,
        endTime: null,
        workSessionsCount: snap?.workSessionsCount ?? 0,
        snapshots,
      };
    }
    case 'SHOW': return { ...state, isOpen: true };
    case 'CLOSE': return { ...state, isOpen: false };
    case 'START': return { ...state, status: 'running', endTime: Date.now() + state.timeLeft * 1000 };
    case 'PAUSE': return { ...state, status: 'paused', endTime: null };
    case 'RESET': {
      const snapshots = { ...state.snapshots };
      if (state.currentCardId) delete snapshots[state.currentCardId];
      return { ...state, status: 'idle', timeLeft: DURATIONS[state.phase], endTime: null, snapshots };
    }
    case 'TICK': {
      if (state.status !== 'running' || state.endTime === null) return state;
      return { ...state, timeLeft: Math.max(0, Math.floor((state.endTime - Date.now()) / 1000)) };
    }
    case 'SESSION_COMPLETE':
      return { ...state, status: 'session-done', timeLeft: 0, endTime: null, workSessionsCount: state.workSessionsCount + 1 };
    case 'BREAK_COMPLETE':
      return { ...state, status: 'break-done', timeLeft: 0, endTime: null };
    case 'SKIP': {
      if (state.phase === 'work') {
        const isLong = state.workSessionsCount >= 4;
        const nextPhase: PomodoroPhase = isLong ? 'long-break' : 'short-break';
        return { ...state, phase: nextPhase, status: 'idle', timeLeft: DURATIONS[nextPhase], endTime: null,
          workSessionsCount: isLong ? 0 : state.workSessionsCount };
      }
      return { ...state, phase: 'work', status: 'idle', timeLeft: DURATIONS.work, endTime: null };
    }
    case 'START_BREAK': {
      const isLong = state.workSessionsCount >= 4;
      const phase: PomodoroPhase = isLong ? 'long-break' : 'short-break';
      return { ...state, phase, status: 'running', timeLeft: DURATIONS[phase],
        endTime: Date.now() + DURATIONS[phase] * 1000, workSessionsCount: isLong ? 0 : state.workSessionsCount };
    }
    case 'CONTINUE_AFTER_SESSION':
      return { ...state, phase: 'work', status: 'idle', timeLeft: DURATIONS.work, endTime: null };
    case 'PURGE_SNAPSHOT': {
      const snapshots = { ...state.snapshots };
      delete snapshots[action.cardId];
      if (state.currentCardId === action.cardId) {
        return { ...INITIAL, snapshots };
      }
      return { ...state, snapshots };
    }
    default: return state;
  }
}

interface PomodoroContextValue extends PomodoroState {
  dispatch: React.Dispatch<PomodoroAction>;
  totalDuration: number;
}

const PomodoroContext = createContext<PomodoroContextValue | null>(null);

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadPersistedState);
  const { dispatch: appDispatch, days } = useApp();
  const workerRef = useRef<Worker | null>(null);

  // Persist timer state to localStorage on every change
  useEffect(() => {
    const toSave = {
      snapshots:         state.snapshots,
      currentCardId:     state.currentCardId,
      dayId:             state.dayId,
      phase:             state.phase,
      status:            state.status === 'running' ? 'paused' : state.status,
      timeLeft:          state.timeLeft,
      workSessionsCount: state.workSessionsCount,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }, [state]);

  useEffect(() => {
    const worker = createTimerWorker();
    worker.onmessage = () => dispatch({ type: 'TICK' });
    workerRef.current = worker;
    return () => { worker.postMessage('stop'); worker.terminate(); workerRef.current = null; };
  }, []);

  useEffect(() => {
    workerRef.current?.postMessage(state.status === 'running' ? 'start' : 'stop');
  }, [state.status]);

  useEffect(() => {
    if (state.timeLeft !== 0 || state.status !== 'running') return;
    if (state.phase === 'work') {
      if (state.currentCardId && state.dayId) {
        appDispatch({ type: 'INCREMENT_CARD_STAT', date: state.dayId, cardId: state.currentCardId, stat: 'pomodoroCount' });
      }
      dispatch({ type: 'SESSION_COMPLETE' });
    } else {
      if (state.currentCardId && state.dayId) {
        const stat = state.phase === 'long-break' ? 'longBreakCount' : 'shortBreakCount';
        appDispatch({ type: 'INCREMENT_CARD_STAT', date: state.dayId, cardId: state.currentCardId, stat });
      }
      dispatch({ type: 'BREAK_COMPLETE' });
    }
  }, [state.timeLeft, state.status, state.phase, state.currentCardId, state.dayId, appDispatch]);

  const notifKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (state.status !== 'session-done' && state.status !== 'break-done') { notifKeyRef.current = null; return; }
    const key = `${state.status}-${state.workSessionsCount}`;
    if (notifKeyRef.current === key) return;
    notifKeyRef.current = key;
    if (!('Notification' in window)) return;
    const card = state.currentCardId && state.dayId
      ? (days[state.dayId]?.cards ?? []).find(c => c.id === state.currentCardId)
      : null;
    const cardTitle = card?.title || null;
    const fire = () => {
      if (state.status === 'session-done') {
        new Notification('🍅 ¡Pomodoro completado!', {
          body: cardTitle ? `"${cardTitle}" — sesión #${state.workSessionsCount} lista.` : `Sesión #${state.workSessionsCount} completada.`,
          tag: 'pomodoro-alert',
        });
      } else {
        new Notification('⚡ ¡Descanso terminado!', { body: '¿Listo para el siguiente pomodoro?', tag: 'pomodoro-alert' });
      }
    };
    if (Notification.permission === 'granted') fire();
    else if (Notification.permission !== 'denied') Notification.requestPermission().then(p => { if (p === 'granted') fire(); });
  }, [state.status, state.workSessionsCount, state.currentCardId, state.dayId, days]);

  return (
    <PomodoroContext.Provider value={{ ...state, dispatch, totalDuration: DURATIONS[state.phase] }}>
      {children}
    </PomodoroContext.Provider>
  );
}

export function usePomodoro() {
  const ctx = useContext(PomodoroContext);
  if (!ctx) throw new Error('usePomodoro must be inside PomodoroProvider');
  return ctx;
}
