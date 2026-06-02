import {useState, useEffect} from "react";
import Sidebar from "./components/Sidebar";
import EntityDetail from "./components/EntityDetail";
import EditEntityForm from "./components/EditEntityForm";
import {getEntities, createEntity, updateEntity, deleteEntity, generateEntity} from "./api/entities";
import {createAssociation} from "./api/associations";
import Button from "react-bootstrap/Button";
import React from "react";
import AddEntityModal from "./components/AddEntityModal";

function App() {
    const [entities, setEntities] = useState([]);
    const [selectedEntity, setSelectedEntity] = useState(null);
    const [editingEntity, setEditingEntity] = useState(null);
    const [modalShow, setModalShow] = React.useState(false);

    useEffect(() => {
        getEntities().then(data => setEntities(data));
    }, []);

    const handleGenerate = (prompt, entityType, hint = null) => {
        return generateEntity(entityType, prompt, hint);
    };

    const handleConfirm = (title, description, associations) => {
        createEntity({ title, body: description })
            .then(newEntity => {
                const valid = (associations || []).filter(a => a.entityId);
                return Promise.all(
                    valid.map(a => createAssociation({ entity_id_1: newEntity.id, entity_id_2: Number(a.entityId), description: a.label || '' }))
                ).then(savedAssocs => {
                    const entityWithAssocs = { ...newEntity, associations: savedAssocs };
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

    const handleSave = (id, title, body) => {
        updateEntity(id, {title, body})
            .then(updated => {
                const withAssocs = { ...updated, associations: editingEntity?.associations || [] };
                setEntities(prev => prev.map(e => e.id === id ? withAssocs : e));
                setSelectedEntity(withAssocs);
                setEditingEntity(null);
            });
    };

    const handleAssociationsChange = (updatedEntity) => {
        setEntities(prev => prev.map(e => e.id === updatedEntity.id ? updatedEntity : e));
        setEditingEntity(updatedEntity);
    };

    return (
        <div className="d-flex">
            <AddEntityModal
                show={modalShow}
                onHide={() => setModalShow(false)}
                onGenerate={handleGenerate}
                onConfirm={handleConfirm}
                entities={entities}
            />
            <Sidebar
                entities={entities}
                selectedId={selectedEntity?.id}
                onSelect={setSelectedEntity}
            >
                <Button variant="primary" onClick={() => setModalShow(true)}>Create</Button>
            </Sidebar>

            <div className="flex-grow-1">
                {editingEntity ? (
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
