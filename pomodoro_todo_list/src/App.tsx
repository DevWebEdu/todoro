import { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { PomodoroProvider } from './context/PomodoroContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import CalendarView from './components/CalendarView';
import DayView from './components/DayView';
import PomodoroPanel from './components/PomodoroPanel';
import FloatingTimer from './components/FloatingTimer';
import AuthModal from './components/AuthModal';
import { usePomodoro } from './context/PomodoroContext';
import { useApp } from './context/AppContext';

function Layout() {
  const { isOpen } = usePomodoro();
  const { dispatch } = useApp();
  const [view, setView] = useState<'calendar' | 'day'>('day');

  const goToDay = (date: string) => {
    dispatch({ type: 'SELECT_DATE', date });
    setView('day');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)', color: 'var(--text)' }}>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {view === 'calendar'
          ? <CalendarView onSelectDay={goToDay} />
          : <DayView onBack={() => setView('calendar')} />
        }
      </div>
      {isOpen && <PomodoroPanel />}
      <FloatingTimer />
      <AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <PomodoroProvider>
            <Layout />
          </PomodoroProvider>
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
