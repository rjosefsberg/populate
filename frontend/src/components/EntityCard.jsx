function EntityCard({ entity, onEdit, onDelete }) {
    return (
        <div className="card mb-3">
            <div className="card-body">
                <h5 className="card-title">{entity.title}</h5>
                <p className="card-text">{entity.body}</p>
                <button className="btn btn-sm btn-outline-primary me-2" onClick={() => onEdit(entity)}>Edit</button>
                <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(entity.id)}>Delete</button>
            </div>
        </div>
    );
}

export default EntityCard;