import {useState} from "react";

function AddEntityForm({onAdd, entities = []}) {
    const [input, setInput] = useState("");
    const [entityType, setEntityType] = useState("person");
    const [loading, setLoading] = useState(false);
    const [associatedEntityId, setAssociatedEntityId] = useState("");
    const [associationLabel, setAssociationLabel] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        setLoading(true);
        const association = associatedEntityId
            ? {entityId: associatedEntityId, label: associationLabel}
            : null;
        Promise.resolve(onAdd(input, entityType, association)).finally(() => {
            setLoading(false);
            setInput("");
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <select
                className="form-control form-control-sm mb-2  border-secondary"
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
            {entities.length > 0 && (
                <div className="mb-2">
                    <select
                        className="form-control form-control-sm mb-1  border-secondary"
                        value={associatedEntityId}
                        onChange={e => setAssociatedEntityId(e.target.value)}
                    >
                        <option value="">No association</option>
                        {entities.map(e => (
                            <option key={e.id} value={e.id}>{e.title}</option>
                        ))}
                    </select>
                    {associatedEntityId && (
                        <input
                            className="form-control form-control-sm border-secondary"
                            value={associationLabel}
                            onChange={e => setAssociationLabel(e.target.value)}
                            placeholder="Describe the association (e.g. lives in, allied with…)"
                        />
                    )}
                </div>
            )}
            <button className="btn btn-primary btn-sm w-100" type="submit" disabled={loading}>
                {loading ? "Generating…" : "Generate"}
            </button>
        </form>
    );
}

export default AddEntityForm;
