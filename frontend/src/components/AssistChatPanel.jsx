import { useState } from "react";
import Select from "react-select";
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

function AssistChatPanel({ entities = [], currentEntity, entityType = "person" }) {
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
    const selectOptions = contextOptions.map(e => ({ value: String(e.id), label: e.label }));
    const selectedOptions = selectOptions.filter(o => contextIds.includes(o.value));

    const handleContextChange = (selected) => {
        setContextIds((selected || []).map(o => o.value));
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

            <div className="mb-3">
                <select className="form-select form-select-sm" value={genre} onChange={e => setGenre(e.target.value)}>
                    {GENRES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
            </div>

            {contextOptions.length > 0 && (
                <div className="mb-3">
                    <label className="form-label text-uppercase fw-semibold d-block" style={labelStyle}>
                        Include entity in context
                    </label>
                    <Select
                        isMulti
                        aria-label="Include entity in context"
                        options={selectOptions}
                        value={selectedOptions}
                        onChange={handleContextChange}
                        placeholder="Select entities…"
                        closeMenuOnSelect={false}
                        hideSelectedOptions={false}
                        classNamePrefix="context-select"
                        styles={{
                            control: base => ({ ...base, minHeight: 31, fontSize: '0.875rem' }),
                            valueContainer: base => ({ ...base, padding: '0 8px' }),
                            indicatorsContainer: base => ({ ...base, height: 31 }),
                        }}
                    />
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
