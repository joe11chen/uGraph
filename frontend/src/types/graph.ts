import type { PaperMetadata } from "./paper";
import type { Relation, RelationLabel } from "./relation";

export type Project = {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
};

export type Canvas = {
  id: string;
  project_id: string;
  name: string;
  viewport_x: number;
  viewport_y: number;
  zoom: number;
};

export type GraphNode = {
  id: string;
  paper_id: string;
  position: {
    x: number;
    y: number;
  };
  paper: {
    id: string;
    title: string;
    metadata: PaperMetadata;
  };
};

export type GraphData = {
  project: Project;
  canvas: Canvas;
  nodes: GraphNode[];
  edges: Relation[];
  relation_labels: RelationLabel[];
};
