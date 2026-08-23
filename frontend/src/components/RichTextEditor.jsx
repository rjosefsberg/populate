import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle, Color, FontFamily, FontSize } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { useEffect } from "react";

const FONT_FAMILIES = [
    { label: "Default", value: "" },
    { label: "Serif", value: "Georgia, 'Times New Roman', serif" },
    { label: "Sans-serif", value: "Arial, Helvetica, sans-serif" },
    { label: "Monospace", value: "'Courier New', Courier, monospace" },
    { label: "Comic Sans", value: "'Comic Sans MS', 'Comic Sans', cursive" },
];

const FONT_SIZES = [
    { label: "Default", value: "" },
    { label: "Small", value: "12px" },
    { label: "Normal", value: "16px" },
    { label: "Large", value: "20px" },
    { label: "X-Large", value: "28px" },
    { label: "Huge", value: "36px" },
];

const TOOLBAR_BUTTONS = [
    { label: "B", title: "Bold", isActive: e => e.isActive("bold"), run: e => e.chain().focus().toggleBold().run(), style: { fontWeight: "bold" } },
    { label: "I", title: "Italic", isActive: e => e.isActive("italic"), run: e => e.chain().focus().toggleItalic().run(), style: { fontStyle: "italic" } },
    { label: "H2", title: "Heading", isActive: e => e.isActive("heading", { level: 2 }), run: e => e.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: "• List", title: "Bullet list", isActive: e => e.isActive("bulletList"), run: e => e.chain().focus().toggleBulletList().run() },
    { label: "1. List", title: "Numbered list", isActive: e => e.isActive("orderedList"), run: e => e.chain().focus().toggleOrderedList().run() },
    { label: "❝❞", title: "Quote", isActive: e => e.isActive("blockquote"), run: e => e.chain().focus().toggleBlockquote().run() },
];

const ALIGN_BUTTONS = [
    { label: "⇤", title: "Align left", align: "left" },
    { label: "↔", title: "Align center", align: "center" },
    { label: "⇥", title: "Align right", align: "right" },
    { label: "≡", title: "Justify", align: "justify" },
];

const TABLE_BUTTONS = [
    { label: "+Row", title: "Add row after", run: e => e.chain().focus().addRowAfter().run() },
    { label: "-Row", title: "Delete row", run: e => e.chain().focus().deleteRow().run() },
    { label: "+Col", title: "Add column after", run: e => e.chain().focus().addColumnAfter().run() },
    { label: "-Col", title: "Delete column", run: e => e.chain().focus().deleteColumn().run() },
    { label: "Del table", title: "Delete table", run: e => e.chain().focus().deleteTable().run() },
];

function RichTextEditor({ value, onChange, placeholder }) {
    const editor = useEditor({
        // Toolbar buttons read editor.isActive(...)/getAttributes(...) on every render to
        // reflect the cursor's current formatting — Tiptap v3 defaults this off for perf.
        shouldRerenderOnTransaction: true,
        extensions: [
            StarterKit,
            TextStyle,
            Color,
            FontFamily,
            FontSize,
            TextAlign.configure({ types: ["heading", "paragraph"] }),
            Table.configure({ resizable: true }),
            TableRow,
            TableHeader,
            TableCell,
        ],
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
            <div className="d-flex gap-1 border-bottom p-1 flex-wrap align-items-center">
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

                {ALIGN_BUTTONS.map(btn => (
                    <button
                        key={btn.label}
                        type="button"
                        title={btn.title}
                        className={`btn btn-sm ${editor.isActive({ textAlign: btn.align }) ? "btn-secondary" : "btn-outline-secondary"}`}
                        onClick={() => editor.chain().focus().setTextAlign(btn.align).run()}
                    >
                        {btn.label}
                    </button>
                ))}

                <select
                    aria-label="Font"
                    className="form-select form-select-sm"
                    style={{ width: 130 }}
                    value={editor.getAttributes("textStyle").fontFamily || ""}
                    onChange={e => {
                        const value = e.target.value;
                        if (value) editor.chain().focus().setFontFamily(value).run();
                        else editor.chain().focus().unsetFontFamily().run();
                    }}
                >
                    {FONT_FAMILIES.map(f => <option key={f.label} value={f.value}>{f.label}</option>)}
                </select>

                <select
                    aria-label="Font size"
                    className="form-select form-select-sm"
                    style={{ width: 110 }}
                    value={editor.getAttributes("textStyle").fontSize || ""}
                    onChange={e => {
                        const value = e.target.value;
                        if (value) editor.chain().focus().setFontSize(value).run();
                        else editor.chain().focus().unsetFontSize().run();
                    }}
                >
                    {FONT_SIZES.map(s => <option key={s.label} value={s.value}>{s.label}</option>)}
                </select>

                <input
                    aria-label="Font color"
                    title="Font color"
                    type="color"
                    className="form-control form-control-sm p-0"
                    style={{ width: 32, height: 31 }}
                    value={editor.getAttributes("textStyle").color || "#000000"}
                    onChange={e => editor.chain().focus().setColor(e.target.value).run()}
                />

                <button
                    type="button"
                    title="Insert table"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                >
                    Table
                </button>

                {editor.isActive("table") && TABLE_BUTTONS.map(btn => (
                    <button
                        key={btn.label}
                        type="button"
                        title={btn.title}
                        className="btn btn-sm btn-outline-secondary"
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
