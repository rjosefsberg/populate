function EntityDetail({ entity, onEdit, onDelete }) {
    if (!entity) return (
        <div className="p-4 text-muted">
            <h4>Select an entity to view details</h4>
        </div>
    );

    const associations = entity.associations || [];
    const labelStyle = { fontSize: '0.7rem', letterSpacing: '0.08em', color: '#6c757d' };

    return (
        <div className="p-4" style={{ maxWidth: 720 }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
                <h2 className="mb-0 fw-semibold">{entity.title}</h2>
                <div className="d-flex gap-2">
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => onEdit(entity)}>Edit</button>
                    <button className="btn btn-outline-danger btn-sm" onClick={() => onDelete(entity.id)}>Delete</button>
                </div>
            </div>

            <div className="mb-4">
                {entity.entity_type && (
                    <span className="badge bg-secondary text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.06em' }}>
                        {entity.entity_type}
                    </span>
                )}
            </div>

            <div
                className="mb-5"
                style={{ lineHeight: 1.7, color: '#333' }}
                dangerouslySetInnerHTML={{ __html: entity.body }}
            />

            {associations.length > 0 && (
                <div>
                    <p className="text-uppercase fw-semibold mb-3" style={labelStyle}>Associations</p>
                    <ul className="list-group list-group-flush">
                        {associations.map(a => {
                            const linkedTitle = a.entity_id_1 === entity.id ? a.entity_2_title : a.entity_1_title;
                            return (
                                <li key={a.id} className="list-group-item px-0 py-2">
                                    <span className="fw-semibold me-2">{linkedTitle}</span>
                                    {a.description && <span className="text-muted">{a.description}</span>}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default EntityDetail;
