import { apiRequest } from "./client";

export type CanvasNodeLayoutItem = {
  canvas_node_id: string;
  x: number;
  y: number;
};

export function updateCanvasNodePosition(canvasNodeId: string, x: number, y: number): Promise<void> {
  return apiRequest<void>(`/canvas-nodes/${canvasNodeId}`, {
    method: "PATCH",
    body: JSON.stringify({ x, y })
  });
}

export function updateCanvasLayout(canvasId: string, nodes: CanvasNodeLayoutItem[]): Promise<void> {
  return apiRequest<void>(`/canvases/${canvasId}/nodes/layout`, {
    method: "PATCH",
    body: JSON.stringify({ nodes })
  });
}

