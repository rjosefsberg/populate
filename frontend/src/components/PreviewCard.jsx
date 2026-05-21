function PreviewCard({ preview, onConfirm, onDiscard }) {
    return (
        <div className="card mb-4 border-warning">
            <div className="card-header bg-warning text-dark">
                Preview — confirm or discard
            </div>
            <div className="card-body">
                <h5 className="card-title">{preview.title}</h5>
                <p className="card-text">{preview.description}</p>
                <button className="btn btn-success me-2" onClick={onConfirm}>Confirm</button>
                <button className="btn btn-danger" onClick={onDiscard}>Discard</button>
            </div>
        </div>
    );
}

export default PreviewCard;