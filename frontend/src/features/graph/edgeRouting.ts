import type { Node } from "@xyflow/react";

export const defaultNodeWidth = 200;
export const defaultNodeHeight = 72;

export const nodeHandleSides = ["top", "right", "bottom", "left"] as const;
export type NodeHandleSide = (typeof nodeHandleSides)[number];

export const sourceHandleBySide: Record<NodeHandleSide, string> = {
  top: "source-top",
  right: "source-right",
  bottom: "source-bottom",
  left: "source-left"
};

export const targetHandleBySide: Record<NodeHandleSide, string> = {
  top: "target-top",
  right: "target-right",
  bottom: "target-bottom",
  left: "target-left"
};

export type EdgeRoute = {
  axis: "horizontal" | "vertical";
  sourceHandle: string;
  targetHandle: string;
};

type Point = {
  x: number;
  y: number;
};

const axisHysteresis = 1.2;
const centerDeadZone = 12;

export function getNodeCenter(node: Node): Point {
  const width = node.measured?.width ?? defaultNodeWidth;
  const height = node.measured?.height ?? defaultNodeHeight;
  return {
    x: node.position.x + width / 2,
    y: node.position.y + height / 2
  };
}

export function resolveEdgeRoute(sourceNode: Node, targetNode: Node, previous?: EdgeRoute): EdgeRoute {
  const sourceCenter = getNodeCenter(sourceNode);
  const targetCenter = getNodeCenter(targetNode);
  const dx = targetCenter.x - sourceCenter.x;
  const dy = targetCenter.y - sourceCenter.y;
  const absoluteX = Math.abs(dx);
  const absoluteY = Math.abs(dy);

  if (absoluteX < centerDeadZone && absoluteY < centerDeadZone) {
    return previous ?? {
      axis: "horizontal",
      sourceHandle: sourceHandleBySide.right,
      targetHandle: targetHandleBySide.left
    };
  }

  let axis: EdgeRoute["axis"];
  if (previous?.axis === "horizontal") {
    axis = absoluteY > absoluteX * axisHysteresis ? "vertical" : "horizontal";
  } else if (previous?.axis === "vertical") {
    axis = absoluteX > absoluteY * axisHysteresis ? "horizontal" : "vertical";
  } else {
    axis = absoluteX >= absoluteY ? "horizontal" : "vertical";
  }

  if (axis === "horizontal") {
    if (absoluteX < centerDeadZone && previous?.axis === "horizontal") {
      return previous;
    }
    return dx < 0
      ? { axis, sourceHandle: sourceHandleBySide.left, targetHandle: targetHandleBySide.right }
      : { axis, sourceHandle: sourceHandleBySide.right, targetHandle: targetHandleBySide.left };
  }

  if (absoluteY < centerDeadZone && previous?.axis === "vertical") {
    return previous;
  }
  return dy < 0
    ? { axis, sourceHandle: sourceHandleBySide.top, targetHandle: targetHandleBySide.bottom }
    : { axis, sourceHandle: sourceHandleBySide.bottom, targetHandle: targetHandleBySide.top };
}
