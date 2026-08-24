import { apiFetch } from "./client";

export const uploadAttachment = (entityId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiFetch(`/api/entities/${entityId}/attachments`, { method: "POST", body: formData })
        .then(res => res.json());
};

export const deleteAttachment = (id) =>
    apiFetch(`/api/attachments/${id}`, { method: "DELETE" });

export const attachmentDownloadUrl = (id) => `/api/attachments/${id}/download`;
