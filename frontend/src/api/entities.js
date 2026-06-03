import { apiFetch } from "./client";

export const getEntities = () =>
    apiFetch("/api/entities").then(res => res.json());

export const createEntity = (data) =>
    apiFetch("/api/entities", { method: "POST", body: JSON.stringify(data) }).then(res => res.json());

export const updateEntity = (id, data) =>
    apiFetch(`/api/entities/${id}`, { method: "PUT", body: JSON.stringify(data) }).then(res => res.json());

export const deleteEntity = (id) =>
    apiFetch(`/api/entities/${id}`, { method: "DELETE" });

export const generateEntity = (entity_type, prompt, genre = "fantasy", hint = null, prompt_associations = []) =>
    apiFetch("/api/entities/generate", {
        method: "POST",
        body: JSON.stringify({ entity_type, prompt, genre, ...(hint ? { hint } : {}), ...(prompt_associations.length ? { prompt_associations } : {}) }),
    }).then(res => res.json());
