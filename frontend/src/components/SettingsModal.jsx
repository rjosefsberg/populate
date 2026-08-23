import { useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { getSettings, updateSetting, checkApiKey } from '../api/settings';

function SettingsModal({ show, onHide, onSettingsChange }) {
    const [data, setData] = useState(null);
    const [editingKey, setEditingKey] = useState(null);
    const [draft, setDraft] = useState('');
    const [saving, setSaving] = useState(false);
    const [checking, setChecking] = useState(false);
    const [checkFailed, setCheckFailed] = useState(false);

    useEffect(() => {
        if (!show) return;
        setEditingKey(null);
        setCheckFailed(false);
        getSettings().then(result => {
            setData(result);
            onSettingsChange?.(result);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show]);

    const startEdit = (key) => {
        setEditingKey(key);
        setDraft('');
    };

    const saveEdit = () => {
        setSaving(true);
        updateSetting(editingKey, draft.trim())
            .then(result => {
                setData(result);
                onSettingsChange?.(result);
                setEditingKey(null);
                setDraft('');
                setCheckFailed(false);
            })
            .finally(() => setSaving(false));
    };

    const handleCheckKey = () => {
        setChecking(true);
        checkApiKey()
            .then(result => {
                setData(result);
                onSettingsChange?.(result);
                setCheckFailed(!result.key_works);
            })
            .finally(() => setChecking(false));
    };

    return (
        <Modal show={show} onHide={onHide} animation={false}>
            <Modal.Header closeButton>
                <Modal.Title className="fw-semibold">Settings</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {!data ? (
                    <p className="text-muted mb-0">Loading…</p>
                ) : (
                    <>
                        <table className="table table-sm align-middle mb-3">
                            <thead>
                                <tr>
                                    <th>Setting</th>
                                    <th>Value</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.settings.map(row => (
                                    <tr key={row.key}>
                                        <td>{row.label}</td>
                                        <td>
                                            {editingKey === row.key ? (
                                                <input
                                                    autoFocus
                                                    type="password"
                                                    className="form-control form-control-sm"
                                                    value={draft}
                                                    onChange={e => setDraft(e.target.value)}
                                                    disabled={saving}
                                                />
                                            ) : typeof row.value === 'boolean' ? (
                                                row.value ? 'Yes' : 'No'
                                            ) : row.value ? (
                                                row.value
                                            ) : (
                                                <span className="text-muted">Not set</span>
                                            )}
                                        </td>
                                        <td className="text-end" style={{ whiteSpace: 'nowrap' }}>
                                            {editingKey === row.key ? (
                                                <div className="d-flex gap-1 justify-content-end">
                                                    <Button size="sm" variant="outline-secondary" onClick={() => setEditingKey(null)} disabled={saving}>
                                                        Cancel
                                                    </Button>
                                                    <Button size="sm" variant="primary" onClick={saveEdit} disabled={saving}>
                                                        OK
                                                    </Button>
                                                </div>
                                            ) : row.editable ? (
                                                <Button size="sm" variant="outline-secondary" onClick={() => startEdit(row.key)}>
                                                    Edit
                                                </Button>
                                            ) : null}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {data.api_key_populated && !data.key_works && (
                            <div className="d-flex align-items-center gap-2">
                                <Button size="sm" variant="outline-primary" onClick={handleCheckKey} disabled={checking}>
                                    {checking ? 'Checking…' : 'Check Key'}
                                </Button>
                                {checkFailed && <span className="text-danger small">Key check failed.</span>}
                            </div>
                        )}
                    </>
                )}
            </Modal.Body>
        </Modal>
    );
}

export default SettingsModal;
