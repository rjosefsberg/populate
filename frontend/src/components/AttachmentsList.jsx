import { useRef } from "react";
import { FaTimes } from "react-icons/fa";

const labelStyle = { fontSize: '0.7rem', letterSpacing: '0.08em', color: '#6c757d' };

function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// `items`: [{ key, filename, size_bytes, downloadUrl? }] — downloadUrl is omitted for
// files staged locally (not yet uploaded, e.g. during entity creation).
function AttachmentsList({ items, onAddFiles, onRemove, uploading }) {
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length) onAddFiles(files);
        e.target.value = ""; // allow re-selecting the same file
    };

    return (
        <div>
            <p className="text-uppercase fw-semibold mb-2" style={labelStyle}>Attachments</p>

            {items.length > 0 && (
                <ul className="list-group list-group-flush mb-2">
                    {items.map(item => (
                        <li key={item.key} className="list-group-item px-0 d-flex justify-content-between align-items-center py-2">
                            <div className="text-truncate me-3">
                                {item.downloadUrl ? (
                                    <a href={item.downloadUrl} download={item.filename}>{item.filename}</a>
                                ) : (
                                    <span>{item.filename}</span>
                                )}
                                <span className="text-muted ms-2 small">{formatSize(item.size_bytes)}</span>
                            </div>
                            <button
                                type="button"
                                className="btn btn-link btn-sm text-danger p-0 flex-shrink-0"
                                onClick={() => onRemove(item.key)}
                                disabled={uploading}
                                aria-label="Remove attachment"
                            >
                                <FaTimes />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <input
                ref={fileInputRef}
                type="file"
                className="d-none"
                onChange={handleFileChange}
                disabled={uploading}
            />
            <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
            >
                {uploading ? 'Uploading…' : '+ Add file'}
            </button>
        </div>
    );
}

export default AttachmentsList;
