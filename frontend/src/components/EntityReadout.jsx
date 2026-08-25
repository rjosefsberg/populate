// Read-only rendering of an entity's type badge, body, and associations.
// Shared by EntityDetail (full page) and InspectorPanel (right sidebar) so
// the two can't drift apart.
const labelStyle = { fontSize: '0.7rem', letterSpacing: '0.08em', color: '#6c757d' };

function EntityReadout({ entity }) {
    const associations = entity.associations || [];

    return (
        <>
            <div className="mb-4">
                {entity.entity_type && (
                    <span className="badge bg-secondary text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.06em' }}>
                        {entity.entity_type}
                    </span>
                )}
            </div>

            <div
                className="mb-5 entity-body"
                style={{ lineHeight: 1.7, color: '#333' }}
                dangerouslySetInnerHTML={{ __html: entity.body }}
            />

            {associations.length > 0 && (
                <div className="mb-5">
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
        </>
    );
}

export default EntityReadout;
