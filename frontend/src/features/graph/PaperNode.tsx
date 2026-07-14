import type { NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";
import { Calendar, MapPin, Pencil, Tags, Trash2, Users } from "lucide-react";
import type { CSSProperties } from "react";
import type { MouseEvent } from "react";
import type { PaperMetadata } from "../../types/paper";

export type PaperNodeData = {
  [key: string]: unknown;
  canvasNodeId: string;
  title: string;
  metadata: PaperMetadata;
  expanded?: boolean;
  onEdit?: (canvasNodeId: string) => void;
  onDelete?: (canvasNodeId: string) => void;
};

const colorClasses = new Set(["clay", "ochre", "olive", "cinnabar", "graphite"]);
const shapeClasses = new Set(["rounded", "note", "capsule"]);

function stringifyList(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
}

function estimateTextUnits(value: string): number {
  return Array.from(value).reduce((total, char) => total + (char.charCodeAt(0) > 255 ? 1 : 0.58), 0);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function PaperNode({ data }: NodeProps) {
  const nodeData = data as PaperNodeData;
  const metadata = nodeData.metadata;
  const tags = stringifyList(metadata.tags);
  const authors = stringifyList(metadata.authors);
  const status = String(metadata.status ?? "Unread");
  const color = colorClasses.has(String(metadata.nodeColor)) ? String(metadata.nodeColor) : "clay";
  const shape = shapeClasses.has(String(metadata.nodeShape)) ? String(metadata.nodeShape) : "rounded";
  const hasYearOrVenue = Boolean(metadata.year || metadata.venue);
  const hasExpandedMetadata = authors.length > 0 || hasYearOrVenue || tags.length > 0;
  const isExpanded = Boolean(nodeData.expanded);

  const className = isExpanded
    ? `paper-node expanded node-color-${color} node-shape-${shape}${hasExpandedMetadata ? " has-details" : ""}`
    : `paper-node node-color-${color} node-shape-${shape}`;
  const titleWidth = estimateTextUnits(nodeData.title) * (isExpanded ? 9 : 8.2);
  const statusWidth = estimateTextUnits(status) * 8.2;
  const compactWidth = clamp(Math.ceil(Math.max(titleWidth, statusWidth) + 34), 128, 240);
  const expandedWidth = hasExpandedMetadata
    ? clamp(Math.ceil(Math.max(titleWidth, 250) + 54), 280, 360)
    : clamp(Math.ceil(Math.max(titleWidth, statusWidth) + 42), 160, 260);
  const nodeStyle = { "--node-width": `${isExpanded ? expandedWidth : compactWidth}px` } as CSSProperties;

  function stopNodeEvent(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
  }

  return (
    <div className={className} style={nodeStyle}>
      <Handle type="target" position={Position.Left} />
      {isExpanded ? (
        <div className="node-action-menu" aria-label="节点操作" onPointerDown={(event) => event.stopPropagation()}>
          <button
            type="button"
            className="icon-button"
            onClick={(event) => {
              stopNodeEvent(event);
              nodeData.onEdit?.(nodeData.canvasNodeId);
            }}
            aria-label="编辑节点"
            title="编辑节点"
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            className="icon-button danger-action"
            onClick={(event) => {
              stopNodeEvent(event);
              nodeData.onDelete?.(nodeData.canvasNodeId);
            }}
            aria-label="删除节点"
            title="删除节点"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ) : null}
      <div className="paper-node-head">
        <span className="node-status">{status}</span>
      </div>
      <div className="paper-node-title">{nodeData.title}</div>
      {isExpanded && hasExpandedMetadata ? (
        <div className="paper-node-details">
          {authors.length > 0 ? (
            <div className="metadata-row">
              <Users size={13} />
              <span>{authors.join(", ")}</span>
            </div>
          ) : null}
          {hasYearOrVenue ? (
            <div className="metadata-grid-mini">
              {metadata.year ? (
                <div>
                  <Calendar size={13} />
                  <span>{String(metadata.year)}</span>
                </div>
              ) : null}
              {metadata.venue ? (
                <div>
                  <MapPin size={13} />
                  <span>{String(metadata.venue)}</span>
                </div>
              ) : null}
            </div>
          ) : null}
          {tags.length > 0 ? (
            <div className="paper-node-tags">
              <Tags size={13} />
              {tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
