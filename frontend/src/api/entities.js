import { apiFetch } from "./client";

export const getEntities = (projectId) =>
    apiFetch(`/api/entities${projectId ? `?project_id=${projectId}` : ""}`).then(res => res.json());

export const createEntity = (data) =>
    apiFetch("/api/entities", { method: "POST", body: JSON.stringify(data) }).then(res => res.json());

export const updateEntity = (id, data) =>
    apiFetch(`/api/entities/${id}`, { method: "PUT", body: JSON.stringify(data) }).then(res => res.json());

export const deleteEntity = (id) =>
    apiFetch(`/api/entities/${id}`, { method: "DELETE" });
