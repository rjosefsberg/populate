import { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import RichTextEditor from "./RichTextEditor";
import AssistChatPanel from "./AssistChatPanel";

const labelStyle = { fontSize: '0.7rem', letterSpacing: '0.08em', color: '#6c757d' };
const colLabel = { ...labelStyle, fontSize: '0.65rem' };

function AssociationRows({ associations, entities, onChange, disabled }) {
    const updateRow = (i, patch) => {
        onChange(associations.map((a, idx) => idx === i ? { ...a, ...patch } : a));
    };
    const removeRow = (i) => {
        onChange(associations.filter((_, idx) => idx !== i));
    };
    const addRow = () => {
        onChange([...associations, { entityId: '', label: '' }]);
    };

    return (
        <div>
            <p className="text-uppercase fw-semibold mb-2" style={labelStyle}>Associations</p>

            {associations.length > 0 && (
                <div className="mb-2">
                    <div className="row g-2 mb-1">
                        <div className="col-5"><span className="text-uppercase fw-semibold" style={colLabel}>Entity</span></div>
                        <div className="col-6"><span className="text-uppercase fw-semibold" style={colLabel}>Description</span></div>
                    </div>
                    {associations.map((assoc, i) => (
                        <div key={i} className="row g-2 mb-2 align-items-center">
                            <div className="col-5">
                                <select
                                    className="form-select form-select-sm"
                                    value={assoc.entityId}
                                    onChange={e => updateRow(i, { entityId: e.target.value })}
                                    disabled={disabled}
                                >
                                    <option value="">Select entity…</option>
                                    {entities.map(e => (
                                        <option key={e.id} value={e.id}>{e.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-6">
                                <input
                                    className="form-control form-control-sm"
                                    placeholder="Describe the relationship…"
                                    value={assoc.label}
                                    onChange={e => updateRow(i, { label: e.target.value })}
                                    disabled={disabled}
                                />
                            </div>
                            <div className="col-1 text-center">
                                <button
                                    className="btn btn-link btn-sm text-danger p-0"
                                    onClick={() => removeRow(i)}
                                    disabled={disabled}
                                    type="button"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Button variant="outline-secondary" size="sm" onClick={addRow} disabled={disabled} type="button">
                + Add association
            </Button>
        </div>
    );
}

const isBodyEmpty = (html) => !html || !html.replace(/<[^>]+>/g, '').trim();

function AddEntityModal({ show, onHide, onConfirm, entities = [] }) {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [associations, setAssociations] = useState([]);
    const [helpOpen, setHelpOpen] = useState(false);

    const canConfirm = title.trim() && !isBodyEmpty(body);

    const handleConfirm = () => {
        if (!canConfirm) return;
        onConfirm(title.trim(), body, associations.filter(a => a.entityId));
        handleClose();
    };

    const handleClose = () => {
        setTitle('');
        setBody('');
        setAssociations([]);
        setHelpOpen(false);
        onHide();
    };

    return (
        <Modal show={show} onHide={handleClose} backdrop="static" animation={false} size={helpOpen ? "xl" : "lg"}>
            <Modal.Header closeButton>
                <Modal.Title className="fw-semibold">Create Entity</Modal.Title>
            </Modal.Header>
            <Modal.Body className="px-4 py-4">
                <div className="d-flex gap-4">
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                        <div className="mb-3">
                            <label className="form-label text-uppercase fw-semibold" style={labelStyle}>Title</label>
                            <input
                                className="form-control"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Enter a name…"
                                autoFocus
                            />
                        </div>

                        <div className="mb-4">
                            <label className="form-label text-uppercase fw-semibold d-block" style={labelStyle}>Description</label>
                            <RichTextEditor value={body} onChange={setBody} placeholder="Write a description…" />
                        </div>

                        {entities.length > 0 && (
                            <div className="pt-3 border-top">
                                <AssociationRows
                                    associations={associations}
                                    entities={entities}
                                    onChange={setAssociations}
                                    disabled={false}
                                />
                            </div>
                        )}
                    </div>

                    {helpOpen && (
                        <div className="border-start ps-4" style={{ width: 340, flexShrink: 0 }}>
                            <AssistChatPanel />
                        </div>
                    )}
                </div>
            </Modal.Body>
            <Modal.Footer className="d-flex justify-content-between">
                <Button
                    variant={helpOpen ? "secondary" : "outline-secondary"}
                    size="sm"
                    onClick={() => setHelpOpen(o => !o)}
                >
                    {helpOpen ? "Hide help" : "Get help"}
                </Button>
                <div className="d-flex gap-2">
                    <Button variant="outline-secondary" onClick={handleClose}>Cancel</Button>
                    <Button variant="success" onClick={handleConfirm} disabled={!canConfirm}>Create</Button>
                </div>
            </Modal.Footer>
        </Modal>
    );
}

export default AddEntityModal;
