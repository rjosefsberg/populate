// Computes where an edge should actually touch each node's border, based on
// the real angle between the two node centers, instead of React Flow's
// default fixed left/right handles. Needed because our nodes sit on a
// circle around a center entity, not in a left-to-right flow — lifted from
// the "Floating Edges" example: https://reactflow.dev/examples/edges/floating-edges
import { Position } from "@xyflow/react";

function getNodeIntersection(intersectionNode, targetNode) {
    const { width: w2, height: h2 } = intersectionNode.measured;
    const intersectionNodePosition = intersectionNode.internals.positionAbsolute;
    const targetPosition = targetNode.internals.positionAbsolute;

    const w = w2 / 2;
    const h = h2 / 2;

    const x2 = intersectionNodePosition.x + w;
    const y2 = intersectionNodePosition.y + h;
    const x1 = targetPosition.x + targetNode.measured.width / 2;
    const y1 = targetPosition.y + targetNode.measured.height / 2;

    const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h);
    const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h);
    const a = 1 / (Math.abs(xx1) + Math.abs(yy1) || 1);
    const xx3 = a * xx1;
    const yy3 = a * yy1;

    return {
        x: w * (xx3 + yy3) + x2,
        y: h * (-xx3 + yy3) + y2,
    };
}

function getEdgePosition(node, intersectionPoint) {
    const nx = Math.round(node.internals.positionAbsolute.x);
    const ny = Math.round(node.internals.positionAbsolute.y);
    const px = Math.round(intersectionPoint.x);
    const py = Math.round(intersectionPoint.y);

    if (px <= nx + 1) return Position.Left;
    if (px >= nx + node.measured.width - 1) return Position.Right;
    if (py <= ny + 1) return Position.Top;
    if (py >= ny + node.measured.height - 1) return Position.Bottom;
    return Position.Top;
}

export function getEdgeParams(source, target) {
    const sourceIntersectionPoint = getNodeIntersection(source, target);
    const targetIntersectionPoint = getNodeIntersection(target, source);

    return {
        sx: sourceIntersectionPoint.x,
        sy: sourceIntersectionPoint.y,
        tx: targetIntersectionPoint.x,
        ty: targetIntersectionPoint.y,
        sourcePos: getEdgePosition(source, sourceIntersectionPoint),
        targetPos: getEdgePosition(target, targetIntersectionPoint),
    };
}
