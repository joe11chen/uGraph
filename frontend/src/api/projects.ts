import { apiRequest } from "./client";
import type { GraphData, Project } from "../types/graph";

export function getDefaultProject(): Promise<Project> {
  return apiRequest<Project>("/projects/default");
}

export function getProjectGraph(projectId: string): Promise<GraphData> {
  return apiRequest<GraphData>(`/projects/${projectId}/graph`);
}

