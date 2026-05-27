import { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { useEditor, EditorContent, ReactRenderer } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Youtube from '@tiptap/extension-youtube';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Suggestion from '@tiptap/suggestion';
import tippy from 'tippy.js';
import type { Instance as TippyInstance } from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import SlashMenu, { type SlashItem, type SlashMenuHandle } from './SlashMenu';
import { ToggleBlock } from '../extensions/ToggleBlock';
import { IndentExtension } from '../extensions/IndentExtension';
import { DragHandleExtension } from '../extensions/DragHandleExtension';
import { api } from '../services/api';

const YOUTUBE_RE = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

interface BubbleState { top: number; left: number; visible: boolean; }

interface Props {
  pageId: string;
  content: unknown;
  onChange: (content: unknown) => void;
  appendTo?: () => HTMLElement;
}

function btnStyle(active: boolean): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '3px 8px', border: 'none', borderRadius: 5, cursor: 'pointer',
    fontSize: 13, fontWeight: 600, minWidth: 28,
    background: active ? 'var(--accent-bg)' : 'transparent',
    color: active ? 'var(--accent)' : 'var(--text2)',
    transition: 'background 0.08s',
  };
}

const Sep = () => (
  <div style={{ width: 1, height: 16, background: 'var(--border2)', margin: '0 2px' }} />
);

async function pickAndUploadImage(): Promise<string> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) { reject(new Error('Sin archivo')); return; }
      try {
        const url = await api.uploads.uploadImage(file);
        resolve(url);
      } catch (err) {
        reject(err);
      }
    };
    input.click();
  });
}

