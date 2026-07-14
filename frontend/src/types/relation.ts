export type RelationLineStyle = "solid" | "dashed" | "dotted";

export type RelationLabel = {
  id: string;
  project_id: string;
  name: string;
  emoji: string;
  color: string;
  line_style: RelationLineStyle;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Relation = {
  id: string;
  project_id: string;
  source_paper_id: string;
  target_paper_id: string;
  label_id: string;
  created_at: string;
  updated_at: string;
};

export type IncomingRelationGroup = {
  label_id: string;
  source_paper_ids: string[];
};

export type IncomingRelations = {
  target_paper_id: string;
  groups: IncomingRelationGroup[];
};

export type IncomingRelationsUpdate = {
  groups: IncomingRelationGroup[];
};

export type RelationLabelInput = {
  name: string;
  emoji: string;
  color: string;
  line_style: RelationLineStyle;
  sort_order: number;
};
