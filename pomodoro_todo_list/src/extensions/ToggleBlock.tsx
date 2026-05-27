import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';

// ── ToggleView React component ──────────────────────────────────
function ToggleView({ node, updateAttributes }: NodeViewProps) {
  const open: boolean = node.attrs.open ?? true;

  return (
    <NodeViewWrapper>
      <div className="toggle-block" data-open={open}>
        <div className="toggle-row">
          <button
            className={`toggle-arrow${open ? ' open' : ''}`}
            contentEditable={false}
            onMouseDown={e => {
              e.preventDefault();
              updateAttributes({ open: !open });
            }}
          >
            ▶
          </button>
          <NodeViewContent as="div" className="toggle-inner" />
        </div>
      </div>
    </NodeViewWrapper>
  );
}

// ── ToggleBlock node ────────────────────────────────────────────
export const ToggleBlock = Node.create({
  name: 'toggleBlock',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      open: {
        default: true,
        parseHTML: el => el.getAttribute('data-open') !== 'false',
        renderHTML: ({ open }) => ({ 'data-open': String(open) }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="toggle"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'toggle' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ToggleView);
  },

  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const { state, commands } = this.editor;
        const { selection } = state;
        const node = state.doc.nodeAt(selection.$from.before());
        if (node?.type.name === 'toggleBlock') {
          return commands.splitBlock();
        }
        return false;
      },
    };
  },
});
