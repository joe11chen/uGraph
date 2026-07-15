import type { LegacyNodeColor, NodeColor, NodeShape } from "../../types/paper";

export const nodeColorOptions: Array<{ value: NodeColor; label: string }> = [
  { value: "clay", label: "陶土" },
  { value: "jade", label: "青玉" },
  { value: "ultramarine", label: "群青" },
  { value: "indigo", label: "靛青" }
];

export const nodeShapeOptions: Array<{ value: NodeShape; label: string }> = [
  { value: "rounded", label: "圆角" },
  { value: "note", label: "便签" },
  { value: "capsule", label: "胶囊" }
];

const selectableColors = new Set<NodeColor>(nodeColorOptions.map((option) => option.value));
const legacyColors = new Set<LegacyNodeColor>(["ochre", "olive", "cinnabar", "graphite"]);
const shapes = new Set<NodeShape>(nodeShapeOptions.map((option) => option.value));
const legacyColorMapping: Record<LegacyNodeColor, NodeColor> = {
  ochre: "clay",
  olive: "jade",
  cinnabar: "clay",
  graphite: "indigo"
};

export function getRenderedNodeColor(value: unknown): NodeColor | LegacyNodeColor {
  if (selectableColors.has(value as NodeColor) || legacyColors.has(value as LegacyNodeColor)) {
    return value as NodeColor | LegacyNodeColor;
  }
  return "clay";
}

export function normalizeNodeColor(value: unknown): NodeColor {
  if (selectableColors.has(value as NodeColor)) {
    return value as NodeColor;
  }
  if (legacyColors.has(value as LegacyNodeColor)) {
    return legacyColorMapping[value as LegacyNodeColor];
  }
  return "clay";
}

export function normalizeNodeShape(value: unknown): NodeShape {
  return shapes.has(value as NodeShape) ? (value as NodeShape) : "rounded";
}
