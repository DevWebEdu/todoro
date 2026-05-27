import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { DayData, KanbanCard } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

import { todayPeru } from '../utils/peru';

interface AppState {
  days: Record<string, DayData>;
  selectedDate: string;
}

type AppAction =
  | { type: 'LOAD'; state: Partial<AppState> }
  | { type: 'SELECT_DATE'; date: string }
  | { type: 'ADD_CARD'; date: string; card: KanbanCard }
  | { type: 'UPDATE_CARD'; date: string; cardId: string; updates: Partial<Pick<KanbanCard, 'title' | 'description' | 'status'>> }
  | { type: 'DELETE_CARD'; date: string; cardId: string }
  | { type: 'INCREMENT_CARD_STAT'; date: string; cardId: string; stat: 'pomodoroCount' | 'shortBreakCount' | 'longBreakCount' };

function getDay(state: AppState, date: string): DayData {
  return state.days[date] ?? { date, cards: [] };
}

function setDay(state: AppState, date: string, day: DayData): AppState {
  return { ...state, days: { ...state.days, [date]: day } };
}

// Pure reducer — no side effects
function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'LOAD':
      return {
        ...state,
        days: action.state.days ?? state.days,
        selectedDate: action.state.selectedDate ?? state.selectedDate,
      };
    case 'SELECT_DATE':
      return { ...state, selectedDate: action.date };
    case 'ADD_CARD': {
      const day = getDay(state, action.date);
      return setDay(state, action.date, { ...day, cards: [...day.cards, action.card] });
    }
    case 'UPDATE_CARD': {
      const day = getDay(state, action.date);
      return setDay(state, action.date, {
        ...day,
        cards: day.cards.map(c => c.id === action.cardId ? { ...c, ...action.updates } : c),
      });
    }
    case 'DELETE_CARD': {
      const day = getDay(state, action.date);
      return setDay(state, action.date, {
        ...day,
        cards: day.cards.filter(c => c.id !== action.cardId),
      });
    }
    case 'INCREMENT_CARD_STAT': {
      const day = getDay(state, action.date);
      return setDay(state, action.date, {
        ...day,
        cards: day.cards.map(c =>
          c.id === action.cardId
            ? { ...c, [action.stat]: (c[action.stat] ?? 0) + 1 }
            : c
        ),
      });
    }
    default:
      return state;
  }
}

const INITIAL_STATE: AppState = {
  days: {},
  selectedDate: todayPeru(),
};

interface AppContextValue extends AppState {
  dispatch: (action: AppAction) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, rawDispatch] = useReducer(reducer, INITIAL_STATE);

  // Sync from API when user logs in / changes
  useEffect(() => {
    if (!user) {
      rawDispatch({ type: 'LOAD', state: { days: {} } });
      return;
    }
    api.days.getAll()
      .then(remoteDays => {
        const mapped: Record<string, DayData> = {};
        for (const [date, d] of Object.entries(remoteDays)) {
          mapped[date] = { date, cards: d.cards as KanbanCard[] };
        }
        rawDispatch({ type: 'LOAD', state: { days: mapped } });
      })
      .catch(() => {});
  }, [user?.id]);

  // Wrapped dispatch: updates local state immediately + fires API call
  const dispatch = useCallback((action: AppAction) => {
    rawDispatch(action);

    if (!localStorage.getItem('pomo_token')) return;

    switch (action.type) {
      case 'ADD_CARD':
        api.cards.create({
          id: action.card.id,
          date: action.date,
          title: action.card.title,
          description: (action.card.description ?? undefined) as Record<string, unknown> | undefined,
          status: action.card.status,
        }).catch(console.error);
        break;
      case 'UPDATE_CARD':
        api.cards.update(action.cardId, action.updates).catch(console.error);
        break;
      case 'DELETE_CARD':
        api.cards.remove(action.cardId).catch(console.error);
        break;
      case 'INCREMENT_CARD_STAT':
        api.cards.incrementStat(action.cardId, action.stat).catch(console.error);
        break;
    }
  }, []);

  return (
    <AppContext.Provider value={{ ...state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}

export type { AppAction };
