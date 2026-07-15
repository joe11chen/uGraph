import type { NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";
import { FileText, Pencil, Tags, Trash2 } from "lucide-react";
import type { CSSProperties } from "react";
import type { MouseEvent } from "react";
import type { PaperMetadata } from "../../types/paper";
import { formatPaperStatus } from "../../utils/labels";
import { nodeHandleSides, sourceHandleBySide, targetHandleBySide, type NodeHandleSide } from "./edgeRouting";
import { getRenderedNodeColor, normalizeNodeShape } from "./nodeStyles";

export type PaperNodeData = {
  [key: string]: unknown;
  canvasNodeId: string;
  title: string;
  metadata: PaperMetadata;
  expanded?: boolean;
  onEdit?: (canvasNodeId: string) => void;
  onDelete?: (canvasNodeId: string) => void;
};

const handlePositionBySide: Record<NodeHandleSide, Position> = {
  top: Position.Top,
  right: Position.Right,
  bottom: Position.Bottom,
  left: Position.Left
};

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
  const tldr = String(metadata.tldr ?? "").trim();
  const status = formatPaperStatus(metadata.status);
  const color = getRenderedNodeColor(metadata.nodeColor);
  const shape = normalizeNodeShape(metadata.nodeShape);
  const hasExpandedMetadata = Boolean(tldr) || tags.length > 0;
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
      {nodeHandleSides.flatMap((side) => [
        <Handle
          key={targetHandleBySide[side]}
          id={targetHandleBySide[side]}
          className="paper-node-handle"
          type="target"
          position={handlePositionBySide[side]}
          isConnectable={false}
        />,
        <Handle
          key={sourceHandleBySide[side]}
          id={sourceHandleBySide[side]}
          className="paper-node-handle"
          type="source"
          position={handlePositionBySide[side]}
          isConnectable={false}
        />
      ])}
      {isExpanded ? (
        <div className="node-action-menu" aria-label="文献操作" onPointerDown={(event) => event.stopPropagation()}>
          <button
            type="button"
            className="icon-button"
            onClick={(event) => {
              stopNodeEvent(event);
              nodeData.onEdit?.(nodeData.canvasNodeId);
            }}
            aria-label="编辑文献"
            title="编辑文献"
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
            aria-label="删除文献"
            title="删除文献"
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
          {tldr ? (
            <div className="metadata-row">
              <FileText size={13} />
              <span className="node-tldr">{tldr}</span>
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
    </div>
  );
}
