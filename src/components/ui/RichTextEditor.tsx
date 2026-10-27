"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import clsx from "clsx";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  const activeClass = "bg-primary-100 text-primary-700";
  const inactiveClass = "text-slate-600 hover:bg-slate-100 hover:text-slate-900";
  const btnClass = "p-1.5 rounded-md transition-colors text-sm font-medium";

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-200 bg-slate-50/50 rounded-t-xl">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={clsx(btnClass, editor.isActive("bold") ? activeClass : inactiveClass)}
        type="button"
        title="Bold"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" /></svg>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={clsx(btnClass, editor.isActive("italic") ? activeClass : inactiveClass)}
        type="button"
        title="Italic"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 8m-8-8l-4 8" /></svg>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={clsx(btnClass, editor.isActive("strike") ? activeClass : inactiveClass)}
        type="button"
        title="Strikethrough"
      >
        <span className="line-through">S</span>
      </button>
      <div className="w-px h-4 bg-slate-200 mx-1" />
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={clsx(btnClass, editor.isActive("heading", { level: 1 }) ? activeClass : inactiveClass)}
        type="button"
        title="Heading 1"
      >
        H1
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={clsx(btnClass, editor.isActive("heading", { level: 2 }) ? activeClass : inactiveClass)}
        type="button"
        title="Heading 2"
      >
        H2
      </button>
      <div className="w-px h-4 bg-slate-200 mx-1" />
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={clsx(btnClass, editor.isActive("bulletList") ? activeClass : inactiveClass)}
        type="button"
        title="Bullet List"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16M8 6h.01M8 12h.01M8 18h.01" /></svg>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={clsx(btnClass, editor.isActive("orderedList") ? activeClass : inactiveClass)}
        type="button"
        title="Ordered List"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 6h13M7 12h13M7 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
      </button>
      <div className="w-px h-4 bg-slate-200 mx-1" />
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={clsx(btnClass, editor.isActive("blockquote") ? activeClass : inactiveClass)}
        type="button"
        title="Blockquote"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
      </button>
    </div>
  );
};

export default function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: value,
    editorProps: {
      attributes: {
        class: clsx(
          "prose prose-sm prose-slate max-w-none focus:outline-none min-h-[200px] p-4 bg-white/50 rounded-b-xl",
          className
        ),
      },
    },
    onUpdate: ({ editor }) => {
      // get HTML content
      const html = editor.getHTML();
      onChange(html);
    },
  });

  // Update editor content if value changes from outside
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary-500/50 focus-within:border-primary-500 transition-all bg-white/50">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
