import { apiRequest } from "./client";
import type { Paper, PaperCreateRequest, PaperUpdateRequest } from "../types/paper";

export function createPaper(projectId: string, payload: PaperCreateRequest): Promise<Paper> {
  return apiRequest<Paper>(`/projects/${projectId}/papers`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getPaper(paperId: string): Promise<Paper> {
  return apiRequest<Paper>(`/papers/${paperId}`);
}

export function updatePaper(paperId: string, payload: PaperUpdateRequest): Promise<Paper> {
  return apiRequest<Paper>(`/papers/${paperId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deletePaper(paperId: string): Promise<void> {
  return apiRequest<void>(`/papers/${paperId}`, {
    method: "DELETE"
  });
}

