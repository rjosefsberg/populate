import { useMemo } from "react";
import { ReactFlow, Background, Controls, MarkerType } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import FloatingEdge from "./FloatingEdge";

const edgeTypes = { floating: FloatingEdge };

const TYPE_COLORS = {
    person: "#6f42c1",
    place: "#0d6efd",
    thing: "#198754",
    note: "#adb5bd",
};

const CENTER_WIDTH = 180;
const NEIGHBOR_WIDTH = 150;
const NODE_HEIGHT = 40;
const RADIUS = 280;

function otherEntityId(assoc, centerId) {
    return assoc.entity_id_1 === centerId ? assoc.entity_id_2 : assoc.entity_id_1;
}

function otherEntityTitle(assoc, centerId) {
    return assoc.entity_id_1 === centerId ? assoc.entity_2_title : assoc.entity_1_title;
}

function layout(entity, entities) {
    const associations = entity.associations || [];
    const entityById = new Map(entities.map(e => [e.id, e]));

    // The center node's position is its own on-circle point too: offsetting
    // it by half its size (like every neighbor below) keeps it exactly at
    // the hub, so the neighbor angles come out as the standard 360/count
    // split instead of skewed by half a node's width/height.
    const nodes = [
        {
            id: String(entity.id),
            data: { label: entity.title },
            position: { x: -CENTER_WIDTH / 2, y: -NODE_HEIGHT / 2 },
            style: {
                borderColor: TYPE_COLORS[entity.entity_type] || TYPE_COLORS.note,
                borderWidth: 3,
                width: CENTER_WIDTH,
                height: NODE_HEIGHT,
                fontWeight: 600,
            },
        },
    ];

    const count = associations.length;
    associations.forEach((assoc, i) => {
        const neighborId = otherEntityId(assoc, entity.id);
        const neighborTitle = otherEntityTitle(assoc, entity.id);
        const neighborType = entityById.get(neighborId)?.entity_type;
        const angle = (2 * Math.PI * i) / count - Math.PI / 2;

        nodes.push({
            id: String(neighborId),
            data: { label: neighborTitle },
            position: {
                x: RADIUS * Math.cos(angle) - NEIGHBOR_WIDTH / 2,
                y: RADIUS * Math.sin(angle) - NODE_HEIGHT / 2,
            },
            style: {
                borderColor: TYPE_COLORS[neighborType] || TYPE_COLORS.note,
                borderWidth: 2,
                width: NEIGHBOR_WIDTH,
                height: NODE_HEIGHT,
            },
        });
    });

    const edges = associations.map(assoc => ({
        id: String(assoc.id),
        source: String(entity.id),
        target: String(otherEntityId(assoc, entity.id)),
        label: assoc.description,
        type: "floating",
        markerEnd: { type: MarkerType.ArrowClosed },
    }));

    return { nodes, edges };
}

export default function AssociationGraph({ entity, entities, onFocusEntity }) {
    const { nodes, edges } = useMemo(() => layout(entity, entities), [entity, entities]);

    if ((entity.associations || []).length === 0) {
        return <div className="p-4 text-muted">{entity.title} has no associations yet.</div>;
    }

    return (
        <div style={{ width: "100%", height: "100%" }}>
            <ReactFlow
                key={entity.id}
                nodes={nodes}
                edges={edges}
                edgeTypes={edgeTypes}
                fitView
                onNodeClick={(_, node) => {
                    if (node.id === String(entity.id)) return;
                    const neighbor = entities.find(e => String(e.id) === node.id);
                    if (neighbor) onFocusEntity(neighbor);
                }}
            >
                <Background />
                <Controls />
            </ReactFlow>
        </div>
    );
}
