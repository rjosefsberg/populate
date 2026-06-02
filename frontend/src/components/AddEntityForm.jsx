import { useState } from "react";

const GENRES = [
    { value: "fantasy", label: "Fantasy" },
    { value: "sci-fi", label: "Sci-Fi" },
    { value: "horror", label: "Horror" },
    { value: "western", label: "Western" },
    { value: "historical", label: "Historical" },
    { value: "noir", label: "Noir" },
    { value: "post-apocalyptic", label: "Post-Apocalyptic" },
];

function AddEntityForm({ onAdd }) {
    const [input, setInput] = useState("");
    const [entityType, setEntityType] = useState("person");
    const [genre, setGenre] = useState("fantasy");
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        setLoading(true);
        Promise.resolve(onAdd(input, entityType, genre)).finally(() => {
            setLoading(false);
            setInput("");
        });
    };

    const label = { fontSize: '0.7rem', letterSpacing: '0.08em', color: '#6c757d' };

    return (
        <form onSubmit={handleSubmit}>
            <div className="row g-3 mb-3">
                <div className="col">
                    <label className="form-label text-uppercase fw-semibold" style={label}>Genre</label>
                    <select className="form-select" value={genre} onChange={e => setGenre(e.target.value)}>
                        {GENRES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                </div>
                <div className="col">
                    <label className="form-label text-uppercase fw-semibold" style={label}>Type</label>
                    <select className="form-select" value={entityType} onChange={e => setEntityType(e.target.value)}>
                        <option value="person">Person</option>
                        <option value="place">Place</option>
                        <option value="thing">Thing</option>
                    </select>
                </div>
            </div>
            <div className="mb-4">
                <label className="form-label text-uppercase fw-semibold" style={label}>Name</label>
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
