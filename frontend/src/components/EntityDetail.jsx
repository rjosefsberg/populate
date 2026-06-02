import AssociationList from './AssociationList';

function EntityDetail({ entity, entities, onEdit, onDelete }) {
    if (!entity) return (
        <div className="p-4 text-muted">
            <h4>Select an entity to view details</h4>
        </div>
    );

    return (
        <div className="p-4">
            <h2>{entity.title}</h2>
            <p>{entity.body}</p>
            <button className="btn btn-outline-primary me-2" onClick={() => onEdit(entity)}>Edit</button>
            <button className="btn btn-outline-danger" onClick={() => onDelete(entity.id)}>Delete</button>
            <hr />
            <AssociationList entity={entity} entities={entities} />
        </div>
    );
}

export default EntityDetail;