import { useMemo } from "react";
import { ReactFlow, Background, Controls, MarkerType } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import FloatingEdge from "./FloatingEdge";
import EntityNode from "./EntityNode";
import GraphLegend from "./GraphLegend";

const edgeTypes = { floating: FloatingEdge };
const nodeTypes = { entity: EntityNode };

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

function layout(entity, entities, onInspect) {
    const associations = entity.associations || [];
    const entityById = new Map(entities.map(e => [e.id, e]));

    // The center node's position is its own on-circle point too: offsetting
    // it by half its size (like every neighbor below) keeps it exactly at
    // the hub, so the neighbor angles come out as the standard 360/count
    // split instead of skewed by half a node's width/height.
    const nodes = [
        {
            id: String(entity.id),
            type: "entity",
            data: {
                label: entity.title,
                entityType: entity.entity_type,
                isCenter: true,
                onInspect: () => onInspect(entity),
            },
            position: { x: -CENTER_WIDTH / 2, y: -NODE_HEIGHT / 2 },
            style: { width: CENTER_WIDTH, height: NODE_HEIGHT },
        },
    ];

    const count = associations.length;
    associations.forEach((assoc, i) => {
        const neighborId = otherEntityId(assoc, entity.id);
        const neighborTitle = otherEntityTitle(assoc, entity.id);
        const neighbor = entityById.get(neighborId);
        const angle = (2 * Math.PI * i) / count - Math.PI / 2;

        nodes.push({
            id: String(neighborId),
            type: "entity",
            data: {
                label: neighborTitle,
                entityType: neighbor?.entity_type,
                isCenter: false,
                onInspect: () => onInspect(neighbor || { id: neighborId, title: neighborTitle }),
            },
            position: {
                x: RADIUS * Math.cos(angle) - NEIGHBOR_WIDTH / 2,
                y: RADIUS * Math.sin(angle) - NODE_HEIGHT / 2,
            },
            style: { width: NEIGHBOR_WIDTH, height: NODE_HEIGHT },
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

export default function AssociationGraph({ entity, entities, onFocusEntity, onInspectEntity }) {
    const { nodes, edges } = useMemo(
        () => layout(entity, entities, onInspectEntity || (() => {})),
        [entity, entities, onInspectEntity]
    );

    if ((entity.associations || []).length === 0) {
        return <div className="p-4 text-muted">{entity.title} has no associations yet.</div>;
    }

    return (
        <div style={{ width: "100%", height: "100%" }}>
            <ReactFlow
                key={entity.id}
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
            </ReactFlow>
        </div>
    );
}
