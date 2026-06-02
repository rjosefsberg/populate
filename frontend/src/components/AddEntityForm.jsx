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
            <select
                className="form-control form-control-sm mb-2 bg-dark text-white border-secondary"
                value={entityType}
                onChange={e => setEntityType(e.target.value)}
            >
                <option value="person">Person</option>
                <option value="place">Place</option>
                <option value="thing">Thing</option>
            </select>
            <input
                className="form-control form-control-sm mb-2 border-secondary"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Enter name"
            />
            <button className="btn btn-primary btn-sm w-100" type="submit" disabled={loading}>
                {loading ? "Generating…" : "Generate"}
            </button>
        </form>
    );
}

export default AddEntityForm;