import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import type { Editor } from '@tiptap/react';

export interface SlashItem {
  title: string;
  description: string;
  icon: string;
  command: (params: { editor: Editor; range: { from: number; to: number } }) => void;
}

interface Props {
  items: SlashItem[];
  command: (item: SlashItem) => void;
}

export interface SlashMenuHandle {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

const SlashMenu = forwardRef<SlashMenuHandle, Props>(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => setSelectedIndex(0), [items]);

  useImperativeHandle(ref, () => ({
    onKeyDown({ event }) {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((i) => (i - 1 + items.length) % items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((i) => (i + 1) % items.length);
        return true;
      }
      if (event.key === 'Enter') {
        const item = items[selectedIndex];
        if (item) command(item);
        return true;
      }
      return false;
    },
  }));

  return (
    <div
      style={{
        background: 'var(--bg)',
        border: '1px solid var(--border2)',
        borderRadius: 10,
        boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
        padding: 4,
        minWidth: 240,
        maxHeight: 340,
        overflowY: 'auto',
      }}
    >
      {items.length === 0 ? (
        <div style={{ padding: '8px 12px', fontSize: 13, color: 'var(--text3)' }}>
          Sin resultados
        </div>
      ) : (
        items.map((item, i) => (
          <button
            key={item.title}
            onMouseEnter={() => setSelectedIndex(i)}
            onClick={() => command(item)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              padding: '6px 8px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              background: i === selectedIndex ? 'var(--accent-bg)' : 'transparent',
              color: 'var(--text)',
              transition: 'background 0.08s',
            }}
          >
            <span
              style={{
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 6,
                background: 'var(--hover)',
                fontSize: 13,
                fontWeight: 700,
                color: i === selectedIndex ? 'var(--accent)' : 'var(--text2)',
                flexShrink: 0,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {item.icon}
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', lineHeight: 1.3 }}>
                {item.title}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.3 }}>
                {item.description}
              </div>
            </div>
          </button>
        ))
      )}
    </div>
  );
});

SlashMenu.displayName = 'SlashMenu';
export default SlashMenu;
