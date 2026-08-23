import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

const TOOLBAR_BUTTONS = [
    { label: "B", title: "Bold", isActive: e => e.isActive("bold"), run: e => e.chain().focus().toggleBold().run(), style: { fontWeight: "bold" } },
    { label: "I", title: "Italic", isActive: e => e.isActive("italic"), run: e => e.chain().focus().toggleItalic().run(), style: { fontStyle: "italic" } },
    { label: "H2", title: "Heading", isActive: e => e.isActive("heading", { level: 2 }), run: e => e.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: "• List", title: "Bullet list", isActive: e => e.isActive("bulletList"), run: e => e.chain().focus().toggleBulletList().run() },
    { label: "1. List", title: "Numbered list", isActive: e => e.isActive("orderedList"), run: e => e.chain().focus().toggleOrderedList().run() },
    { label: "❝❞", title: "Quote", isActive: e => e.isActive("blockquote"), run: e => e.chain().focus().toggleBlockquote().run() },
];

function RichTextEditor({ value, onChange, placeholder }) {
    const editor = useEditor({
        extensions: [StarterKit],
        content: value || "",
        onUpdate: ({ editor }) => onChange(editor.getHTML()),
        editorProps: {
            attributes: {
                class: "form-control border-0 px-0",
                style: "min-height: 200px; box-shadow: none;",
                "data-placeholder": placeholder || "",
            },
        },
    });

    // Keep the editor in sync if `value` is replaced from outside (e.g. reset on close/reopen).
    useEffect(() => {
        if (editor && (value || "") !== editor.getHTML()) {
            editor.commands.setContent(value || "", { emitUpdate: false });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, editor]);

    if (!editor) return null;

    return (
        <div className="border rounded">
            <div className="d-flex gap-1 border-bottom p-1 flex-wrap">
                {TOOLBAR_BUTTONS.map(btn => (
                    <button
                        key={btn.label}
                        type="button"
                        title={btn.title}
                        className={`btn btn-sm ${btn.isActive(editor) ? "btn-secondary" : "btn-outline-secondary"}`}
                        style={btn.style}
                        onClick={() => btn.run(editor)}
                    >
                        {btn.label}
                    </button>
                ))}
            </div>
            <div className="px-2">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}

export default RichTextEditor;
