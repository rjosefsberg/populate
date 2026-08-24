import { useState } from "react";
import Dropdown from "react-bootstrap/Dropdown";
import Button from "react-bootstrap/Button";
import { FaEllipsisV } from "react-icons/fa";

function ProjectItemMenu({ onOpen, onRename, onDelete }) {
    return (
        <Dropdown onClick={e => e.stopPropagation()}>
            <Dropdown.Toggle
                as="button"
                bsPrefix="btn"
                className="btn btn-sm btn-link text-white text-decoration-none px-2 py-0"
                style={{ lineHeight: 1 }}
                aria-label="Project options"
            >
                <FaEllipsisV />
            </Dropdown.Toggle>
            <Dropdown.Menu>
                <Dropdown.Item onClick={onOpen}>Open</Dropdown.Item>
                <Dropdown.Item onClick={onRename}>Rename</Dropdown.Item>
                <Dropdown.Item className="text-danger" onClick={onDelete}>Delete</Dropdown.Item>
            </Dropdown.Menu>
        </Dropdown>
    );
}

function ProjectList({ projects, onOpen, onCreate, onRename, onDelete }) {
    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState("");
    const [renamingId, setRenamingId] = useState(null);
    const [renameValue, setRenameValue] = useState("");

    const submitCreate = () => {
        const trimmed = newName.trim();
        if (trimmed) onCreate(trimmed);
        setNewName("");
        setCreating(false);
    };

    const startRename = (project) => {
        setRenamingId(project.id);
        setRenameValue(project.name);
    };

    const submitRename = (project) => {
        const trimmed = renameValue.trim();
        if (trimmed && trimmed !== project.name) onRename(project.id, trimmed);
        setRenamingId(null);
    };

    const handleDelete = (project) => {
        if (window.confirm(`Delete "${project.name}"? This will permanently delete all its entities too.`)) {
            onDelete(project.id);
        }
    };

    return (
        <div>
            <p className="text-uppercase fw-semibold mb-2" style={{ fontSize: "0.7rem", letterSpacing: "0.08em", color: "#adb5bd" }}>
                Projects
            </p>

            <ul className="list-unstyled">
                {projects.map(project => (
                    <li
                        key={project.id}
                        className="p-2 rounded mb-1 d-flex align-items-center justify-content-between"
                        style={{ cursor: renamingId === project.id ? "default" : "pointer" }}
                        onClick={() => renamingId !== project.id && onOpen(project.id)}
                    >
                        {renamingId === project.id ? (
                            <input
                                autoFocus
                                className="form-control form-control-sm"
                                value={renameValue}
                                onChange={e => setRenameValue(e.target.value)}
                                onClick={e => e.stopPropagation()}
                                onKeyDown={e => {
                                    if (e.key === "Enter") submitRename(project);
                                    if (e.key === "Escape") setRenamingId(null);
                                }}
                                onBlur={() => submitRename(project)}
                            />
                        ) : (
                            <>
                                <span className="text-truncate">{project.name}</span>
                                <ProjectItemMenu
                                    onOpen={() => onOpen(project.id)}
                                    onRename={() => startRename(project)}
                                    onDelete={() => handleDelete(project)}
                                />
                            </>
                        )}
                    </li>
                ))}
            </ul>

            {creating ? (
                <input
                    autoFocus
                    className="form-control form-control-sm"
                    placeholder="Project name…"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === "Enter") submitCreate();
                        if (e.key === "Escape") { setCreating(false); setNewName(""); }
                    }}
                    onBlur={submitCreate}
                />
            ) : (
                <Button variant="outline-light" size="sm" className="w-100" onClick={() => setCreating(true)}>
                    + New project
                </Button>
            )}
        </div>
    );
}

export default ProjectList;
