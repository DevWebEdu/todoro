import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { usePomodoro } from '../context/PomodoroContext';
import { useAuth } from '../context/AuthContext';
import RichEditor from './RichEditor';
import type { KanbanCard } from '../types';
import { formatTimePeru } from '../utils/peru';

function newId() {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}


const COLS: { status: KanbanCard['status']; label: string; color: string }[] = [
  { status: 'pending', label: 'Por hacer',   color: '#f59e0b' },
  { status: 'doing',   label: 'En progreso', color: '#3b82f6' },
  { status: 'done',    label: 'Hecho',       color: '#10b981' },
];

// ── Card Modal ──────────────────────────────────────────────────
function CardModal({ cardId, dayId, onClose }: { cardId: string; dayId: string; onClose: () => void }) {
  const { days, dispatch } = useApp();
  const { dispatch: pomDispatch } = usePomodoro();
  const titleRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const card = (days[dayId]?.cards ?? []).find(c => c.id === cardId);

  useEffect(() => { setTimeout(() => titleRef.current?.focus(), 60); }, []);
  if (!card) return null;

  const update = (updates: Partial<Pick<KanbanCard, 'title' | 'description' | 'status'>>) =>
    dispatch({ type: 'UPDATE_CARD', date: dayId, cardId, updates });
  const col = COLS.find(c => c.status === card.status)!;
  const hasTitle = card.title.trim().length > 0;

  const handleClose = () => {
    if (!hasTitle) {
      dispatch({ type: 'DELETE_CARD', date: dayId, cardId: card.id });
      pomDispatch({ type: 'PURGE_SNAPSHOT', cardId: card.id });
    }
    onClose();
  };

  return createPortal(
    <div
      ref={overlayRef}
      className="animate-overlay-in"
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 20px',
      }}
    >
      <div
        className="animate-card-pop"
        style={{
          background: 'var(--bg)', borderRadius: 16,
          width: 'min(96vw, 1280px)', height: '90vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border)',
          overflow: 'hidden',
        }}
      >
        {/* Modal top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '10px 16px', borderBottom: '1px solid var(--border)',
          flexShrink: 0, background: 'var(--surface)',
        }}>
          {/* Status pills */}
          <div style={{ display: 'flex', gap: 4 }}>
            {COLS.map(c => {
              const active = card.status === c.status;
              return (
                <button
                  key={c.status}
                  onClick={() => update({ status: c.status })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '4px 11px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                    border: `1.5px solid ${active ? c.color : 'transparent'}`,
                    background: active ? `${c.color}14` : 'transparent',
                    color: active ? c.color : 'var(--text3)',
                    cursor: 'pointer', transition: 'all 0.1s', letterSpacing: '0.03em',
                  }}
                  onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.background = 'var(--hover2)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text2)'; } }}
                  onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)'; } }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.color }} />
                  {c.label}
                </button>
              );
            })}
          </div>

          <div style={{ flex: 1 }} />

          <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: `${col.color}12`, color: col.color, fontWeight: 600 }}>
            {col.label}
          </span>

          <button
            onClick={() => { dispatch({ type: 'DELETE_CARD', date: dayId, cardId: card.id }); pomDispatch({ type: 'PURGE_SNAPSHOT', cardId: card.id }); onClose(); }}
            title="Eliminar tarea"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 14, padding: '4px 8px', borderRadius: 6, transition: 'color 0.1s' }}
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = '#ef4444')}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)')}
          >🗑</button>

          <button
            onClick={handleClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 20, lineHeight: 1, padding: '0 6px', borderRadius: 6, transition: 'color 0.1s' }}
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text)')}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)')}
          >×</button>
        </div>

        {/* Modal body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '36px 48px 56px', maxWidth: 820, width: '100%', margin: '0 auto' }}>
          <input
            ref={titleRef}
            className="page-title-input"
            placeholder="Título de la tarea…"
            value={card.title}
            onChange={e => update({ title: e.target.value })}
            onKeyDown={e => { if (e.key === 'Escape') handleClose(); }}
            style={{
              width: '100%', fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px',
              color: 'var(--text)', marginBottom: hasTitle ? 28 : 8, display: 'block',
              paddingBottom: 14,
              borderBottom: `2px solid ${hasTitle ? 'var(--border2)' : '#ef4444'}`,
              transition: 'border-color 0.15s',
            }}
          />
          {!hasTitle && (
            <p style={{ fontSize: 11, color: '#ef4444', margin: '0 0 20px', fontWeight: 500 }}>
              El título es obligatorio
            </p>
          )}
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 12 }}>
            Descripción
          </p>
          <RichEditor
            key={card.id}
            pageId={dayId}
            content={card.description}
            onChange={description => update({ description })}
            appendTo={() => overlayRef.current ?? document.body}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Card item ────────────────────────────────────────────────────
function CardItem({ card, dayId, color, onOpen, onDragStart, onDragEnd, isDragging }: {
  card: KanbanCard; dayId: string; color: string; onOpen: () => void;
  onDragStart: () => void; onDragEnd: () => void; isDragging: boolean;
}) {
  const { dispatch } = useApp();
  const { dispatch: pomDispatch, currentCardId, isOpen: pomOpen } = usePomodoro();
  const [hovered, setHovered] = useState(false);
  const isActive = pomOpen && currentCardId === card.id;
  const pomos = card.pomodoroCount ?? 0;

  return (
    <div
      className="animate-task-in"
      draggable
      onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; onDragStart(); }}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      style={{
        position: 'relative',
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${color}`,
        borderRadius: 10, padding: '12px 14px 10px',
        cursor: 'grab', opacity: isDragging ? 0.3 : 1,
        boxShadow: 'var(--shadow-sm)',
        transition: 'box-shadow 0.15s, opacity 0.12s',
        userSelect: 'none',
      }}
      onMouseEnter={e => { setHovered(true); if (!isDragging) (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md)'; }}
      onMouseLeave={e => { setHovered(false); (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-sm)'; }}
    >
      {hovered && (
        <button
          onClick={e => { e.stopPropagation(); dispatch({ type: 'DELETE_CARD', date: dayId, cardId: card.id }); pomDispatch({ type: 'PURGE_SNAPSHOT', cardId: card.id }); }}
          title="Eliminar tarea"
          style={{
            position: 'absolute', top: 7, right: 7,
            width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg)', border: '1px solid var(--border2)',
            borderRadius: 5, cursor: 'pointer', fontSize: 12,
            color: 'var(--text3)', transition: 'color 0.1s, border-color 0.1s',
            lineHeight: 1,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#ef4444'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border2)'; }}
        >×</button>
      )}
      {/* Title */}
      <p style={{
        fontSize: 13, fontWeight: 600, color: 'var(--text)',
        margin: '0 0 4px', lineHeight: 1.45,
        overflow: 'hidden', display: '-webkit-box',
        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
      }}>
        {card.title || <em style={{ color: 'var(--text3)', fontWeight: 400 }}>Sin título</em>}
      </p>

      {/* Creation time */}
      {card.createdAt && (
        <p style={{ fontSize: 10.5, color: 'var(--text3)', margin: '0 0 8px', lineHeight: 1 }}>
          {formatTimePeru(card.createdAt)}
        </p>
      )}

      {/* Footer */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}
        onClick={e => e.stopPropagation()}
      >
        {pomos > 0 && (
          <span style={{
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: 11, fontWeight: 600,
            padding: '2px 7px', borderRadius: 99,
            ...(card.status === 'done'
              ? { color, background: `${color}15`, border: `1px solid ${color}35` }
              : { color: 'var(--text3)', background: 'var(--hover2)' }
            ),
          }}>
            🍅 ×{pomos}
          </span>
        )}
        <div style={{ flex: 1 }} />
        {card.status === 'doing' && (
          <button
            onClick={() => pomDispatch({ type: 'OPEN', dayId, cardId: card.id })}
            title={isActive ? 'Ver panel pomodoro' : 'Iniciar pomodoro'}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
              background: isActive ? 'rgba(239,68,68,0.08)' : 'transparent',
              border: `1px solid ${isActive ? 'rgba(239,68,68,0.25)' : 'var(--border2)'}`,
              color: isActive ? '#ef4444' : 'var(--text3)',
              cursor: 'pointer', transition: 'all 0.12s',
            }}
            onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLButtonElement).style.borderColor = '#ef4444'; (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; } }}
            onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border2)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)'; } }}
          >
            {isActive ? '🍅 Activo' : '▶ Pomodoro'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── KanbanBoard ──────────────────────────────────────────────────
export default function KanbanBoard({ dayId }: { dayId: string }) {
  const { days, dispatch } = useApp();
  const { user, requestAuth } = useAuth();
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<KanbanCard['status'] | null>(null);
  const cards = days[dayId]?.cards ?? [];

  const addCard = (status: KanbanCard['status']) => {
    const doAdd = () => {
      const id = newId();
      dispatch({
        type: 'ADD_CARD', date: dayId,
        card: { id, title: '', description: null, status, createdAt: new Date().toISOString() },
      });
      setOpenCardId(id);
    };
    if (!user) requestAuth(doAdd);
    else doAdd();
  };

  const handleDrop = (targetStatus: KanbanCard['status']) => {
    if (!draggingId) return;
    const card = cards.find(c => c.id === draggingId);
    if (!card || card.status === targetStatus) return;
    dispatch({ type: 'UPDATE_CARD', date: dayId, cardId: draggingId, updates: { status: targetStatus } });
  };

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, alignItems: 'start' }}>
        {COLS.map((col, idx) => {
          const colCards = cards.filter(c => c.status === col.status);
          const isTarget = dragOverCol === col.status;
          const draggingCard = draggingId ? cards.find(c => c.id === draggingId) : null;
          const showPlaceholder = isTarget && draggingCard && draggingCard.status !== col.status;

          return (
            <div
              key={col.status}
              className="animate-col-in"
              style={{
                '--col-delay': `${idx * 60}ms`,
                background: isTarget
                  ? `color-mix(in srgb, ${col.color} 5%, var(--surface))`
                  : 'var(--surface)',
                borderRadius: 14,
                boxShadow: isTarget ? `inset 0 0 0 2px ${col.color}40` : 'none',
                padding: '14px 14px 10px',
                transition: 'background 0.15s, box-shadow 0.15s',
                minHeight: 220,
              } as React.CSSProperties}
              onDragOver={e => { e.preventDefault(); setDragOverCol(col.status); }}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverCol(null); }}
              onDrop={() => { handleDrop(col.status); setDraggingId(null); setDragOverCol(null); }}
            >
              {/* Column header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 7,
                marginBottom: 14, paddingBottom: 12,
                borderBottom: `1px solid ${col.color}25`,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color, flexShrink: 0 }} />
                <span style={{
                  fontSize: 11, fontWeight: 800, letterSpacing: '0.06em',
                  textTransform: 'uppercase', color: 'var(--text2)', flex: 1,
                }}>
                  {col.label}
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 700, background: `${col.color}18`,
                  color: col.color, borderRadius: 99, padding: '1px 8px', minWidth: 22, textAlign: 'center',
                }}>
                  {colCards.length}
                </span>
                {/* Add button in header */}
                <button
                  onClick={() => addCard(col.status)}
                  title={`Nueva tarea en ${col.label}`}
                  style={{
                    width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 6, border: 'none', background: 'transparent',
                    cursor: 'pointer', color: 'var(--text3)', fontSize: 16, fontWeight: 300,
                    transition: 'background 0.1s, color 0.1s', lineHeight: 1, flexShrink: 0,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${col.color}18`; (e.currentTarget as HTMLButtonElement).style.color = col.color; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)'; }}
                >+</button>
              </div>

              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {colCards.map(card => (
                  <CardItem
                    key={card.id}
                    card={card}
                    dayId={dayId}
                    color={col.color}
                    onOpen={() => setOpenCardId(card.id)}
                    onDragStart={() => setDraggingId(card.id)}
                    onDragEnd={() => { setDraggingId(null); setDragOverCol(null); }}
                    isDragging={draggingId === card.id}
                  />
                ))}

                {/* Drop placeholder */}
                {showPlaceholder && (
                  <div style={{
                    height: 60, borderRadius: 8,
                    border: `2px dashed ${col.color}45`,
                    background: `${col.color}06`,
                  }} />
                )}

                {/* Empty state */}
                {colCards.length === 0 && !showPlaceholder && (
                  <button
                    onClick={() => addCard(col.status)}
                    style={{
                      '--col-color': col.color,
                      padding: '20px 12px', width: '100%',
                      background: 'none', border: `1.5px dashed ${col.color}25`,
                      borderRadius: 9, cursor: 'pointer',
                      color: 'var(--text3)', fontSize: 12,
                      transition: 'border-color 0.12s, color 0.12s',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    } as React.CSSProperties}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = col.color; (e.currentTarget as HTMLButtonElement).style.color = col.color; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = `${col.color}25`; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)'; }}
                  >
                    <span style={{ fontSize: 16, opacity: 0.4 }}>+</span>
                    <span>Nueva tarea</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {openCardId && (
        <CardModal cardId={openCardId} dayId={dayId} onClose={() => setOpenCardId(null)} />
      )}
    </>
  );
}
