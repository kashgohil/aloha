"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Strikethrough,
} from "lucide-react";
import { useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  className?: string;
  autofocus?: boolean;
};

export function RichEditor({
  value,
  onChange,
  placeholder,
  className,
  autofocus,
}: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    autofocus: autofocus ? "end" : false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          HTMLAttributes: {
            class: "underline decoration-ink/40 underline-offset-2",
          },
        },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "Write something…",
        emptyEditorClass:
          "before:content-[attr(data-placeholder)] before:text-ink/40 before:float-left before:h-0 before:pointer-events-none",
      }),
      Markdown.configure({
        html: false,
        tightLists: true,
        linkify: true,
        breaks: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: cn(
          "prose-aloha focus:outline-none min-h-[240px] text-[14.5px] text-ink leading-[1.65]",
        ),
      },
    },
    onUpdate: ({ editor }) => {
      const md = (
            editor.storage as unknown as {
              markdown?: { getMarkdown?: () => string };
            }
          ).markdown?.getMarkdown?.() ?? "";
      onChange(md);
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = (
            editor.storage as unknown as {
              markdown?: { getMarkdown?: () => string };
            }
          ).markdown?.getMarkdown?.() ?? "";
    if (value !== current) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, value]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return (
      <div
        className={cn(
          "min-h-[240px] text-[14.5px] text-ink/40",
          className,
        )}
      >
        {placeholder ?? ""}
      </div>
    );
  }

  return (
    <div className={className}>
      <BubbleMenu
        editor={editor}
        options={{ placement: "top" }}
        className="flex items-center gap-0.5 rounded-full border border-border bg-background-elev px-1 py-1 shadow-lg"
      >
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          label="Bold"
        >
          <Bold className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          label="Italic"
        >
          <Italic className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          label="Strikethrough"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive("code")}
          label="Inline code"
        >
          <Code className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <span className="mx-1 h-4 w-px bg-border" />
        <ToolbarBtn
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          active={editor.isActive("heading", { level: 2 })}
          label="Heading 2"
        >
          <Heading2 className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          active={editor.isActive("heading", { level: 3 })}
          label="Heading 3"
        >
          <Heading3 className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <span className="mx-1 h-4 w-px bg-border" />
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          label="Bulleted list"
        >
          <List className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          label="Numbered list"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <span className="mx-1 h-4 w-px bg-border" />
        <ToolbarBtn
          onClick={setLink}
          active={editor.isActive("link")}
          label="Link"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </ToolbarBtn>
      </BubbleMenu>
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarBtn({
  children,
  onClick,
  active,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center justify-center w-7 h-7 rounded-full text-ink/70 hover:text-ink hover:bg-muted/60 transition-colors",
        active && "bg-muted text-ink",
      )}
    >
      {children}
    </button>
  );
}
