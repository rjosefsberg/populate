import { useState } from "react";

function AddEntityForm({ onAdd }) {
    const [input, setInput] = useState("");
    const [entityType, setEntityType] = useState("person");
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        setLoading(true);
        Promise.resolve(onAdd(input, entityType)).finally(() => {
            setLoading(false);
            setInput("");
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="mb-3">
                <label className="form-label text-uppercase fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.08em', color: '#6c757d' }}>Type</label>
                <select
                    className="form-select"
                    value={entityType}
                    onChange={e => setEntityType(e.target.value)}
                >
                    <option value="person">Person</option>
                    <option value="place">Place</option>
                    <option value="thing">Thing</option>
                </select>
            </div>
            <div className="mb-4">
                <label className="form-label text-uppercase fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.08em', color: '#6c757d' }}>Name</label>
                <input
                    className="form-control"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Enter a name…"
                    autoFocus
                />
            </div>
            <button className="btn btn-primary w-100" type="submit" disabled={loading}>
                {loading ? "Generating…" : "Generate"}
            </button>
        </form>
    );
}

export default AddEntityForm;
