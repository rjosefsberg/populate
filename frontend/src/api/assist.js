import { apiFetch } from "./client";

export const chatWithAssistant = (entityType, genre, messages) =>
    apiFetch("/api/assist/chat", {
        method: "POST",
        body: JSON.stringify({ entity_type: entityType, genre, messages }),
    }).then(res => res.json());
