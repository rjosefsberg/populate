import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { FaEye } from "react-icons/fa";
import { colorForType } from "./entityTypeColors";

// Invisible, full-node handles: React Flow needs at least one Handle to
// register a node's connection points, or it silently drops edges to/from
// it. Our floating edges compute their own path from node geometry (see
// graphEdgeUtils.js) and ignore where the handle actually sits, so one
// source + one target covering the whole node is enough — same approach as
// reactflow.dev's floating-edges example.
const handleStyle = { opacity: 0, width: "100%", height: "100%", inset: 0, transform: "none", borderRadius: 6 };

// Custom node for the association graph. See:
// https://reactflow.dev/learn/customization/custom-nodes
// Memoized: React Flow re-renders every node on pan/zoom/drag, but `data`
// (built once per layout() recompute) stays referentially stable in between.
function EntityNode({ data }) {
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
                position: "relative",
            }}
        >
            <Handle type="source" position={Position.Right} style={handleStyle} isConnectable={false} />
            <Handle type="target" position={Position.Left} style={handleStyle} isConnectable={false} />
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

export default memo(EntityNode);
