import { FaTimes } from "react-icons/fa";
import EntityReadout from "./EntityReadout";

// A generic right-side sidebar that slides in over whatever's in the main
// pane. Entity inspection is the first use; anything else pushed into this
// panel later should keep the same header (title + close + optional action)
// shape so it stays visually consistent.
function InspectorPanel({ entity, onClose, onEdit }) {
    if (!entity) return null;

    return (
        <div
            className="border-start bg-white p-4"
            style={{ width: 360, minHeight: "100vh", overflowY: "auto" }}
        >
            <div className="d-flex justify-content-between align-items-start mb-3">
                <h4 className="mb-0 fw-semibold">{entity.title}</h4>
                <button
                    type="button"
                    className="btn btn-sm btn-link p-0 text-secondary"
                    aria-label="Close panel"
                    onClick={onClose}
                >
                    <FaTimes />
                </button>
            </div>

            <EntityReadout entity={entity} />

            <button className="btn btn-outline-secondary btn-sm" onClick={() => onEdit(entity)}>
                Edit
            </button>
        </div>
    );
}

export default InspectorPanel;
