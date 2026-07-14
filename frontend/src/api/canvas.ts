import { apiRequest } from "./client";

export function updateCanvasNodePosition(canvasNodeId: string, x: number, y: number): Promise<void> {
  return apiRequest<void>(`/canvas-nodes/${canvasNodeId}`, {
    method: "PATCH",
    body: JSON.stringify({ x, y })
  });
}

