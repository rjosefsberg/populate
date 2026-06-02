export const getEntities = () =>
    fetch("/api/entities").then(res => res.json());

export const createEntity = (data) =>
    fetch("/api/entities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    }).then(res => res.json());

export const updateEntity = (id, data) =>
    fetch(`/api/entities/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    }).then(res => res.json());

export const deleteEntity = (id) =>
    fetch(`/api/entities/${id}`, { method: "DELETE" });

export const generateEntity = (entity_type, prompt, hint = null) =>
    fetch("/api/entities/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity_type, prompt, ...(hint ? { hint } : {}) })
    }).then(res => res.json());