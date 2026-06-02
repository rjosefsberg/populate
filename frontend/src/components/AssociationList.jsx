import { useState, useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import { getAssociations, createAssociation, deleteAssociation } from '../api/associations';
import AddAssociationModal from './AddAssociationModal';

function AssociationList({ entity, entities }) {
    const [associations, setAssociations] = useState([]);
    const [modalShow, setModalShow] = useState(false);

    useEffect(() => {
        if (entity) {
            getAssociations(entity.id).then(setAssociations);
        }
    }, [entity]);

    const handleAdd = (data) => {
        return createAssociation(data).then(assoc => {
            setAssociations(prev => [...prev, assoc]);
        });
    };

    const handleDelete = (id) => {
        deleteAssociation(id).then(() => {
            setAssociations(prev => prev.filter(a => a.id !== id));
        });
    };

    if (!entity) return null;

    return (
        <div className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0 text-muted text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                    Associations
                </h6>
                <Button variant="outline-secondary" size="sm" onClick={() => setModalShow(true)}>
                    + Add
                </Button>
            </div>

            {associations.length === 0 ? (
                <p className="text-muted small">No associations yet.</p>
            ) : (
                <ul className="list-group list-group-flush">
                    {associations.map(a => {
                        const linkedTitle = a.entity_id_1 === entity.id ? a.entity_2_title : a.entity_1_title;
                        return (
                            <li key={a.id} className="list-group-item px-0 d-flex justify-content-between align-items-start">
                                <div>
                                    <span className="fw-semibold me-2">{linkedTitle}</span>
                                    <span className="text-muted">{a.description}</span>
                                </div>
                                <Button
                                    variant="link"
                                    size="sm"
                                    className="text-danger p-0 ms-2"
                                    onClick={() => handleDelete(a.id)}
                                >
                                    ×
                                </Button>
                            </li>
                        );
                    })}
                </ul>
            )}

            <AddAssociationModal
                show={modalShow}
                onHide={() => setModalShow(false)}
                currentEntityId={entity.id}
                entities={entities}
                onAdd={handleAdd}
            />
        </div>
    );
}

export default AssociationList;
