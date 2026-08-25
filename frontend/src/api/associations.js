import { apiFetch } from "./client";

export const getAssociations = (entityId) =>
    apiFetch(`/api/entities/${entityId}/associations`).then(res => res.json());

export const getProjectAssociations = (projectId) =>
    apiFetch(`/api/projects/${projectId}/associations`).then(res => res.json());

export const createAssociation = (data) =>
    apiFetch("/api/associations", { method: "POST", body: JSON.stringify(data) }).then(res => res.json());

export const deleteAssociation = (id) =>
    apiFetch(`/api/associations/${id}`, { method: "DELETE" });
