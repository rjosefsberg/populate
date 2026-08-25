import { Panel } from "@xyflow/react";
import { ENTITY_TYPE_COLORS, ENTITY_TYPE_LABELS } from "./entityTypeColors";

export default function GraphLegend() {
    return (
        <Panel position="top-left">
            <div className="bg-white border rounded p-2" style={{ fontSize: 12 }}>
                {Object.keys(ENTITY_TYPE_COLORS).map(type => (
                    <div key={type} className="d-flex align-items-center mb-1">
                        <span
                            style={{
                                display: "inline-block",
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                background: ENTITY_TYPE_COLORS[type],
                                marginRight: 6,
                            }}
                        />
                        {ENTITY_TYPE_LABELS[type]}
                    </div>
                ))}
            </div>
        </Panel>
    );
}
