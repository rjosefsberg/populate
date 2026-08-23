import { useState } from "react";
import { chatWithAssistant } from "../api/assist";

const GENRES = [
    { value: "fantasy", label: "Fantasy" },
    { value: "sci-fi", label: "Sci-Fi" },
    { value: "horror", label: "Horror" },
    { value: "western", label: "Western" },
    { value: "historical", label: "Historical" },
    { value: "noir", label: "Noir" },
    { value: "post-apocalyptic", label: "Post-Apocalyptic" },
];

const labelStyle = { fontSize: '0.7rem', letterSpacing: '0.08em', color: '#6c757d' };
const CURRENT_ENTITY_ID = "__current__";

function AssistChatPanel({ entities = [], currentEntity }) {
    const [entityType, setEntityType] = useState("person");
    const [genre, setGenre] = useState("fantasy");
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);
    const [contextIds, setContextIds] = useState([]);

    const hasCurrentEntity = currentEntity && (currentEntity.title || '').trim();
    const contextOptions = [
        ...(hasCurrentEntity
            ? [{ id: CURRENT_ENTITY_ID, label: `${currentEntity.title.trim()} (this entity)`, title: currentEntity.title.trim(), body: currentEntity.body }]
            : []),
        ...entities.map(e => ({ id: e.id, label: e.title, title: e.title, body: e.body })),
    ];

    const handleContextChange = (e) => {
        setContextIds(Array.from(e.target.selectedOptions).map(o => o.value));
    };

    const handleSend = () => {
        const trimmed = input.trim();
        if (!trimmed || sending) return;

        const nextMessages = [...messages, { role: "user", content: trimmed }];
        const contextEntities = contextOptions
            .filter(e => contextIds.includes(String(e.id)))
            .map(e => ({ title: e.title, body: e.body }));

        setMessages(nextMessages);
        setInput("");
        setSending(true);
        setError(null);

        chatWithAssistant(entityType, genre, nextMessages, contextEntities)
            .then(result => {
                if (result.error) {
                    setError(result.error);
                    return;
                }
                setMessages(prev => [...prev, { role: "assistant", content: result.reply }]);
            })
            .catch(() => setError("Something went wrong talking to the assistant."))
            .finally(() => setSending(false));
    };

    return (
        <div className="d-flex flex-column h-100">
            <p className="text-uppercase fw-semibold mb-2" style={labelStyle}>Get help</p>

            <div className="row g-2 mb-3">
                <div className="col">
                    <select className="form-select form-select-sm" value={genre} onChange={e => setGenre(e.target.value)}>
                        {GENRES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                </div>
                <div className="col">
                    <select className="form-select form-select-sm" value={entityType} onChange={e => setEntityType(e.target.value)}>
                        <option value="person">Person</option>
                        <option value="place">Place</option>
                        <option value="thing">Thing</option>
                    </select>
                </div>
            </div>

            {contextOptions.length > 0 && (
                <div className="mb-3">
                    <label className="form-label text-uppercase fw-semibold d-block" style={labelStyle}>
                        Include entity in context
                    </label>
                    <select
                        multiple
                        className="form-select form-select-sm"
                        size={Math.min(5, contextOptions.length)}
                        value={contextIds}
                        onChange={handleContextChange}
                    >
                        {contextOptions.map(e => (
                            <option key={e.id} value={e.id}>{e.label}</option>
                        ))}
                    </select>
                    <p className="text-muted mb-0 mt-1" style={{ fontSize: '0.7rem' }}>Ctrl/Cmd-click to select multiple.</p>
                </div>
            )}

            <div className="flex-grow-1 overflow-auto mb-3 border rounded p-2" style={{ minHeight: 200, maxHeight: 320 }}>
                {messages.length === 0 && (
                    <p className="text-muted small mb-0">Ask for ideas, lore, or phrasing — copy what's useful into your description.</p>
                )}
                {messages.map((m, i) => (
                    <div key={i} className={`mb-2 d-flex ${m.role === "user" ? "justify-content-end" : "justify-content-start"}`}>
                        <div
                            className={`px-2 py-1 rounded ${m.role === "user" ? "bg-primary text-white" : "bg-light"}`}
                            style={{ maxWidth: "90%", whiteSpace: "pre-wrap", fontSize: "0.875rem" }}
                        >
                            {m.content}
                        </div>
                    </div>
                ))}
                {sending && <p className="text-muted small mb-0">Thinking…</p>}
            </div>

            {error && <p className="text-danger small">{error}</p>}

            <div className="d-flex gap-2">
                <input
                    className="form-control form-control-sm"
                    placeholder="Ask the assistant…"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSend()}
                    disabled={sending}
                />
                <button className="btn btn-primary btn-sm" onClick={handleSend} disabled={sending || !input.trim()}>
                    Send
                </button>
            </div>
        </div>
    );
}

export default AssistChatPanel;
