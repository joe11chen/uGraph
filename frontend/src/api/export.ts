import { apiRequest, apiUrl } from "./client";

export function paperMarkdownUrl(paperId: string): string {
  return apiUrl(`/papers/${paperId}/export/markdown`);
}

export function exportProjectMarkdown(projectId: string): Promise<{ export_path: string }> {
  return apiRequest<{ export_path: string }>(`/projects/${projectId}/export/markdown`, {
    method: "POST"
  });
}

