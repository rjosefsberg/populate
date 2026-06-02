import {useState, useEffect} from "react";
import Sidebar from "./components/Sidebar";
import EntityDetail from "./components/EntityDetail";
import EditEntityForm from "./components/EditEntityForm";
import {getEntities, createEntity, updateEntity, deleteEntity, generateEntity} from "./api/entities";
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

    const handleConfirm = (title, description, association) => {
        let body = description;
        if (association) {
            const related = entities.find(e => String(e.id) === String(association.entityId));
            if (related) {
                const label = association.label ? ` — ${association.label}` : '';
                body = `${description}\n\nAssociation: ${related.title}${label}`;
            }
        }
        createEntity({title, body})
            .then(newEntity => {
                setEntities(prev => [...prev, newEntity]);
                setSelectedEntity(newEntity);
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
                setEntities(prev => prev.map(e => e.id === id ? updated : e));
                setSelectedEntity(updated);
                setEditingEntity(null);
            });
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
                            onSave={handleSave}
                            onCancel={() => setEditingEntity(null)}
                        />
                    </div>
                ) : (
                    <EntityDetail
                        entity={selectedEntity}
                        entities={entities}
                        onEdit={setEditingEntity}
                        onDelete={handleDelete}
                    />
                )}
            </div>
        </div>
    );
}

export default App;
