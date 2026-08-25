import { FaEye } from "react-icons/fa";
import { colorForType } from "./entityTypeColors";

// Custom node for the association graph. See:
// https://reactflow.dev/learn/customization/custom-nodes
export default function EntityNode({ data }) {
    const { label, entityType, isCenter, onInspect } = data;

    return (
        <div
            className="d-flex align-items-center justify-content-between px-2 bg-white"
            style={{
                width: "100%",
                height: "100%",
                borderRadius: 6,
                border: `${isCenter ? 3 : 2}px solid ${colorForType(entityType)}`,
                fontWeight: isCenter ? 600 : 400,
                fontSize: 13,
            }}
        >
            <span className="text-truncate">{label}</span>
            <button
                type="button"
                className="btn btn-sm btn-link p-0 ms-1 nodrag text-secondary"
                title={`View ${label}`}
                aria-label={`View ${label}`}
                onClick={(e) => {
                    e.stopPropagation();
                    onInspect?.();
                }}
            >
                <FaEye size={13} />
            </button>
        </div>
    );
}
