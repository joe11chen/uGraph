export type PaperMetadata = {
  tags?: string[];
  status?: string;
  tldr?: string;
  nodeColor?: "clay" | "ochre" | "olive" | "cinnabar" | "graphite";
  nodeShape?: "rounded" | "note" | "capsule";
  [key: string]: unknown;
};

export type Paper = {
  id: string;
  project_id: string;
  title: string;
  metadata: PaperMetadata;
  markdown_content: string;
  version: number;
  created_at: string;
  updated_at: string;
};

export type PaperCreateRequest = {
  title: string;
  metadata?: PaperMetadata;
  position?: {
    x: number;
    y: number;
  };
};

export type PaperUpdateRequest = {
  title: string;
  metadata: PaperMetadata;
  markdown_content: string;
  version: number;
};
