import { useState } from "react";

function ProjectSelector({ projects, selectedId, onSelect, onCreate }) {
    const [creating, setCreating] = useState(false);
    const [name, setName] = useState("");

    const handleSelect = (e) => {
        const value = e.target.value;
        if (value === "__new__") {
            setCreating(true);
            return;
        }
        onSelect(Number(value));
    };

    const handleCreate = () => {
        const trimmed = name.trim();
        if (!trimmed) {
            setCreating(false);
            return;
        }
        onCreate(trimmed);
        setName("");
        setCreating(false);
    };

    if (creating) {
        return (
            <div className="mb-3 d-flex gap-1">
                <input
                    autoFocus
                    className="form-control form-control-sm"
                    placeholder="Project name…"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === "Enter") handleCreate();
                        if (e.key === "Escape") { setCreating(false); setName(""); }
                    }}
                    onBlur={handleCreate}
                />
            </div>
        );
    }

    return (
        <div className="mb-3">
            <select
                className="form-select form-select-sm"
                value={selectedId ?? ""}
                onChange={handleSelect}
            >
                {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                ))}
                <option value="__new__">+ New project…</option>
            </select>
        </div>
    );
}

export default ProjectSelector;
