import { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import AddEntityForm from "./AddEntityForm";

function AddEntityModal({show, onHide, onGenerate, onConfirm}) {
    const [step, setStep] = useState('form');
    const [preview, setPreview] = useState({ title: '', description: '' });
    const [entityContext, setEntityContext] = useState({ prompt: '', entityType: '' });
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
        onConfirm(preview.title, preview.description);
        handleClose();
    };

    const handleClose = () => {
        setStep('form');
        setPreview({ title: '', description: '' });
        setEntityContext({ prompt: '', entityType: '' });
        setHint('');
        onHide();
    };

    return (
        <Modal show={show} onHide={regenerating ? undefined : handleClose} animation={false} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>{step === 'form' ? 'Create Entity' : 'Preview'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {step === 'form' && (
                    <AddEntityForm onAdd={handleGenerate} />
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
                        <div className="d-flex gap-2">
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
