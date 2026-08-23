import {useState, useEffect} from "react";
import Sidebar from "./components/Sidebar";
import EntityDetail from "./components/EntityDetail";
import EditEntityForm from "./components/EditEntityForm";
import LoginPage from "./components/LoginPage";
import {getEntities, createEntity, updateEntity, deleteEntity} from "./api/entities";
import {createAssociation} from "./api/associations";
import {getProjects, createProject, updateProject, deleteProject} from "./api/projects";
import {getMe, logout, setUnauthorizedHandler} from "./api/client";
import Button from "react-bootstrap/Button";
import React from "react";
import AddEntityModal from "./components/AddEntityModal";
import UsageButton from "./components/UsageButton";
import SelectProjectPrompt from "./components/SelectProjectPrompt";

function App() {
    const [authenticated, setAuthenticated] = useState(null); // null = loading
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [entities, setEntities] = useState([]);
    const [selectedEntity, setSelectedEntity] = useState(null);
    const [editingEntity, setEditingEntity] = useState(null);
    const [modalShow, setModalShow] = React.useState(false);

    // Redirect to login on any 401
    setUnauthorizedHandler(() => setAuthenticated(false));

    useEffect(() => {
        getMe().then(data => setAuthenticated(data.authenticated));
    }, []);

    useEffect(() => {
        if (authenticated) {
            getProjects().then(data => setProjects(data));
        }
    }, [authenticated]);

    useEffect(() => {
        if (authenticated && selectedProjectId) {
            getEntities(selectedProjectId).then(data => setEntities(data));
            setSelectedEntity(null);
            setEditingEntity(null);
        }
    }, [authenticated, selectedProjectId]);

    const handleCreateProject = (name) => {
        createProject({name}).then(newProject => {
            setProjects(prev => [...prev, newProject]);
        });
    };

    const handleRenameProject = (id, name) => {
        updateProject(id, {name}).then(updated => {
            setProjects(prev => prev.map(p => p.id === id ? updated : p));
        });
    };

    const handleDeleteProject = (id) => {
        deleteProject(id).then(() => {
            setProjects(prev => prev.filter(p => p.id !== id));
            if (selectedProjectId === id) {
                setSelectedProjectId(null);
                setEntities([]);
                setSelectedEntity(null);
                setEditingEntity(null);
            }
        });
    };

    const handleBackToProjects = () => {
        setSelectedProjectId(null);
        setEntities([]);
        setSelectedEntity(null);
        setEditingEntity(null);
    };

    const handleLogout = () => {
        logout().then(() => {
            setAuthenticated(false);
            setProjects([]);
            setSelectedProjectId(null);
            setEntities([]);
            setSelectedEntity(null);
            setEditingEntity(null);
        });
    };

    const handleConfirm = (title, entityType, description, associations) => {
        createEntity({title, entity_type: entityType, body: description, project_id: selectedProjectId})
            .then(newEntity => {
                const valid = (associations || []).filter(a => a.entityId);
                return Promise.all(
                    valid.map(a => createAssociation({
                        entity_id_1: newEntity.id,
                        entity_id_2: Number(a.entityId),
                        description: a.label || ""
                    }))
                ).then(savedAssocs => {
                    const entityWithAssocs = {...newEntity, associations: savedAssocs};
                    setEntities(prev => [...prev, entityWithAssocs]);
                    setSelectedEntity(entityWithAssocs);
                });
            });
    };

    const handleDelete = (id) => {
        deleteEntity(id).then(() => {
            setEntities(prev => prev.filter(e => e.id !== id));
            setSelectedEntity(null);
        });
    };

    const handleSave = (id, title, entityType, body) => {
        updateEntity(id, {title, entity_type: entityType, body})
            .then(updated => {
                const withAssocs = {...updated, associations: editingEntity?.associations || []};
                setEntities(prev => prev.map(e => e.id === id ? withAssocs : e));
                setSelectedEntity(withAssocs);
                setEditingEntity(null);
            });
    };

    const handleAssociationsChange = (updatedEntity) => {
        setEntities(prev => prev.map(e => e.id === updatedEntity.id ? updatedEntity : e));
        setEditingEntity(updatedEntity);
    };

    if (authenticated === null) return null; // loading splash
    if (!authenticated) return <LoginPage onLogin={() => setAuthenticated(true)}/>;

    return (
        <div className="d-flex">
            <AddEntityModal
                show={modalShow}
                onHide={() => setModalShow(false)}
                onConfirm={handleConfirm}
                entities={entities}
            />
            <Sidebar
                mode={selectedProjectId ? "entities" : "projects"}
                projects={projects}
                onOpenProject={setSelectedProjectId}
                onCreateProject={handleCreateProject}
                onRenameProject={handleRenameProject}
                onDeleteProject={handleDeleteProject}
                projectName={projects.find(p => p.id === selectedProjectId)?.name}
                onBackToProjects={handleBackToProjects}
                entities={entities}
                selectedId={selectedEntity?.id}
                onSelect={setSelectedEntity}
                footer={
                    <div>
                        <button className="btn btn-outline-secondary btn-sm w-100" style={{fontSize: "0.75rem"}}
                                onClick={handleLogout}>
                            Sign out
                        </button>
                        <UsageButton/>
                    </div>
                }
            >
                <Button variant="primary" onClick={() => setModalShow(true)}>Create</Button>
            </Sidebar>

            <div className="flex-grow-1">
                {!selectedProjectId ? (
                    <SelectProjectPrompt/>
                ) : editingEntity ? (
                    <div className="p-4">
                        <EditEntityForm
                            entity={editingEntity}
                            entities={entities}
                            onSave={handleSave}
                            onCancel={() => setEditingEntity(null)}
                            onAssociationsChange={handleAssociationsChange}
                        />
                    </div>
                ) : (
                    <EntityDetail
                        entity={selectedEntity}
                        onEdit={setEditingEntity}
                        onDelete={handleDelete}
                    />
                )}
            </div>
        </div>
    );
}

export default App;
