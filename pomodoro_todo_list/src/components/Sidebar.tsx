import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { usePomodoro } from '../context/PomodoroContext';
import { useTheme } from '../context/ThemeContext';
import type { Page } from '../types';

interface PageItemProps {
  page: Page;
  depth: number;
}

function PageItem({ page, depth }: PageItemProps) {
  const { pages, currentPageId, expandedPageIds, dispatch } = useApp();
  const { pageId: pomodoroPageId, isOpen: pomodoroOpen } = usePomodoro();
  const [showActions, setShowActions] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState(page.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const isExpanded = expandedPageIds.includes(page.id);
  const isActive = currentPageId === page.id;
  const hasPomodoro = pomodoroOpen && pomodoroPageId === page.id;
  const childPages = page.childIds.map((id) => pages[id]).filter(Boolean) as Page[];

  const handleClick = () => {
    dispatch({ type: 'SET_CURRENT_PAGE', id: page.id });
    window.location.hash = `#/page/${page.id}`;
  };
  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (childPages.length > 0) dispatch({ type: 'TOGGLE_EXPAND', id: page.id });
  };
  const handleAddChild = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'ADD_PAGE', parentId: page.id });
  };
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`¿Eliminar "${page.title}" y todas sus subpáginas?`)) {
      dispatch({ type: 'DELETE_PAGE', id: page.id });
    }
  };
  const startRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRenameVal(page.title);
    setIsRenaming(true);
    setTimeout(() => inputRef.current?.select(), 30);
  };
  const commitRename = () => {
    if (renameVal.trim()) {
      dispatch({ type: 'UPDATE_PAGE', id: page.id, updates: { title: renameVal.trim() } });
    }
    setIsRenaming(false);
  };

  return (
    <div>
      <div
        className="group/item flex items-center gap-0.5 py-[3px] pr-1.5 rounded-sm mx-1 cursor-pointer select-none text-sm transition-colors duration-100"
        style={{
          paddingLeft: `${6 + depth * 14}px`,
          background: isActive ? 'var(--accent-bg)' : undefined,
          color: isActive ? 'var(--accent)' : 'var(--text2)',
        }}
        onClick={handleClick}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Expand arrow */}
        <button
          className={`w-5 h-5 flex items-center justify-center rounded text-[9px] transition-all duration-150 shrink-0 hover:bg-[var(--hover2)] ${childPages.length === 0 ? 'invisible' : ''} ${isExpanded ? 'rotate-90' : ''}`}
          style={{ color: 'var(--text3)' }}
          onClick={handleToggleExpand}
        >
          ▶
        </button>

        <span className="text-sm leading-none shrink-0">{page.emoji}</span>

        {isRenaming ? (
          <input
            ref={inputRef}
            className="rename-input flex-1 text-sm px-1 py-0.5 rounded min-w-0"
            style={{ color: 'var(--text)', outline: '1.5px solid var(--accent)', outlineOffset: '1px' }}
            value={renameVal}
            onChange={(e) => setRenameVal(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') setIsRenaming(false);
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="flex-1 truncate min-w-0 text-[13px]"
            style={{ color: isActive ? 'var(--accent)' : 'var(--text2)' }}
          >
            {page.title}
          </span>
        )}

        {hasPomodoro && <span className="text-xs shrink-0 opacity-70">🍅</span>}

        {showActions && !isRenaming && (
          <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            {[
              { label: '+', title: 'Subpágina', fn: handleAddChild },
              { label: '✏', title: 'Renombrar', fn: startRename },
              { label: '×', title: 'Eliminar', fn: handleDelete },
            ].map(({ label, title, fn }) => (
              <button
                key={label}
                title={title}
                onClick={fn}
                className="w-5 h-5 flex items-center justify-center rounded text-xs transition-colors duration-100 hover:bg-[var(--hover2)]"
                style={{ color: 'var(--text3)' }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {isExpanded &&
        childPages.map((child) => (
          <PageItem key={child.id} page={child} depth={depth + 1} />
        ))}
    </div>
  );
}

export default function Sidebar() {
  const { dispatch, getRootPages } = useApp();
  const { theme, toggle } = useTheme();
  const rootPages = getRootPages();

  return (
    <aside
      className="w-56 shrink-0 h-screen flex flex-col border-r"
      style={{ background: 'var(--sidebar)', borderColor: 'var(--border)' }}
    >
      {/* Header */}
      <div
        className="h-11 flex items-center px-3.5 border-b shrink-0"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">🍅</span>
          <span className="text-[13px] font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
            PomodoroFlow
          </span>
        </div>
        <button
          onClick={toggle}
          title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          className="ml-auto w-6 h-6 flex items-center justify-center rounded text-sm transition-colors duration-150 hover:bg-[var(--hover2)]"
          style={{ color: 'var(--text3)' }}
        >
          {theme === 'dark' ? '☀' : '🌙'}
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto py-2.5">
        {/* Section label */}
        <div className="flex items-center justify-between px-3.5 mb-0.5">
          <span
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: 'var(--text3)' }}
          >
            Páginas
          </span>
          <button
            className="w-5 h-5 flex items-center justify-center rounded text-sm transition-colors duration-150 hover:bg-[var(--hover2)]"
            style={{ color: 'var(--text3)' }}
            onClick={() => dispatch({ type: 'ADD_PAGE', parentId: null })}
            title="Nueva página"
          >
            +
          </button>
        </div>

        {/* Page tree */}
        <div>
          {rootPages.length === 0 ? (
            <div className="px-3.5 py-2">
              <p className="text-xs mb-2" style={{ color: 'var(--text3)' }}>Sin páginas aún</p>
              <button
                onClick={() => dispatch({ type: 'ADD_PAGE', parentId: null })}
                className="w-full py-1.5 rounded-md border border-dashed text-xs transition-colors duration-150"
                style={{ borderColor: 'var(--border2)', color: 'var(--text3)' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border2)';
                }}
              >
                + Crear primera página
              </button>
            </div>
          ) : (
            rootPages.map((page) => <PageItem key={page.id} page={page} depth={0} />)
          )}
        </div>
      </div>
    </aside>
  );
}
