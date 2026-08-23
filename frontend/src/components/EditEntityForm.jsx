import { useState } from "react";
import Button from "react-bootstrap/Button";
import { createAssociation, deleteAssociation } from "../api/associations";
import RichTextEditor from "./RichTextEditor";
import AssistChatPanel from "./AssistChatPanel";

function EditEntityForm({ entity, entities, onSave, onCancel, onAssociationsChange }) {
    const [title, setTitle] = useState(entity.title);
    const [body, setBody] = useState(entity.body);
    const [associations, setAssociations] = useState(entity.associations || []);
    const [newTargetId, setNewTargetId] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [addingAssoc, setAddingAssoc] = useState(false);
    const [helpOpen, setHelpOpen] = useState(false);

    const otherEntities = entities.filter(e => e.id !== entity.id);

    const handleAddAssociation = () => {
        if (!newTargetId) return;
        setAddingAssoc(true);
        createAssociation({
            entity_id_1: entity.id,
            entity_id_2: parseInt(newTargetId),
            description: newDescription.trim()
        }).then(assoc => {
            const updated = [...associations, assoc];
            setAssociations(updated);
            onAssociationsChange?.({ ...entity, title, body, associations: updated });
            setNewTargetId('');
            setNewDescription('');
        }).finally(() => setAddingAssoc(false));
    };

    const handleDeleteAssociation = (id) => {
        deleteAssociation(id).then(() => {
            const updated = associations.filter(a => a.id !== id);
            setAssociations(updated);
            onAssociationsChange?.({ ...entity, title, body, associations: updated });
        });
    };

    const labelStyle = { fontSize: '0.7rem', letterSpacing: '0.08em', color: '#6c757d' };

    return (
        <div className="d-flex gap-4" style={{ maxWidth: helpOpen ? 1080 : 720 }}>
            <div className="flex-grow-1" style={{ minWidth: 0 }}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="mb-0 fw-semibold">Edit Entity</h4>
                    <div className="d-flex gap-2">
                        <Button
                            variant={helpOpen ? "secondary" : "outline-secondary"}
                            size="sm"
                            onClick={() => setHelpOpen(o => !o)}
                        >
                            {helpOpen ? "Hide help" : "Get help"}
                        </Button>
                        <Button variant="outline-secondary" size="sm" onClick={onCancel}>Cancel</Button>
                        <Button variant="primary" size="sm" onClick={() => onSave(entity.id, title, body)}>Save</Button>
                    </div>
                </div>

                <div className="mb-4">
                    <label className="form-label text-uppercase fw-semibold" style={labelStyle}>Title</label>
                    <input
                        className="form-control form-control-lg border-0 border-bottom rounded-0 px-0 fw-semibold"
                        style={{ fontSize: '1.4rem', boxShadow: 'none' }}
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                    />
                </div>

                <div className="mb-5">
                    <label className="form-label text-uppercase fw-semibold d-block" style={labelStyle}>Description</label>
                    <RichTextEditor value={body} onChange={setBody} />
                </div>

                <div>
                    <p className="text-uppercase fw-semibold mb-3" style={labelStyle}>Associations</p>

                    {associations.length > 0 && (
                        <ul className="list-group list-group-flush mb-3">
                            {associations.map(a => {
                                const linkedTitle = a.entity_id_1 === entity.id ? a.entity_2_title : a.entity_1_title;
                                return (
                                    <li key={a.id} className="list-group-item px-0 d-flex justify-content-between align-items-start py-2">
                                        <div>
                                            <span className="fw-semibold me-2">{linkedTitle}</span>
                                            {a.description && <span className="text-muted">{a.description}</span>}
                                        </div>
                                        <button
                                            className="btn btn-link btn-sm text-danger p-0 ms-3"
                                            onClick={() => handleDeleteAssociation(a.id)}
                                        >
                                            ×
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    {otherEntities.length > 0 && (
                        <div className="d-flex gap-2 align-items-center">
                            <select
                                className="form-select form-select-sm"
                                style={{ maxWidth: 200 }}
                                value={newTargetId}
                                onChange={e => setNewTargetId(e.target.value)}
                                disabled={addingAssoc}
                            >
                                <option value="">Link to…</option>
                                {otherEntities.map(e => (
                                    <option key={e.id} value={e.id}>{e.title}</option>
                                ))}
                            </select>
                            <input
                                className="form-control form-control-sm"
                                placeholder="Describe the relationship…"
                                value={newDescription}
                                onChange={e => setNewDescription(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && !addingAssoc && newTargetId && handleAddAssociation()}
                                disabled={addingAssoc}
                            />
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={handleAddAssociation}
                                disabled={addingAssoc || !newTargetId}
                                style={{ whiteSpace: 'nowrap' }}
                            >
                                + Add
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {helpOpen && (
                <div className="border-start ps-4" style={{ width: 340, flexShrink: 0 }}>
                    <AssistChatPanel entities={otherEntities} currentEntity={{ title, body }} />
                </div>
            )}
        </div>
    );
}

export default EditEntityForm;
