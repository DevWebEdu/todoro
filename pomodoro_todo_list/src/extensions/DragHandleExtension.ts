import { Extension } from '@tiptap/core';
import { Plugin, PluginKey, NodeSelection } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';

const DRAG_HANDLE_KEY = new PluginKey('dragHandle');

function createHandleEl(): HTMLElement {
  const el = document.createElement('div');
  el.className = 'drag-handle';
  el.draggable = true;
  el.setAttribute('contenteditable', 'false');
  el.innerHTML = `<svg width="10" height="16" viewBox="0 0 10 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="3" cy="2.5" r="1.5" fill="currentColor"/>
    <circle cx="7" cy="2.5" r="1.5" fill="currentColor"/>
    <circle cx="3" cy="7.5" r="1.5" fill="currentColor"/>
    <circle cx="7" cy="7.5" r="1.5" fill="currentColor"/>
    <circle cx="3" cy="12.5" r="1.5" fill="currentColor"/>
    <circle cx="7" cy="12.5" r="1.5" fill="currentColor"/>
  </svg>`;
  document.body.appendChild(el);
  return el;
}

export const DragHandleExtension = Extension.create({
  name: 'dragHandle',

  addProseMirrorPlugins() {
    const handle = createHandleEl();
    let hoveredNodePos = -1;
    let currentView: EditorView | null = null;

    handle.addEventListener('mousedown', (e) => {
      e.preventDefault(); // keep editor focus
    });

    handle.addEventListener('dragstart', (e) => {
      if (!currentView || hoveredNodePos < 0 || !e.dataTransfer) return;

      try {
        const view = currentView;
        const pos = hoveredNodePos;

        const sel = NodeSelection.create(view.state.doc, pos);
        view.dispatch(view.state.tr.setSelection(sel));

        const slice = view.state.selection.content();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (view as any).dragging = { slice, move: true };

        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', view.state.doc.nodeAt(pos)?.textContent ?? '');
        handle.style.opacity = '0.4';
      } catch {
        e.preventDefault();
      }
    });

    handle.addEventListener('dragend', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (currentView) (currentView as any).dragging = null;
      handle.style.opacity = '1';
    });

    return [
      new Plugin({
        key: DRAG_HANDLE_KEY,

        view(view) {
          currentView = view;
          return {
            destroy() {
              handle.remove();
              currentView = null;
            },
          };
        },

        props: {
          handleDOMEvents: {
            mousemove(view, event) {
              const coords = { left: event.clientX, top: event.clientY };
              const pos = view.posAtCoords(coords);

              if (!pos || pos.inside < 0) {
                handle.style.display = 'none';
                hoveredNodePos = -1;
                return false;
              }

              // Walk up to the top-level child of the document
              const $pos = view.state.doc.resolve(pos.pos);
              const nodePos = $pos.depth > 0 ? $pos.before(1) : pos.pos;

              const dom = view.nodeDOM(nodePos);
              if (!dom) {
                handle.style.display = 'none';
                return false;
              }

              const nodeEl = (dom instanceof HTMLElement ? dom : (dom as Node).parentElement) as HTMLElement | null;
              if (!nodeEl) {
                handle.style.display = 'none';
                return false;
              }

              const rect = nodeEl.getBoundingClientRect();
              hoveredNodePos = nodePos;

              handle.style.display = 'flex';
              handle.style.top = `${rect.top + (rect.height / 2) - 10}px`;
              handle.style.left = `${rect.left - 28}px`;

              return false;
            },

            mouseleave(_view, event) {
              const related = (event as MouseEvent).relatedTarget as Node | null;
              if (related && (related === handle || handle.contains(related))) return false;
              handle.style.display = 'none';
              return false;
            },
          },
        },
      }),
    ];
  },
});
