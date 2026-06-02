export const getAssociations = (entityId) =>
    fetch(`/api/entities/${entityId}/associations`).then(res => res.json());

export const createAssociation = (data) =>
    fetch("/api/associations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    }).then(res => res.json());

export const deleteAssociation = (id) =>
    fetch(`/api/associations/${id}`, { method: "DELETE" });
