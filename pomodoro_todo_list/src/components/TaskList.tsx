import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { usePomodoro } from '../context/PomodoroContext';
import type { Task } from '../types';

const EMOJI_OPTIONS = [
  '📝','🎯','💡','🚀','⭐','🔥','💼','🎨','📊','🎓',
  '🏆','✅','🧠','💻','📚','🌟','⚡','🎸','🎭','🎪',
];

interface TaskItemProps {
  task: Task;
  pageId: string;
  isActive: boolean;
  index: number;
}

function TaskItem({ task, pageId, isActive, index }: TaskItemProps) {
  const { dispatch } = useApp();
  const { dispatch: pomDispatch } = usePomodoro();
  const [isEditing, setIsEditing] = useState(false);
  const [editVal, setEditVal] = useState(task.title);

  const commitEdit = () => {
    if (editVal.trim()) {
      dispatch({ type: 'UPDATE_TASK', id: task.id, updates: { title: editVal.trim() } });
    } else {
      setEditVal(task.title);
    }
    setIsEditing(false);
  };

  return (
    <div
      className="group flex items-center gap-3 px-1 py-2 rounded-sm transition-all duration-100 animate-task-in"
      style={{
        background: isActive ? 'var(--accent-bg)' : undefined,
        animationDelay: `${index * 0.03}s`,
        opacity: task.completed ? 0.45 : 1,
      }}
      onMouseEnter={(e) => {
        if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'var(--hover)';
      }}
      onMouseLeave={(e) => {
        if (!isActive) (e.currentTarget as HTMLDivElement).style.background = '';
      }}
    >
      <input
        type="checkbox"
        className="task-check w-[15px] h-[15px] rounded border-2"
        style={{ borderColor: isActive ? 'var(--accent)' : 'var(--border2)' }}
        checked={task.completed}
        onChange={() =>
          dispatch({ type: 'UPDATE_TASK', id: task.id, updates: { completed: !task.completed } })
        }
      />

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            className="task-edit-input w-full text-[13px]"
            style={{ color: 'var(--text)', outline: '1px solid var(--accent)', borderRadius: 3, padding: '0 2px' }}
            value={editVal}
            autoFocus
            onChange={(e) => setEditVal(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitEdit();
              if (e.key === 'Escape') { setEditVal(task.title); setIsEditing(false); }
            }}
          />
        ) : (
          <span
            className="text-[13px] select-none cursor-text"
            style={{
              color: task.completed ? 'var(--text3)' : 'var(--text)',
              textDecoration: task.completed ? 'line-through' : 'none',
            }}
            onDoubleClick={() => { setEditVal(task.title); setIsEditing(true); }}
          >
            {task.title}
          </span>
        )}
      </div>

      {task.pomodoroCount > 0 && (
        <span
          className="text-[11px] px-1.5 py-0.5 rounded-full shrink-0 tabular-nums"
          style={{ color: '#e67e22', background: 'rgba(230,126,34,0.1)' }}
        >
          🍅 {task.pomodoroCount}
        </span>
      )}

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-100 shrink-0">
        {!task.completed && (
          <button
            className="w-6 h-6 flex items-center justify-center rounded text-xs transition-colors duration-100 hover:bg-[var(--hover2)]"
            style={{ color: 'var(--text3)' }}
            title="Iniciar pomodoro con esta tarea"
            onClick={() => pomDispatch({ type: 'OPEN', pageId, taskId: task.id })}
          >
            ▶
          </button>
        )}
        <button
          className="w-6 h-6 flex items-center justify-center rounded text-sm transition-colors duration-100 hover:bg-[var(--hover2)]"
          style={{ color: 'var(--text3)' }}
          title="Eliminar"
          onClick={() => dispatch({ type: 'DELETE_TASK', id: task.id, pageId })}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#ef4444')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)')}
        >
          ×
        </button>
      </div>
    </div>
  );
}

interface EmojiPickerProps {
  pageId: string;
  onClose: () => void;
}

function EmojiPicker({ pageId, onClose }: EmojiPickerProps) {
  const { dispatch } = useApp();
  return (
    <div
      className="absolute top-full left-0 mt-1 z-50 grid grid-cols-5 gap-0.5 p-1.5 rounded-xl shadow-lg animate-card-pop"
      style={{ background: 'var(--bg)', border: '1px solid var(--border2)', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
    >
      {EMOJI_OPTIONS.map((e) => (
        <button
          key={e}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-xl transition-all duration-100 hover:scale-110"
          style={{ background: 'transparent' }}
          onMouseEnter={(e2) => ((e2.currentTarget as HTMLButtonElement).style.background = 'var(--hover2)')}
          onMouseLeave={(e2) => ((e2.currentTarget as HTMLButtonElement).style.background = 'transparent')}
          onClick={() => {
            dispatch({ type: 'UPDATE_PAGE', id: pageId, updates: { emoji: e } });
            onClose();
          }}
        >
          {e}
        </button>
      ))}
    </div>
  );
}

export { EmojiPicker };

export default function TaskList({ pageId }: { pageId: string }) {
  const { pages, tasks, dispatch } = useApp();
  const { currentTaskId, isOpen: pomOpen } = usePomodoro();
  const [newTitle, setNewTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const page = pages[pageId];
  if (!page) return null;

  const allTasks = page.taskIds.map((id) => tasks[id]).filter(Boolean) as Task[];
  const pending = allTasks.filter((t) => !t.completed);
  const done = allTasks.filter((t) => t.completed);

  const addTask = () => {
    if (newTitle.trim()) {
      dispatch({ type: 'ADD_TASK', pageId, title: newTitle.trim() });
      setNewTitle('');
      inputRef.current?.focus();
    }
  };

  return (
    <div>
      {/* Empty state */}
      {allTasks.length === 0 && (
        <div className="py-8 text-center">
          <div className="text-2xl mb-2" style={{ opacity: 0.3 }}>📋</div>
          <p className="text-xs" style={{ color: 'var(--text3)' }}>Sin tareas aún. ¡Agrega una abajo!</p>
        </div>
      )}

      {/* Pending tasks */}
      {pending.map((task, i) => (
        <TaskItem
          key={task.id}
          task={task}
          pageId={pageId}
          isActive={pomOpen && currentTaskId === task.id}
          index={i}
        />
      ))}

      {/* Add task input */}
      <div
        className="flex items-center gap-3 px-1 py-2 rounded-sm transition-colors duration-100"
        onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = 'var(--hover)')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = '')}
      >
        <span className="text-sm select-none" style={{ color: 'var(--text3)' }}>+</span>
        <input
          ref={inputRef}
          className="flex-1 text-[13px] bg-transparent border-0 outline-none"
          style={{ color: 'var(--text2)', caretColor: 'var(--accent)' }}
          placeholder="Agregar tarea..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') addTask();
            if (e.key === 'Escape') setNewTitle('');
          }}
        />
      </div>

      {/* Completed tasks */}
      {done.length > 0 && (
        <details
          className="mt-2"
          style={{ borderTop: `1px solid var(--border)` }}
        >
          <summary
            className="flex items-center gap-2 py-2 text-xs cursor-pointer select-none transition-colors duration-100"
            style={{ color: 'var(--text3)' }}
          >
            <span className="text-[9px]">▶</span>
            {done.length} completada{done.length !== 1 ? 's' : ''}
          </summary>
          {done.map((task, i) => (
            <TaskItem key={task.id} task={task} pageId={pageId} isActive={false} index={i} />
          ))}
        </details>
      )}
    </div>
  );
}
