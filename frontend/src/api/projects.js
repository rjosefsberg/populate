import { apiFetch } from "./client";

export const getProjects = () =>
    apiFetch("/api/projects").then(res => res.json());

export const createProject = (data) =>
    apiFetch("/api/projects", { method: "POST", body: JSON.stringify(data) }).then(res => res.json());

export const updateProject = (id, data) =>
    apiFetch(`/api/projects/${id}`, { method: "PUT", body: JSON.stringify(data) }).then(res => res.json());

export const deleteProject = (id) =>
    apiFetch(`/api/projects/${id}`, { method: "DELETE" });
