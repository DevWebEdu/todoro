import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { EmojiPicker } from './TaskList';
import KanbanBoard from './KanbanBoard';
import type { Page } from '../types';

export default function PageView() {
  const { currentPageId, pages, dispatch } = useApp();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  if (!currentPageId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center px-6 animate-page-in">
          <div className="text-6xl mb-5" style={{ opacity: 0.5 }}>🍅</div>
          <h2 className="text-2xl font-bold mb-2 tracking-tight" style={{ color: 'var(--text)' }}>
            Bienvenido a PomodoroFlow
          </h2>
          <p className="text-sm" style={{ color: 'var(--text2)' }}>
            Crea una página en el sidebar para empezar
          </p>
        </div>
      </div>
    );
  }

  const page = pages[currentPageId];
  if (!page) return null;

  const crumbs: Page[] = [];
  let cur: Page | undefined = pages[page.parentId ?? ''];
  while (cur) {
    crumbs.unshift(cur);
    cur = pages[cur.parentId ?? ''];
  }

  const startTitleEdit = () => {
    setTitleVal(page.title);
    setEditingTitle(true);
    setTimeout(() => titleRef.current?.select(), 20);
  };
  const commitTitle = () => {
    if (titleVal.trim()) {
      dispatch({ type: 'UPDATE_PAGE', id: page.id, updates: { title: titleVal.trim() } });
    }
    setEditingTitle(false);
  };

  return (
    <div key={currentPageId} className="max-w-4xl mx-auto px-10 py-12 animate-page-in">
      {/* Breadcrumb */}
      {crumbs.length > 0 && (
        <nav className="flex items-center gap-1 mb-7 text-xs flex-wrap">
          {crumbs.map((p, i) => (
            <React.Fragment key={p.id}>
              <button
                className="transition-colors duration-100"
                style={{ color: 'var(--text3)' }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)')}
                onClick={() => {
                  dispatch({ type: 'SET_CURRENT_PAGE', id: p.id });
                  window.location.hash = `#/page/${p.id}`;
                }}
              >
                {p.emoji} {p.title}
              </button>
              {i < crumbs.length - 1 && <span style={{ color: 'var(--text3)' }}>/</span>}
            </React.Fragment>
          ))}
          <span style={{ color: 'var(--text3)' }}>/</span>
          <span style={{ color: 'var(--text2)' }}>{page.emoji} {page.title}</span>
        </nav>
      )}

      {/* Page header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="relative mt-1">
          <button
            className="text-5xl leading-none transition-all duration-150 hover:scale-105 active:scale-95"
            onClick={() => setShowEmoji(!showEmoji)}
            title="Cambiar emoji"
          >
            {page.emoji}
          </button>
          {showEmoji && (
            <EmojiPicker pageId={page.id} onClose={() => setShowEmoji(false)} />
          )}
        </div>

        {editingTitle ? (
          <input
            ref={titleRef}
            className="page-title-input flex-1 text-4xl font-bold tracking-tight pb-1 min-w-0"
            style={{ color: 'var(--text)', borderBottom: '2px solid var(--accent)' }}
            value={titleVal}
            onChange={(e) => setTitleVal(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitTitle();
              if (e.key === 'Escape') setEditingTitle(false);
            }}
          />
        ) : (
          <h1
            className="flex-1 text-4xl font-bold tracking-tight cursor-text min-w-0 truncate transition-opacity duration-150 hover:opacity-70"
            style={{ color: 'var(--text)' }}
            onClick={startTitleEdit}
            title="Click para editar"
          >
            {page.title}
          </h1>
        )}
      </div>

      {/* Kanban board */}
      <div className="mt-10 pt-8" style={{ borderTop: '1px solid var(--border)' }}>
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-5" style={{ color: 'var(--text3)' }}>
          Tablero
        </p>
        <KanbanBoard pageId={page.id} />
      </div>

      {/* Subpages */}
      {page.childIds.length > 0 && (
        <div
          className="mt-8 pt-6"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text3)' }}>
            Subpáginas
          </p>
          <div className="flex flex-col gap-1">
            {page.childIds.map((cid) => {
              const child = pages[cid];
              if (!child) return null;
              return (
                <button
                  key={cid}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-left transition-all duration-100"
                  style={{ color: 'var(--text2)', border: '1px solid var(--border)' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'var(--hover)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = '';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--text2)';
                  }}
                  onClick={() => {
                    dispatch({ type: 'SET_CURRENT_PAGE', id: cid });
                    window.location.hash = `#/page/${cid}`;
                  }}
                >
                  <span>{child.emoji}</span>
                  <span className="truncate">{child.title}</span>
                  <span className="ml-auto text-[11px]" style={{ color: 'var(--text3)' }}>→</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
