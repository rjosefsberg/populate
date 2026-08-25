import { useMemo, useState } from "react";
import { ReactFlow, Background, Controls, MarkerType, Panel } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import FloatingEdge from "./FloatingEdge";
import EntityNode from "./EntityNode";
import GraphLegend from "./GraphLegend";

const edgeTypes = { floating: FloatingEdge };
const nodeTypes = { entity: EntityNode };

const CENTER_WIDTH = 180;
const NEIGHBOR_WIDTH = 150;
const NODE_HEIGHT = 40;
const RING_RADIUS = [0, 280, 480]; // index by ring number (0 = center)
const RING2_ANGLE_STEP = 0.32; // radians between siblings sharing a ring-1 parent

function otherEntityId(assoc, fromId) {
    return assoc.entity_id_1 === fromId ? assoc.entity_id_2 : assoc.entity_id_1;
}

function otherEntityTitle(assoc, fromId) {
    return assoc.entity_id_1 === fromId ? assoc.entity_2_title : assoc.entity_1_title;
}

function makeNode(id, title, entityType, angle, ring, isCenter, onInspect) {
    const width = isCenter ? CENTER_WIDTH : NEIGHBOR_WIDTH;
    const radius = RING_RADIUS[ring];
    return {
        id: String(id),
        type: "entity",
        data: { label: title, entityType, isCenter, onInspect },
        // Every node (center included) is offset by half its own size, so
        // the point placed on the ring is the node's true center — otherwise
        // the ring geometry skews by half a node's width/height.
        position: {
            x: radius * Math.cos(angle) - width / 2,
            y: radius * Math.sin(angle) - NODE_HEIGHT / 2,
        },
        style: { width, height: NODE_HEIGHT },
    };
}

function makeEdge(assoc, sourceId, targetId) {
    return {
        id: String(assoc.id),
        source: String(sourceId),
        target: String(targetId),
        label: assoc.description,
        type: "floating",
        markerEnd: { type: MarkerType.ArrowClosed },
    };
}

// depth 1: center + its direct associations.
// depth 2: also each ring-1 neighbor's own associations, one ring further
// out (skipping anything already placed, so shared/cyclical associations
// don't duplicate a node — the extra edge to an already-placed node still
// renders).
function layout(entity, entities, onInspect, depth) {
    const entityById = new Map(entities.map(e => [e.id, e]));
    const placed = new Set([entity.id]);
    const nodes = [
        makeNode(entity.id, entity.title, entity.entity_type, 0, 0, true, () => onInspect(entity)),
    ];
    const edges = [];

    const ring1 = entity.associations || [];
    const ring1Angles = new Map();

    ring1.forEach((assoc, i) => {
        const neighborId = otherEntityId(assoc, entity.id);
        const neighborTitle = otherEntityTitle(assoc, entity.id);
        const neighbor = entityById.get(neighborId);
        const angle = (2 * Math.PI * i) / ring1.length - Math.PI / 2;

        ring1Angles.set(neighborId, angle);
        placed.add(neighborId);
        nodes.push(makeNode(
            neighborId, neighborTitle, neighbor?.entity_type, angle, 1, false,
            () => onInspect(neighbor || { id: neighborId, title: neighborTitle })
        ));
        edges.push(makeEdge(assoc, entity.id, neighborId));
    });

    if (depth >= 2) {
        // First work out *which* second-degree associations to draw and at
        // what angle (one flat list across every ring-1 neighbor), then a
        // single pass places nodes/edges for them — keeps "what goes where"
        // separate from "how to render it", instead of nesting both loops.
        const ring2Items = ring1.flatMap(assoc => {
            const neighborId = otherEntityId(assoc, entity.id);
            const neighbor = entityById.get(neighborId);
            const parentAngle = ring1Angles.get(neighborId);
            const grandAssocs = (neighbor?.associations || []).filter(
                a => otherEntityId(a, neighborId) !== entity.id
            );

            return grandAssocs.map((assoc2, j) => ({
                assoc: assoc2,
                neighborId,
                grandId: otherEntityId(assoc2, neighborId),
                grandTitle: otherEntityTitle(assoc2, neighborId),
                angle: parentAngle + (j - (grandAssocs.length - 1) / 2) * RING2_ANGLE_STEP,
            }));
        });

        ring2Items.forEach(({ assoc, neighborId, grandId, grandTitle, angle }) => {
            const grand = entityById.get(grandId);
            if (!placed.has(grandId)) {
                nodes.push(makeNode(
                    grandId, grandTitle, grand?.entity_type, angle, 2, false,
                    () => onInspect(grand || { id: grandId, title: grandTitle })
                ));
                placed.add(grandId);
            }
            edges.push(makeEdge(assoc, neighborId, grandId));
        });
    }

    return { nodes, edges };
}

export default function AssociationGraph({ entity, entities, onFocusEntity, onInspectEntity }) {
    const [showSecondDegree, setShowSecondDegree] = useState(false);
    const depth = showSecondDegree ? 2 : 1;

    const { nodes, edges } = useMemo(
        () => layout(entity, entities, onInspectEntity || (() => {}), depth),
        [entity, entities, onInspectEntity, depth]
    );

    if ((entity.associations || []).length === 0) {
        return <div className="p-4 text-muted">{entity.title} has no associations yet.</div>;
    }

    return (
        <div style={{ width: "100%", height: "100%" }}>
            <ReactFlow
                key={`${entity.id}-${depth}`}
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                onNodeDoubleClick={(_, node) => {
                    if (node.id === String(entity.id)) return;
                    const neighbor = entities.find(e => String(e.id) === node.id);
                    if (neighbor) onFocusEntity(neighbor);
                }}
            >
                <Background />
                <Controls />
                <GraphLegend />
                <Panel position="top-right">
                    <label className="bg-white border rounded p-2 d-flex align-items-center gap-2" style={{ fontSize: 12 }}>
                        <input
                            type="checkbox"
                            checked={showSecondDegree}
                            onChange={e => setShowSecondDegree(e.target.checked)}
                        />
                        Show associations of associations
                    </label>
                </Panel>
            </ReactFlow>
        </div>
    );
}
