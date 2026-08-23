import ProjectList from "./ProjectList";

function Sidebar({ mode, projects, onOpenProject, onCreateProject, onRenameProject, onDeleteProject, projectName, onBackToProjects, entities, selectedId, onSelect, children, footer }) {
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
                </>
            )}

            <div className="mt-auto pt-3">{footer}</div>
        </div>
    );
}

export default Sidebar;
