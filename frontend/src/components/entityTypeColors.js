// Single source of truth for entity_type -> color, shared by the graph
// nodes and the graph legend so they can't drift apart.
export const ENTITY_TYPE_COLORS = {
    person: "#6f42c1",
    place: "#0d6efd",
    thing: "#198754",
    note: "#adb5bd",
};

export const ENTITY_TYPE_LABELS = {
    person: "Person",
    place: "Place",
    thing: "Thing",
    note: "Note",
};

export function colorForType(type) {
    return ENTITY_TYPE_COLORS[type] || ENTITY_TYPE_COLORS.note;
}
