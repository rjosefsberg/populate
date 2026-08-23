function Sidebar({ entities, selectedId, onSelect, projectSelector, children }) {
    return (
        <div className="d-flex flex-column bg-dark text-white p-3" style={{ width: "250px", minHeight: "100vh" }}>
            {/* Project selector */}
            {projectSelector}

            {/* Generate form at the top */}
            {children}

            <hr className="border-secondary" />

            {/* Entity list */}
            <ul className="list-unstyled">
                {entities.map(entity => (
                    <li
                        key={entity.id}
                        className={`p-2 rounded mb-1 ${selectedId === entity.id ? "bg-secondary" : ""}`}
                        style={{ cursor: "pointer" }}
                        onClick={() => onSelect(entity)}
                    >
                        {entity.title}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Sidebar;