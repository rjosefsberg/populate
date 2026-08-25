import { useEffect, useMemo, useState } from "react";
import { ReactFlow, Background, Controls, MarkerType } from "@xyflow/react";
import dagre from "dagre";
import "@xyflow/react/dist/style.css";
import { getProjectAssociations } from "../api/associations";

const TYPE_COLORS = {
    person: "#6f42c1",
    place: "#0d6efd",
    thing: "#198754",
    note: "#adb5bd",
};

const NODE_WIDTH = 160;
const NODE_HEIGHT = 40;

function layout(entities, associations) {
    const graph = new dagre.graphlib.Graph();
    graph.setGraph({ rankdir: "LR", nodesep: 40, ranksep: 80 });
    graph.setDefaultEdgeLabel(() => ({}));

    entities.forEach(e => graph.setNode(String(e.id), { width: NODE_WIDTH, height: NODE_HEIGHT }));
    associations.forEach(a =>
        graph.setEdge(String(a.entity_id_1), String(a.entity_id_2))
    );

    dagre.layout(graph);

    const nodes = entities.map(e => {
        const pos = graph.node(String(e.id));
        return {
            id: String(e.id),
            data: { label: e.title },
            position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
            style: {
                borderColor: TYPE_COLORS[e.entity_type] || TYPE_COLORS.note,
                borderWidth: 2,
                width: NODE_WIDTH,
            },
        };
    });

    const edges = associations.map(a => ({
        id: String(a.id),
        source: String(a.entity_id_1),
        target: String(a.entity_id_2),
        label: a.description,
        markerEnd: { type: MarkerType.ArrowClosed },
    }));

    return { nodes, edges };
}

export default function AssociationGraph({ projectId, entities, onSelectEntity }) {
    const [associations, setAssociations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!projectId) return;
        setLoading(true);
        getProjectAssociations(projectId).then(data => {
            setAssociations(data);
            setLoading(false);
        });
    }, [projectId]);

    const { nodes, edges } = useMemo(
        () => layout(entities, associations),
        [entities, associations]
    );

    if (loading) return null;

    if (entities.length === 0) {
        return <div className="p-4 text-muted">No entities yet. Add some to see the association graph.</div>;
    }

    return (
        <div style={{ width: "100%", height: "100%" }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                fitView
                onNodeClick={(_, node) => {
                    const entity = entities.find(e => String(e.id) === node.id);
                    if (entity) onSelectEntity(entity);
                }}
            >
                <Background />
                <Controls />
            </ReactFlow>
        </div>
    );
}
