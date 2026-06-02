import { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import AddEntityForm from "./AddEntityForm";

const emptyAssociation = () => ({ entityId: '', label: '' });

function AddEntityModal({show, onHide, onGenerate, onConfirm, entities = []}) {
    const [step, setStep] = useState('form');
    const [preview, setPreview] = useState({ title: '', description: '' });
    const [entityContext, setEntityContext] = useState({ prompt: '', entityType: '' });
    const [associations, setAssociations] = useState([emptyAssociation()]);
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

    const handleConfirm = () => {
        const validAssociations = associations.filter(a => a.entityId);
        onConfirm(preview.title, preview.description, validAssociations);
        handleClose();
    };

    const handleClose = () => {
        setStep('form');
        setPreview({ title: '', description: '' });
        setEntityContext({ prompt: '', entityType: '' });
        setAssociations([emptyAssociation()]);
        setHint('');
        onHide();
    };

    const updateAssociation = (index, patch) => {
        setAssociations(prev => prev.map((a, i) => i === index ? { ...a, ...patch } : a));
    };

    const addAssociation = () => {
        setAssociations(prev => [...prev, emptyAssociation()]);
    };

    const removeAssociation = (index) => {
        setAssociations(prev => prev.length === 1 ? [emptyAssociation()] : prev.filter((_, i) => i !== index));
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
                                {associations.map((assoc, i) => (
                                    <div key={i} className="d-flex gap-2 mb-2 align-items-center">
                                        <select
                                            className="form-select form-select-sm border-secondary"
                                            value={assoc.entityId}
                                            onChange={e => updateAssociation(i, { entityId: e.target.value, label: e.target.value ? assoc.label : '' })}
                                            disabled={regenerating}
                                        >
                                            <option value="">No association</option>
                                            {entities.map(e => (
                                                <option key={e.id} value={e.id}>{e.title}</option>
                                            ))}
                                        </select>
                                        {assoc.entityId && (
                                            <input
                                                className="form-control form-control-sm border-secondary"
                                                placeholder="Describe the association…"
                                                value={assoc.label}
                                                onChange={e => updateAssociation(i, { label: e.target.value })}
                                                disabled={regenerating}
                                            />
                                        )}
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => removeAssociation(i)}
                                            disabled={regenerating}
                                            style={{ whiteSpace: 'nowrap' }}
                                        >
                                            ✕
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={addAssociation}
                                    disabled={regenerating}
                                >
                                    + Add association
                                </Button>
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
