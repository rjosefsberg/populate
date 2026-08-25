import {useState, useEffect} from "react";
import Sidebar from "./components/Sidebar";
import EntityDetail from "./components/EntityDetail";
import EditEntityForm from "./components/EditEntityForm";
import LoginPage from "./components/LoginPage";
import {getEntities, createEntity, updateEntity, deleteEntity} from "./api/entities";
import {createAssociation} from "./api/associations";
import {uploadAttachment} from "./api/attachments";
import {getProjects, createProject, updateProject, deleteProject} from "./api/projects";
import {getMe, logout, setUnauthorizedHandler} from "./api/client";
import Button from "react-bootstrap/Button";
import React from "react";
import AddEntityModal from "./components/AddEntityModal";
import UsageButton from "./components/UsageButton";
import SelectProjectPrompt from "./components/SelectProjectPrompt";
import SettingsModal from "./components/SettingsModal";
import AssociationGraph from "./components/AssociationGraph";
import InspectorPanel from "./components/InspectorPanel";
import { getSettings } from "./api/settings";

function App() {
    const [authenticated, setAuthenticated] = useState(null); // null = loading
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [entities, setEntities] = useState([]);
    const [selectedEntity, setSelectedEntity] = useState(null);
    const [editingEntity, setEditingEntity] = useState(null);
    const [showGraph, setShowGraph] = useState(false);
    const [inspectedEntity, setInspectedEntity] = useState(null);
    const [modalShow, setModalShow] = React.useState(false);
    const [settingsShow, setSettingsShow] = React.useState(false);
    const [settings, setSettings] = React.useState(null);

    // Redirect to login on any 401
    setUnauthorizedHandler(() => setAuthenticated(false));

    useEffect(() => {
        getMe().then(data => setAuthenticated(data.authenticated));
    }, []);

    useEffect(() => {
        if (authenticated) {
            getProjects().then(data => setProjects(data));
            getSettings().then(data => setSettings(data));
        }
    }, [authenticated]);

    // Clears whichever entity is selected/edited/inspected, without
    // touching the project list itself. Shared by every handler that leaves
    // or resets the current project's entity view.
    const resetEntitySelection = () => {
        setSelectedEntity(null);
        setEditingEntity(null);
        setShowGraph(false);
        setInspectedEntity(null);
    };

    useEffect(() => {
        if (authenticated && selectedProjectId) {
            getEntities(selectedProjectId).then(data => setEntities(data));
            resetEntitySelection();
        }
    }, [authenticated, selectedProjectId]);

    // Selecting a different entity from the sidebar (as opposed to recentering
    // the graph on a neighbor) should drop back to the detail view.
    const handleSelectEntity = (entity) => {
        setSelectedEntity(entity);
        setShowGraph(false);
    };

    // Edit, whether launched from the detail page or the inspector panel,
    // always exits the graph/panel and shows the edit form.
    const handleOpenEdit = (entity) => {
        setShowGraph(false);
        setInspectedEntity(null);
        setEditingEntity(entity);
    };

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
                resetEntitySelection();
            }
        });
    };

    const handleBackToProjects = () => {
        setSelectedProjectId(null);
        setEntities([]);
        resetEntitySelection();
    };

    const handleLogout = () => {
        logout().then(() => {
            setAuthenticated(false);
            setProjects([]);
            setSelectedProjectId(null);
            setEntities([]);
            resetEntitySelection();
        });
    };

    const handleConfirm = (title, entityType, description, associations, files) => {
        createEntity({title, entity_type: entityType, body: description, project_id: selectedProjectId})
            .then(newEntity => {
                const valid = (associations || []).filter(a => a.entityId);
                return Promise.all([
                    Promise.all(valid.map(a => createAssociation({
                        entity_id_1: newEntity.id,
                        entity_id_2: Number(a.entityId),
                        description: a.label || ""
                    }))),
                    Promise.all((files || []).map(file => uploadAttachment(newEntity.id, file))),
                ]).then(([savedAssocs, savedAttachments]) => {
                    const entityWithAssocs = {...newEntity, associations: savedAssocs, attachments: savedAttachments};
                    setEntities(prev => [...prev, entityWithAssocs]);
                    setSelectedEntity(entityWithAssocs);
                });
            });
    };

    const handleDelete = (id) => {
        deleteEntity(id).then(() => {
            setEntities(prev => prev.filter(e => e.id !== id));
            setSelectedEntity(null);
            // Only close the inspector if it's showing the entity that was
            // just deleted — it may be open on an unrelated entity (e.g. the
            // user inspected one entity from the graph, then switched back
            // to the detail view of a different one and deleted that).
            setInspectedEntity(prev => (prev?.id === id ? null : prev));
        });
    };

    const handleSave = (id, title, entityType, body) => {
        updateEntity(id, {title, entity_type: entityType, body})
            .then(updated => {
                const withExtras = {
                    ...updated,
                    associations: editingEntity?.associations || [],
                    attachments: editingEntity?.attachments || [],
                };
                setEntities(prev => prev.map(e => e.id === id ? withExtras : e));
                setSelectedEntity(withExtras);
                setEditingEntity(null);
            });
    };

    const handleAssociationsChange = (updatedEntity) => {
        setEntities(prev => prev.map(e => e.id === updatedEntity.id ? updatedEntity : e));
        setEditingEntity(updatedEntity);
    };

    const handleAttachmentsChange = (updatedEntity) => {
        setEntities(prev => prev.map(e => e.id === updatedEntity.id ? updatedEntity : e));
        setEditingEntity(updatedEntity);
    };

    const handleEntityChange = (updatedEntity) => {
        setEntities(prev => prev.map(e => e.id === updatedEntity.id ? updatedEntity : e));
        setSelectedEntity(updatedEntity);
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
            <SettingsModal
                show={settingsShow}
                onHide={() => setSettingsShow(false)}
                onSettingsChange={setSettings}
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
                onSelect={handleSelectEntity}
                hideEntityList={showGraph}
                footer={
                    <div>
                        <button className="btn btn-outline-secondary btn-sm w-100" style={{fontSize: "0.75rem"}}
                                onClick={() => setSettingsShow(true)}>
                            Settings
                        </button>
                        <button className="btn btn-outline-secondary btn-sm w-100 mt-2" style={{fontSize: "0.75rem"}}
                                onClick={handleLogout}>
                            Sign out
                        </button>
                        {settings?.api_key_populated && <UsageButton/>}
                    </div>
                }
            >
                <Button variant="primary" onClick={() => setModalShow(true)}>Create</Button>
                {selectedEntity && !editingEntity && (
                    <Button
                        variant={showGraph ? "secondary" : "outline-secondary"}
                        className="mt-2"
                        onClick={() => setShowGraph(prev => !prev)}
                    >
                        {showGraph ? "Details view" : "Graph view"}
                    </Button>
                )}
            </Sidebar>

            <div className="flex-grow-1">
                {!selectedProjectId ? (
                    <SelectProjectPrompt/>
                ) : showGraph && selectedEntity ? (
                    <div style={{ height: "100vh" }}>
                        <AssociationGraph
                            entity={selectedEntity}
                            entities={entities}
                            onFocusEntity={setSelectedEntity}
                            onInspectEntity={setInspectedEntity}
                        />
                    </div>
                ) : editingEntity ? (
                    <div className="p-4">
                        <EditEntityForm
                            entity={editingEntity}
                            entities={entities}
                            onSave={handleSave}
                            onCancel={() => setEditingEntity(null)}
                            onAssociationsChange={handleAssociationsChange}
                            onAttachmentsChange={handleAttachmentsChange}
                        />
                    </div>
                ) : (
                    <EntityDetail
                        entity={selectedEntity}
                        onEdit={handleOpenEdit}
                        onDelete={handleDelete}
                        onEntityChange={handleEntityChange}
                    />
                )}
            </div>

            <InspectorPanel
                entity={inspectedEntity}
                onClose={() => setInspectedEntity(null)}
                onEdit={handleOpenEdit}
            />
        </div>
    );
}

export default App;
