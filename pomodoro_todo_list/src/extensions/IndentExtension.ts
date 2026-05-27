import { Extension } from '@tiptap/core';

const INDENTABLE = ['paragraph', 'heading', 'blockquote', 'codeBlock', 'image'];
const MAX_INDENT = 8;
const INDENT_PX = 24;

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      indent: () => ReturnType;
      outdent: () => ReturnType;
    };
  }
}

export const IndentExtension = Extension.create({
  name: 'indent',

  addGlobalAttributes() {
    return [
      {
        types: INDENTABLE,
        attributes: {
          indent: {
            default: 0,
            renderHTML: ({ indent }) =>
              indent > 0 ? { style: `margin-left:${indent * INDENT_PX}px` } : {},
            parseHTML: el => {
              const raw = el.style.marginLeft;
              return raw ? Math.round(parseInt(raw, 10) / INDENT_PX) : 0;
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indent:
        () =>
        ({ tr, state, dispatch }) => {
          const { from, to } = state.selection;
          let changed = false;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (!INDENTABLE.includes(node.type.name)) return;
            const next = Math.min((node.attrs.indent ?? 0) + 1, MAX_INDENT);
            if (next !== node.attrs.indent) {
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: next });
              changed = true;
            }
          });
          if (changed && dispatch) dispatch(tr);
          return changed;
        },

      outdent:
        () =>
        ({ tr, state, dispatch }) => {
          const { from, to } = state.selection;
          let changed = false;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (!INDENTABLE.includes(node.type.name)) return;
            const next = Math.max((node.attrs.indent ?? 0) - 1, 0);
            if (next !== node.attrs.indent) {
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: next });
              changed = true;
            }
          });
          if (changed && dispatch) dispatch(tr);
          return changed;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        // Let lists handle their own Tab
        const { $from } = this.editor.state.selection;
        if ($from.parent.type.name === 'listItem') return false;
        return this.editor.commands.indent();
      },
      'Shift-Tab': () => {
        const { $from } = this.editor.state.selection;
        if ($from.parent.type.name === 'listItem') return false;
        return this.editor.commands.outdent();
      },
    };
  },
});
