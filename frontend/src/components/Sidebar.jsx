import { useState } from "react";
import ProjectList from "./ProjectList";

const ENTITY_TYPE_LABELS = {
    person: "Person",
    place: "Place",
    thing: "Thing",
    note: "Note",
};

const SORT_OPTIONS = [
    { value: "updated", label: "Last Edited (Default)" },
    { value: "created", label: "Date Created" },
    { value: "alphabetical", label: "Alphabetical" },
];

function sortEntities(entities, sortBy) {
    const sorted = [...entities];
    if (sortBy === "alphabetical") {
        sorted.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "created") {
        sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else {
        sorted.sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));
    }
    return sorted;
}

function groupByType(entities) {
    const groups = {};
    for (const entity of entities) {
        const type = entity.entity_type || "person";
        if (!groups[type]) groups[type] = [];
        groups[type].push(entity);
    }
    return Object.keys(groups)
        .sort((a, b) => (ENTITY_TYPE_LABELS[a] || a).localeCompare(ENTITY_TYPE_LABELS[b] || b))
        .map(type => ({ type, label: ENTITY_TYPE_LABELS[type] || type, entities: groups[type] }));
}

function EntityListItem({ entity, selectedId, onSelect }) {
    return (
        <li
            className={`p-2 rounded mb-1 ${selectedId === entity.id ? "bg-secondary" : ""}`}
            style={{ cursor: "pointer" }}
            onClick={() => onSelect(entity)}
        >
            {entity.title}
        </li>
    );
}

function Sidebar({ mode, projects, onOpenProject, onCreateProject, onRenameProject, onDeleteProject, projectName, onBackToProjects, entities, selectedId, onSelect, children, footer }) {
    const [viewMode, setViewMode] = useState("flat");
    const [sortBy, setSortBy] = useState("updated");

    const sortedEntities = sortEntities(entities, sortBy);
    const groups = viewMode === "grouped" ? groupByType(sortedEntities) : null;

    return (
        <div className="d-flex flex-column bg-dark text-white p-3" style={{ width: "250px", minHeight: "100vh" }}>
            {mode === "projects" ? (
                <ProjectList
                    projects={projects}
                    onOpen={onOpenProject}
                    onCreate={onCreateProject}
                    onRename={onRenameProject}
                    onDelete={onDeleteProject}
                />
            ) : (
                <>
                    <button
                        className="btn btn-sm btn-link text-white text-decoration-none text-start px-0 mb-2"
                        onClick={onBackToProjects}
                    >
                        &larr; Projects
                    </button>
                    <p className="fw-semibold text-truncate mb-3">{projectName}</p>

                    {/* Generate form at the top */}
                    {children}

                    <hr className="border-secondary" />

                    <div className="d-flex gap-2 mb-2">
                        <select
                            className="form-select form-select-sm bg-dark text-white border-secondary"
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                            aria-label="Sort entities"
                        >
                            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>

                    <div className="btn-group w-100 mb-2" role="group" aria-label="Sidebar view mode">
                        <button
                            type="button"
                            className={`btn btn-sm ${viewMode === "flat" ? "btn-secondary" : "btn-outline-secondary"}`}
                            onClick={() => setViewMode("flat")}
                        >
                            List
                        </button>
                        <button
                            type="button"
                            className={`btn btn-sm ${viewMode === "grouped" ? "btn-secondary" : "btn-outline-secondary"}`}
                            onClick={() => setViewMode("grouped")}
                        >
                            Grouped
                        </button>
                    </div>

                    {/* Entity list */}
                    {viewMode === "grouped" ? (
                        groups.map(group => (
                            <div key={group.type} className="mb-2">
                                <p
                                    className="text-uppercase fw-semibold mb-1 mt-2"
                                    style={{ fontSize: "0.7rem", letterSpacing: "0.08em", color: "#adb5bd" }}
                                >
                                    {group.label}
                                </p>
                                <ul className="list-unstyled">
                                    {group.entities.map(entity => (
                                        <EntityListItem key={entity.id} entity={entity} selectedId={selectedId} onSelect={onSelect} />
                                    ))}
                                </ul>
                            </div>
                        ))
                    ) : (
                        <ul className="list-unstyled">
                            {sortedEntities.map(entity => (
                                <EntityListItem key={entity.id} entity={entity} selectedId={selectedId} onSelect={onSelect} />
                            ))}
                        </ul>
                    )}
                </>
            )}

            <div className="mt-auto pt-3">{footer}</div>
        </div>
    );
}

export default Sidebar;
