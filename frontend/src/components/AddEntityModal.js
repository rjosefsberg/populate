import { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import AddEntityForm from "./AddEntityForm";

const labelStyle = { fontSize: '0.7rem', letterSpacing: '0.08em', color: '#6c757d' };

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
                        <div className="col-5">
                            <span className="text-uppercase fw-semibold" style={{ ...labelStyle, fontSize: '0.65rem' }}>Entity</span>
                        </div>
                        <div className="col-6">
                            <span className="text-uppercase fw-semibold" style={{ ...labelStyle, fontSize: '0.65rem' }}>Description</span>
                        </div>
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

function AddEntityModal({ show, onHide, onGenerate, onConfirm, entities = [] }) {
    const [step, setStep] = useState('form');
    const [preview, setPreview] = useState({ title: '', description: '' });
    const [entityContext, setEntityContext] = useState({ prompt: '', entityType: '' });
    const [associations, setAssociations] = useState([]);
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
        onConfirm(preview.title, preview.description, associations.filter(a => a.entityId));
        handleClose();
    };

    const handleClose = () => {
        setStep('form');
        setPreview({ title: '', description: '' });
        setEntityContext({ prompt: '', entityType: '' });
        setAssociations([]);
        setHint('');
        onHide();
    };

    return (
        <Modal show={show} onHide={handleClose} backdrop="static" animation={false} size="lg">
            <Modal.Header closeButton>
                <Modal.Title className="fw-semibold">{step === 'form' ? 'Create Entity' : 'Preview'}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="px-4 py-4">
                {step === 'form' && (
                    <div>
                        <AddEntityForm onAdd={handleGenerate} />
                        {entities.length > 0 && (
                            <div className="mt-4 pt-3 border-top">
                                <AssociationRows
                                    associations={associations}
                                    entities={entities}
                                    onChange={setAssociations}
                                    disabled={false}
                                />
                            </div>
                        )}
                    </div>
                )}
                {step === 'preview' && (
                    <div>
                        <div className="mb-3">
                            <label className="form-label text-uppercase fw-semibold" style={labelStyle}>Title</label>
                            <input
                                className="form-control"
                                value={preview.title}
                                onChange={e => setPreview(p => ({ ...p, title: e.target.value }))}
                                disabled={regenerating}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label text-uppercase fw-semibold" style={labelStyle}>Description</label>
                            <textarea
                                className="form-control"
                                rows={8}
                                value={preview.description}
                                onChange={e => setPreview(p => ({ ...p, description: e.target.value }))}
                                disabled={regenerating}
                            />
                        </div>
                        <div className="d-flex gap-2 mb-4">
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
                            <div className="pt-3 border-top">
                                <AssociationRows
                                    associations={associations}
                                    entities={entities}
                                    onChange={setAssociations}
                                    disabled={regenerating}
                                />
                            </div>
                        )}
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer>
                {step === 'form' ? (
                    <Button variant="outline-secondary" onClick={handleClose}>Cancel</Button>
                ) : (
                    <>
                        <Button variant="outline-secondary" onClick={() => setStep('form')} disabled={regenerating}>Back</Button>
                        <Button variant="danger" onClick={handleClose} disabled={regenerating}>Discard</Button>
                        <Button variant="success" onClick={handleConfirm} disabled={regenerating}>Confirm</Button>
                    </>
                )}
            </Modal.Footer>
        </Modal>
    );
}

export default AddEntityModal;
