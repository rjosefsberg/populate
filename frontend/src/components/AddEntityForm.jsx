import { useState } from "react";

function AddEntityForm({ onAdd }) {
    const [input, setInput] = useState("");
    const [entityType, setEntityType] = useState("person");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        onAdd(input, entityType);
        setInput("");
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
                className="form-control form-control-sm mb-2 bg-dark text-white border-secondary"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Enter name"
            />
            <button className="btn btn-primary btn-sm w-100" type="submit">Generate</button>
        </form>
    );
}

export default AddEntityForm;