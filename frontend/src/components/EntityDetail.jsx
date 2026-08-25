import { useState } from "react";
import AttachmentsList from "./AttachmentsList";
import EntityReadout from "./EntityReadout";
import { uploadAttachment, deleteAttachment, attachmentDownloadUrl } from "../api/attachments";

function EntityDetail({ entity, onEdit, onDelete, onEntityChange }) {
    const [uploading, setUploading] = useState(false);

    if (!entity) return (
        <div className="p-4 text-muted">
            <h4>Select an entity to view details</h4>
        </div>
    );

    const attachments = entity.attachments || [];

    const handleAddFiles = (files) => {
        setUploading(true);
        Promise.all(files.map(file => uploadAttachment(entity.id, file)))
            .then(newAttachments => {
                onEntityChange?.({ ...entity, attachments: [...attachments, ...newAttachments] });
            })
            .finally(() => setUploading(false));
    };

    const handleRemove = (attachmentId) => {
        deleteAttachment(attachmentId).then(() => {
            onEntityChange?.({ ...entity, attachments: attachments.filter(a => a.id !== attachmentId) });
        });
    };

    return (
        <div className="p-4" style={{ maxWidth: 720 }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
                <h2 className="mb-0 fw-semibold">{entity.title}</h2>
                <div className="d-flex gap-2">
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => onEdit(entity)}>Edit</button>
                    <button className="btn btn-outline-danger btn-sm" onClick={() => onDelete(entity.id)}>Delete</button>
                </div>
            </div>

            <EntityReadout entity={entity} />

            <AttachmentsList
                items={attachments.map(a => ({
                    key: a.id,
                    filename: a.filename,
                    size_bytes: a.size_bytes,
                    downloadUrl: attachmentDownloadUrl(a.id),
                }))}
                onAddFiles={handleAddFiles}
                onRemove={handleRemove}
                uploading={uploading}
            />
        </div>
    );
}

export default EntityDetail;
