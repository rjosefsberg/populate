import {useState, useEffect} from "react";
import Sidebar from "./components/Sidebar";
import EntityDetail from "./components/EntityDetail";
import AddEntityForm from "./components/AddEntityForm";
import EditEntityForm from "./components/EditEntityForm";
import PreviewCard from "./components/PreviewCard";
import {getEntities, createEntity, updateEntity, deleteEntity, generateEntity} from "./api/entities";
import Button from "react-bootstrap/Button";
import React from "react";
import AddEntityModal from "./components/AddEntityModal";

function App() {
    const [entities, setEntities] = useState([]);
    const [selectedEntity, setSelectedEntity] = useState(null);
    const [editingEntity, setEditingEntity] = useState(null);
    const [preview, setPreview] = useState(null);
    const [pendingTitle, setPendingTitle] = useState("");
    const [modalShow, setModalShow] = React.useState(false);
    useEffect(() => {
        getEntities().then(data => setEntities(data));
    }, []);


    const handleAdd = (prompt, entityType) => {
        generateEntity(entityType, prompt)
            .then(result => {
                setPreview({title: prompt, description: result.description});
                setPendingTitle(prompt);
            });
    };

    const handleConfirm = () => {
        createEntity({title: pendingTitle, body: preview.description})
            .then(newEntity => {
                setEntities(prev => [...prev, newEntity]);
                setSelectedEntity(newEntity);
                setPreview(null);
                setPendingTitle("");
            });
    };

    const handleDiscard = () => {
        setPreview(null);
        setPendingTitle("");
    };

    const handleDelete = (id) => {
        deleteEntity(id).then(() => {
            setEntities(prev => prev.filter(e => e.id !== id));
            setSelectedEntity(null);
        });
    };

    const handleSave = (id, title, body) => {
        updateEntity(id, {title, body: body})
            .then(updated => {
                setEntities(prev => prev.map(e => e.id === id ? updated : e));
                setSelectedEntity(updated);
                setEditingEntity(null);
            });
    };

    const createClick = () => {
        console.log("Create button clicked");
        setModalShow(true);

    }

    return (

        <div className="d-flex">
            <AddEntityModal show={modalShow} onHide={() => setModalShow(false)}></AddEntityModal>
            <Sidebar
                entities={entities}
                selectedId={selectedEntity?.id}
                onSelect={setSelectedEntity}
            >
                {/*<AddEntityForm onAdd={handleAdd} />*/}

                <Button variant="primary" onClick={createClick}>Create</Button>
            </Sidebar>

            <div className="flex-grow-1">
                {preview && (
                    <div className="p-4">
                        <PreviewCard
                            preview={preview}
                            onConfirm={handleConfirm}
                            onDiscard={handleDiscard}
                        />
                    </div>
                )}

                {!preview && editingEntity && (
                    <div className="p-4">
                        <EditEntityForm
                            entity={editingEntity}
                            onSave={handleSave}
                            onCancel={() => setEditingEntity(null)}
                        />
                    </div>
                )}

                {!preview && !editingEntity && (
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