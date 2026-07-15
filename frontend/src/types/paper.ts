export type NodeColor = "clay" | "jade" | "ultramarine" | "indigo";
export type LegacyNodeColor = "ochre" | "olive" | "cinnabar" | "graphite";
export type NodeShape = "rounded" | "note" | "capsule";

export type PaperMetadata = {
  tags?: string[];
  status?: string;
  tldr?: string;
  nodeColor?: NodeColor | LegacyNodeColor;
  nodeShape?: NodeShape;
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
