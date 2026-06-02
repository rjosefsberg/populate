import { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

function AddAssociationModal({ show, onHide, currentEntityId, entities, onAdd }) {
    const [targetId, setTargetId] = useState('');
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);

    const otherEntities = entities.filter(e => e.id !== currentEntityId);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!targetId || !description.trim()) return;
        setSaving(true);
        Promise.resolve(onAdd({
            entity_id_1: currentEntityId,
            entity_id_2: parseInt(targetId),
            description: description.trim()
        })).finally(() => {
            setSaving(false);
            handleClose();
        });
    };

    const handleClose = () => {
        setTargetId('');
        setDescription('');
        onHide();
    };

    return (
        <Modal show={show} onHide={saving ? undefined : handleClose} animation={false}>
            <Modal.Header closeButton>
                <Modal.Title>Add Association</Modal.Title>
            </Modal.Header>
            <form onSubmit={handleSubmit}>
                <Modal.Body>
                    <div className="mb-3">
                        <label className="form-label fw-semibold">Link to</label>
                        <select
                            className="form-select"
                            value={targetId}
                            onChange={e => setTargetId(e.target.value)}
                            disabled={saving}
                            required
                        >
                            <option value="">Select an entity…</option>
                            {otherEntities.map(e => (
                                <option key={e.id} value={e.id}>{e.title}</option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-3">
                        <label className="form-label fw-semibold">Description</label>
                        <textarea
                            className="form-control"
                            rows={3}
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            disabled={saving}
                            placeholder="Describe the relationship…"
                            required
                        />
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose} disabled={saving}>Cancel</Button>
                    <Button variant="primary" type="submit" disabled={saving || !targetId || !description.trim()}>
                        {saving ? 'Saving…' : 'Add'}
                    </Button>
                </Modal.Footer>
            </form>
        </Modal>
    );
}

export default AddAssociationModal;
