import { useCallback } from "react";
import { useStore, getStraightPath, BaseEdge, EdgeLabelRenderer } from "@xyflow/react";
import { getEdgeParams } from "./graphEdgeUtils";

// A straight edge whose endpoints are recomputed from each node's actual
// border (see graphEdgeUtils.js), so it points correctly at nodes arranged
// on a circle rather than assuming a left-to-right flow.
export default function FloatingEdge({ id, source, target, markerEnd, style, label }) {
    const sourceNode = useStore(useCallback(store => store.nodeLookup.get(source), [source]));
    const targetNode = useStore(useCallback(store => store.nodeLookup.get(target), [target]));

    if (!sourceNode || !targetNode || !sourceNode.measured?.width || !targetNode.measured?.width) {
        return null;
    }

    const { sx, sy, tx, ty } = getEdgeParams(sourceNode, targetNode);
    const [edgePath, labelX, labelY] = getStraightPath({ sourceX: sx, sourceY: sy, targetX: tx, targetY: ty });

    return (
        <>
            <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
            {label && (
                <EdgeLabelRenderer>
                    <div
                        className="nodrag nopan bg-white px-1 rounded border"
                        style={{
                            position: "absolute",
                            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                            fontSize: 11,
                            pointerEvents: "all",
                        }}
                    >
                        {label}
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
}
