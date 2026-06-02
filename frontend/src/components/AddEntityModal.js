import { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import AddEntityForm from "./AddEntityForm";

function AddEntityModal({show, onHide, onGenerate, onConfirm, entities = []}) {
    const [step, setStep] = useState('form');
    const [preview, setPreview] = useState({ title: '', description: '' });
    const [entityContext, setEntityContext] = useState({ prompt: '', entityType: '' });
    const [associations, setAssociations] = useState([]);
    const [newTargetId, setNewTargetId] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [hint, setHint] = useState('');
    const [regenerating, setRegenerating] = useState(false);

    const handleGenerate = (prompt, entityType) => {
        return Promise.resolve(onGenerate(prompt, entityType)).then(result => {
            setEntityContext({ prompt, entityType });
            setPreview({ title: prompt, description: result.description });
            setHint('');
            setStep('preview');
        });
    };

    const handleRegenerate = () => {
        setRegenerating(true);
        Promise.resolve(onGenerate(entityContext.prompt, entityContext.entityType, hint.trim() || null))
            .then(result => {
                setPreview(p => ({ ...p, description: result.description }));
                setHint('');
            })
            .finally(() => setRegenerating(false));
    };

    const handleAddAssociation = () => {
        if (!newTargetId) return;
        setAssociations(prev => [...prev, { entityId: newTargetId, label: newDescription.trim() }]);
        setNewTargetId('');
        setNewDescription('');
    };

    const handleRemoveAssociation = (index) => {
        setAssociations(prev => prev.filter((_, i) => i !== index));
    };

    const handleConfirm = () => {
        onConfirm(preview.title, preview.description, associations);
        handleClose();
    };

    const handleClose = () => {
        setStep('form');
        setPreview({ title: '', description: '' });
        setEntityContext({ prompt: '', entityType: '' });
        setAssociations([]);
        setNewTargetId('');
        setNewDescription('');
        setHint('');
        onHide();
    };

    return (
        <Modal show={show} onHide={handleClose} backdrop="static" animation={false} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>{step === 'form' ? 'Create Entity' : 'Preview'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {step === 'form' && (
                    <AddEntityForm onAdd={handleGenerate} entities={entities} />
                )}
                {step === 'preview' && (
                    <div>
                        <div className="mb-3">
                            <label className="form-label fw-semibold">Title</label>
                            <input
                                className="form-control"
                                value={preview.title}
                                onChange={e => setPreview(p => ({ ...p, title: e.target.value }))}
                                disabled={regenerating}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label fw-semibold">Description</label>
                            <textarea
                                className="form-control"
                                rows={8}
                                value={preview.description}
                                onChange={e => setPreview(p => ({ ...p, description: e.target.value }))}
                                disabled={regenerating}
                            />
                        </div>
                        <div className="d-flex gap-2 mb-3">
                            <input
                                className="form-control form-control-sm"
                                placeholder="Regeneration hint (e.g. make it darker, shorter…)"
                                value={hint}
                                onChange={e => setHint(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && !regenerating && handleRegenerate()}
                                disabled={regenerating}
                            />
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={handleRegenerate}
                                disabled={regenerating}
                                style={{ whiteSpace: 'nowrap' }}
                            >
                                {regenerating ? 'Generating…' : 'Regenerate'}
                            </Button>
                        </div>
                        {entities.length > 0 && (
                            <div>
                                <label className="form-label fw-semibold">Associations</label>
                                {associations.length > 0 && (
                                    <ul className="list-group list-group-flush mb-2">
                                        {associations.map((assoc, i) => {
                                            const linked = entities.find(e => String(e.id) === String(assoc.entityId));
                                            return (
                                                <li key={i} className="list-group-item px-0 py-2 d-flex justify-content-between align-items-start">
                                                    <div>
                                                        <span className="fw-semibold me-2">{linked?.title}</span>
                                                        {assoc.label && <span className="text-muted">{assoc.label}</span>}
                                                    </div>
                                                    <button
                                                        className="btn btn-link btn-sm text-danger p-0 ms-3"
                                                        onClick={() => handleRemoveAssociation(i)}
                                                        disabled={regenerating}
                                                    >
                                                        ×
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                                <div className="d-flex gap-2 align-items-center">
                                    <select
                                        className="form-select form-select-sm"
                                        style={{ maxWidth: 200 }}
                                        value={newTargetId}
                                        onChange={e => setNewTargetId(e.target.value)}
                                        disabled={regenerating}
                                    >
                                        <option value="">Link to…</option>
                                        {entities.map(e => (
                                            <option key={e.id} value={e.id}>{e.title}</option>
                                        ))}
                                    </select>
                                    <input
                                        className="form-control form-control-sm"
                                        placeholder="Describe the relationship…"
                                        value={newDescription}
                                        onChange={e => setNewDescription(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && !regenerating && newTargetId && handleAddAssociation()}
                                        disabled={regenerating}
                                    />
                                    <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        onClick={handleAddAssociation}
                                        disabled={regenerating || !newTargetId}
                                        style={{ whiteSpace: 'nowrap' }}
                                    >
                                        + Add
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal.Body>
            {step === 'preview' && (
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setStep('form')} disabled={regenerating}>Back</Button>
                    <Button variant="danger" onClick={handleClose} disabled={regenerating}>Discard</Button>
                    <Button variant="success" onClick={handleConfirm} disabled={regenerating}>Confirm</Button>
                </Modal.Footer>
            )}
        </Modal>
    );
}

export default AddEntityModal;
