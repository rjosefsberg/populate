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

function AssistChatPanel({ entities = [] }) {
    const [entityType, setEntityType] = useState("person");
    const [genre, setGenre] = useState("fantasy");
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);
    const [contextIds, setContextIds] = useState([]);

    const toggleContext = (id) => {
        setContextIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleSend = () => {
        const trimmed = input.trim();
        if (!trimmed || sending) return;

        const nextMessages = [...messages, { role: "user", content: trimmed }];
        const contextEntities = entities
            .filter(e => contextIds.includes(e.id))
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

            {entities.length > 0 && (
                <div className="mb-3">
                    <label className="form-label text-uppercase fw-semibold d-block" style={labelStyle}>
                        Include entity in context
                    </label>
                    <div className="border rounded p-2" style={{ maxHeight: 120, overflowY: "auto" }}>
                        {entities.map(e => (
                            <div className="form-check" key={e.id}>
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    id={`context-entity-${e.id}`}
                                    checked={contextIds.includes(e.id)}
                                    onChange={() => toggleContext(e.id)}
                                />
                                <label className="form-check-label small" htmlFor={`context-entity-${e.id}`}>
                                    {e.title}
                                </label>
                            </div>
                        ))}
                    </div>
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
