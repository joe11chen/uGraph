export const paperStatusOptions = [
  { value: "Unread", label: "待读" },
  { value: "Reading", label: "阅读中" },
  { value: "Read", label: "已读" },
  { value: "Important", label: "重点" },
  { value: "Archived", label: "归档" }
];

export function formatPaperStatus(value: unknown): string {
  const status = String(value ?? "Unread");
  return paperStatusOptions.find((option) => option.value === status)?.label ?? status;
}

const relationNameLabels = new Map([
  ["Cites", "引用"],
  ["Builds on", "延伸"],
  ["Uses method", "使用方法"],
  ["Compares with", "对比"]
]);

export function formatRelationName(value: unknown): string {
  const name = String(value ?? "");
  return relationNameLabels.get(name) ?? name;
}
