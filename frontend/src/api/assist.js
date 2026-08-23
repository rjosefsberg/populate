import { apiFetch } from "./client";

export const chatWithAssistant = (entityType, messages, contextEntities = []) =>
    apiFetch("/api/assist/chat", {
        method: "POST",
        body: JSON.stringify({
            entity_type: entityType,
            messages,
            ...(contextEntities.length ? { context_entities: contextEntities } : {}),
        }),
    }).then(res => res.json());