export default function RichEditor({ pageId, content, onChange, appendTo }: Props) {
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [bubble, setBubble] = useState<BubbleState>({ top: 0, left: 0, visible: false });
  const getItemsRef = useRef<(query: string) => SlashItem[]>(() => []);
  const appendToRef = useRef(appendTo);
  appendToRef.current = appendTo;

  const getItems = useCallback((query: string): SlashItem[] => {
    const all: SlashItem[] = [
      {
        title: 'Texto',
        description: 'Párrafo normal',
        icon: '¶',
        command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setParagraph().run(),
      },
      {
        title: 'Título 1',
        description: 'Encabezado grande',
        icon: 'H1',
        command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run(),
      },
      {
        title: 'Título 2',
        description: 'Encabezado mediano',
        icon: 'H2',
        command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run(),
      },
      {
        title: 'Título 3',
        description: 'Encabezado pequeño',
        icon: 'H3',
        command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run(),
      },
      {
        title: 'Lista con viñetas',
        description: 'Lista desordenada',
        icon: '•',
        command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBulletList().run(),
      },
      {
        title: 'Lista numerada',
        description: 'Lista numerada',
        icon: '1.',
        command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
      },
      {
        title: 'Lista de tareas',
        description: 'Casillas de verificación',
        icon: '☑',
        command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleTaskList().run(),
      },
      {
        title: 'Lista desplegable',
        description: 'Bloque colapsable con contenido',
        icon: '▶',
        command: ({ editor, range }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent({
              type: 'toggleBlock',
              attrs: { open: true },
              content: [{ type: 'paragraph' }],
            })
            .run();
        },
      },
      {
        title: 'Imagen',
        description: 'Insertar imagen desde archivo',
        icon: '🖼',
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).run();
          pickAndUploadImage()
            .then(url => editor.chain().focus().setImage({ src: url }).run())
            .catch(() => { /* cancelled or error */ });
        },
      },
      {
        title: 'Cita',
        description: 'Bloque de cita',
        icon: '"',
        command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
      },
      {
        title: 'Código',
        description: 'Bloque de código',
        icon: '</>',
        command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
      },
      {
        title: 'Divisor',
        description: 'Línea separadora',
        icon: '—',
        command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
      },
      {
        title: 'YouTube',
        description: 'Insertar video de YouTube',
        icon: '▶',
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).run();
          const url = window.prompt('URL de YouTube:');
          if (url) editor.commands.setYoutubeVideo({ src: url });
        },
      },
    ];
    const q = query.toLowerCase();
    return q
      ? all.filter(c => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))
      : all;
  }, [pageId]);

  getItemsRef.current = getItems;

  const SlashExtension = useMemo(() =>
    Extension.create({
      name: 'slash',
      addProseMirrorPlugins() {
        return [
          Suggestion({
            editor: this.editor,
            char: '/',
            allowedPrefixes: null,
            items: ({ query }: { query: string }) => getItemsRef.current(query),
            render: () => {
              let component: ReactRenderer<SlashMenuHandle>;
              let popup: TippyInstance[];
              return {
                onStart(props: any) {
                  component = new ReactRenderer(SlashMenu, { props, editor: props.editor });
                  if (!props.clientRect) return;
                  popup = tippy('body', {
                    getReferenceClientRect: props.clientRect,
                    appendTo: () => appendToRef.current?.() ?? document.body,
                    content: component.element,
                    showOnCreate: true,
                    interactive: true,
                    trigger: 'manual',
                    placement: 'bottom-start',
                    theme: 'slash-menu',
                    offset: [0, 8],
                    zIndex: 10002,
                  }) as unknown as TippyInstance[];
                },
                onUpdate(props: any) {
                  component.updateProps(props);
                  popup[0]?.setProps({ getReferenceClientRect: props.clientRect });
                },
                onKeyDown(props: any) {
                  if (props.event.key === 'Escape') { popup[0]?.hide(); return true; }
                  return component.ref?.onKeyDown(props) ?? false;
                },
                onExit() {
                  popup?.[0]?.destroy();
                  component.destroy();
                },
              };
            },
            command({ editor, range, props }: any) {
              props.command({ editor, range });
            },
          }),
        ];
      },
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: { class: 'rich-image' },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer' },
      }),
      Youtube.configure({
        width: 640,
        height: 360,
        HTMLAttributes: { class: 'yt-embed' },
      }),
      Placeholder.configure({
        placeholder: ({ node }) =>
          node.type.name === 'heading' ? 'Título…' : "Escribe algo… o '/' para comandos",
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: false }),
      TaskList,
      TaskItem.configure({ nested: true }),
      ToggleBlock,
      IndentExtension,
      DragHandleExtension,
      SlashExtension,
    ],
    content: (content as object | null) ?? { type: 'doc', content: [{ type: 'paragraph' }] },
    onUpdate: ({ editor: e }) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => onChange(e.getJSON()), 400);
    },
    onSelectionUpdate: ({ editor: e }) => {
      const { from, to } = e.state.selection;
      if (from === to) { setBubble(b => ({ ...b, visible: false })); return; }
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) { setBubble(b => ({ ...b, visible: false })); return; }
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      setBubble({ visible: true, top: rect.top - 52 + window.scrollY, left: rect.left + rect.width / 2 });
    },
    onBlur: () => setBubble(b => ({ ...b, visible: false })),
  });

  // Paste: YouTube URLs + image files
  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom as HTMLElement;
    const onPaste = async (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text/plain') ?? '';

      if (YOUTUBE_RE.test(text)) {
        e.preventDefault();
        e.stopPropagation();
        setTimeout(() => editor.commands.setYoutubeVideo({ src: text }), 0);
        return;
      }

      const files = Array.from(e.clipboardData?.files ?? []);
      const imageFile = files.find(f => f.type.startsWith('image/'));
      if (imageFile) {
        e.preventDefault();
        try {
          const url = await api.uploads.uploadImage(imageFile);
          editor.chain().focus().setImage({ src: url }).run();
        } catch {
          // ignore upload errors silently
        }
      }
    };
    dom.addEventListener('paste', onPaste);
    return () => dom.removeEventListener('paste', onPaste);
  }, [editor]);

  // Swap content on page change
  const prevPageId = useRef(pageId);
  useEffect(() => {
    if (!editor || prevPageId.current === pageId) return;
    prevPageId.current = pageId;
    editor.commands.setContent(
      (content as object | null) ?? { type: 'doc', content: [{ type: 'paragraph' }] },
      { emitUpdate: false }
    );
  }, [editor, pageId, content]);

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  if (!editor) return null;

  const Toolbar = (
    <div
      style={{
        position: 'fixed',
        top: bubble.top,
        left: bubble.left,
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        background: 'var(--bg)',
        border: '1px solid var(--border2)',
        borderRadius: 8,
        padding: '3px 4px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.14)',
        flexWrap: 'wrap',
        maxWidth: 480,
      }}
      onMouseDown={e => e.preventDefault()}
    >
      <button style={btnStyle(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()}><strong>B</strong></button>
      <button style={btnStyle(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()}><em>I</em></button>
      <button style={btnStyle(editor.isActive('underline'))} onClick={() => editor.chain().focus().toggleUnderline().run()}><u>U</u></button>
      <button style={btnStyle(editor.isActive('strike'))} onClick={() => editor.chain().focus().toggleStrike().run()}><s>S</s></button>
      <button style={btnStyle(editor.isActive('highlight'))} onClick={() => editor.chain().focus().toggleHighlight().run()} title="Resaltar">
        <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: 2, padding: '0 3px', fontSize: 11 }}>ab</span>
      </button>
      <button style={btnStyle(editor.isActive('code'))} onClick={() => editor.chain().focus().toggleCode().run()}>
        <code style={{ fontSize: 11 }}>{`</>`}</code>
      </button>

      <Sep />

      <button style={btnStyle(editor.isActive('heading', { level: 1 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</button>
      <button style={btnStyle(editor.isActive('heading', { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
      <button style={btnStyle(editor.isActive('heading', { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>

      <Sep />

      <button style={btnStyle(editor.isActive({ textAlign: 'left' }))} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Izquierda">⬅</button>
      <button style={btnStyle(editor.isActive({ textAlign: 'center' }))} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Centro">↔</button>
      <button style={btnStyle(editor.isActive({ textAlign: 'right' }))} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Derecha">➡</button>

      <Sep />

      <button style={btnStyle(false)} onClick={() => editor.chain().focus().outdent().run()} title="Reducir sangría">⇤</button>
      <button style={btnStyle(false)} onClick={() => editor.chain().focus().indent().run()} title="Aumentar sangría">⇥</button>

      <Sep />

      <button
        style={btnStyle(editor.isActive('link'))}
        onMouseDown={e => {
          e.preventDefault();
          if (editor.isActive('link')) {
            editor.chain().focus().unsetLink().run();
          } else {
            const url = window.prompt('URL del enlace:');
            if (url) editor.chain().focus().setLink({ href: url, target: '_blank' }).run();
          }
        }}
        title="Enlace"
      >🔗</button>
    </div>
  );

  return (
    <div className="rich-editor">
      {bubble.visible && createPortal(Toolbar, document.body)}
      <EditorContent editor={editor} />
    </div>
  );
}
