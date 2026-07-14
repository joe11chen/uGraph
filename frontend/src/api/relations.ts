import { apiRequest } from "./client";
import type { IncomingRelations, IncomingRelationsUpdate, RelationLabel, RelationLabelInput } from "../types/relation";

export function getProjectRelationLabels(projectId: string): Promise<RelationLabel[]> {
  return apiRequest<RelationLabel[]>(`/projects/${projectId}/relation-labels`);
}

export function createRelationLabel(projectId: string, payload: RelationLabelInput): Promise<RelationLabel> {
  return apiRequest<RelationLabel>(`/projects/${projectId}/relation-labels`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateRelationLabel(labelId: string, payload: RelationLabelInput): Promise<RelationLabel> {
  return apiRequest<RelationLabel>(`/relation-labels/${labelId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deleteRelationLabel(labelId: string): Promise<void> {
  return apiRequest<void>(`/relation-labels/${labelId}`, {
    method: "DELETE"
  });
}

export function getIncomingRelations(paperId: string): Promise<IncomingRelations> {
  return apiRequest<IncomingRelations>(`/papers/${paperId}/incoming-relations`);
}

export function updateIncomingRelations(paperId: string, payload: IncomingRelationsUpdate): Promise<IncomingRelations> {
  return apiRequest<IncomingRelations>(`/papers/${paperId}/incoming-relations`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}
