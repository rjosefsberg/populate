import { apiFetch } from "./client";

export const getSettings = () =>
    apiFetch("/api/settings").then(res => res.json());

export const updateSetting = (key, value) =>
    apiFetch(`/api/settings/${key}`, { method: "PUT", body: JSON.stringify({ value }) }).then(res => res.json());

export const checkApiKey = () =>
    apiFetch("/api/settings/check-key", { method: "POST" }).then(res => res.json());
