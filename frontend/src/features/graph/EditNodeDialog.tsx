import { FormEvent, KeyboardEvent, useEffect, useState } from "react";
import { Circle, Palette, Plus, Save, Square, Tags, Users, X } from "lucide-react";
import { SelectField } from "../../components/SelectField";
import type { Paper, PaperMetadata } from "../../types/paper";
import type { IncomingRelationGroup, RelationLabel } from "../../types/relation";

type NodeColor = NonNullable<PaperMetadata["nodeColor"]>;
type NodeShape = NonNullable<PaperMetadata["nodeShape"]>;

type Props = {
  open: boolean;
  paper: Paper | null;
  isLoading: boolean;
  isSaving: boolean;
  availablePapers: Array<{ id: string; title: string }>;
  relationLabels: RelationLabel[];
  incomingRelationGroups: IncomingRelationGroup[];
  onClose: () => void;
  onSave: (payload: { title: string; metadata: PaperMetadata; relationGroups: IncomingRelationGroup[] }) => void;
};

const statusOptions = ["Unread", "Reading", "Read", "Important", "Archived"];
const statusSelectOptions = statusOptions.map((status) => ({ value: status, label: status }));

const colorOptions: Array<{ value: NodeColor; label: string }> = [
  { value: "clay", label: "陶土" },
  { value: "ochre", label: "赭黄" },
  { value: "olive", label: "橄榄" },
  { value: "cinnabar", label: "朱砂" },
  { value: "graphite", label: "石墨" }
];

const shapeOptions: Array<{ value: NodeShape; label: string }> = [
  { value: "rounded", label: "圆角" },
  { value: "note", label: "便签" },
  { value: "capsule", label: "胶囊" }
];

function listToText(value: unknown): string {
  return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean).join(", ") : "";
}

function textToList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeColor(value: unknown): NodeColor {
  return colorOptions.some((option) => option.value === value) ? (value as NodeColor) : "clay";
}

function normalizeShape(value: unknown): NodeShape {
  return shapeOptions.some((option) => option.value === value) ? (value as NodeShape) : "rounded";
}

export function EditNodeDialog({
  open,
  paper,
  isLoading,
  isSaving,
  availablePapers,
  relationLabels,
  incomingRelationGroups,
  onClose,
  onSave
}: Props) {
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [year, setYear] = useState("");
  const [venue, setVenue] = useState("");
  const [status, setStatus] = useState("Unread");
  const [tags, setTags] = useState("");
  const [nodeColor, setNodeColor] = useState<NodeColor>("clay");
  const [nodeShape, setNodeShape] = useState<NodeShape>("rounded");
  const [relationGroups, setRelationGroups] = useState<IncomingRelationGroup[]>([]);
  const [draftRelation, setDraftRelation] = useState({ labelId: "", sourceId: "" });
  const [activeTab, setActiveTab] = useState<"metadata" | "style" | "relations">("metadata");

  useEffect(() => {
    if (!paper) {
      return;
    }

    setTitle(paper.title);
    setAuthors(listToText(paper.metadata.authors));
    setYear(paper.metadata.year ? String(paper.metadata.year) : "");
    setVenue(String(paper.metadata.venue ?? ""));
    setStatus(String(paper.metadata.status ?? "Unread"));
    setTags(listToText(paper.metadata.tags));
    setNodeColor(normalizeColor(paper.metadata.nodeColor));
    setNodeShape(normalizeShape(paper.metadata.nodeShape));
    setActiveTab("metadata");
  }, [paper]);

  useEffect(() => {
    setRelationGroups(incomingRelationGroups.map((group) => ({ ...group, source_paper_ids: [...group.source_paper_ids] })));
    setDraftRelation({ labelId: "", sourceId: "" });
  }, [incomingRelationGroups]);

  if (!open) {
    return null;
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !paper) {
      return;
    }

    onSave({
      title: title.trim(),
      metadata: {
        ...paper.metadata,
        authors: textToList(authors),
        year: year ? Number(year) : null,
        venue: venue.trim(),
        status,
        tags: textToList(tags),
        nodeColor,
        nodeShape
      },
      relationGroups: relationGroups
        .map((group) => ({
          label_id: group.label_id,
          source_paper_ids: Array.from(new Set(group.source_paper_ids)).filter((sourceId) => sourceId !== paper.id)
        }))
        .filter((group) => group.source_paper_ids.length > 0)
    });
  }

  function addRelationEdge() {
    if (!draftRelation.labelId || !draftRelation.sourceId || draftRelation.sourceId === paper?.id) {
      return;
    }
    setRelationGroups((current) => {
      const existing = current.find((group) => group.label_id === draftRelation.labelId);
      if (!existing) {
        return [...current, { label_id: draftRelation.labelId, source_paper_ids: [draftRelation.sourceId] }];
      }
      if (existing.source_paper_ids.includes(draftRelation.sourceId)) {
        return current;
      }
      return current.map((group) =>
        group.label_id === draftRelation.labelId
          ? { ...group, source_paper_ids: [...group.source_paper_ids, draftRelation.sourceId] }
          : group
      );
    });
    setDraftRelation({ labelId: "", sourceId: "" });
  }

  function removeRelationEdge(labelId: string, sourceId: string) {
    setRelationGroups((current) =>
      current
        .map((group) =>
          group.label_id === labelId
            ? { ...group, source_paper_ids: group.source_paper_ids.filter((item) => item !== sourceId) }
            : group
        )
        .filter((group) => group.source_paper_ids.length > 0)
    );
  }

  const labelsById = new Map(relationLabels.map((label) => [label.id, label]));
  const papersById = new Map(availablePapers.map((paperItem) => [paperItem.id, paperItem]));
  const existingRelationEdges = relationGroups.flatMap((group) =>
    group.source_paper_ids.map((sourceId) => ({
      labelId: group.label_id,
      sourceId,
      label: labelsById.get(group.label_id),
      source: papersById.get(sourceId)
    }))
  );
  const draftSelectedSources = new Set(
    relationGroups.find((group) => group.label_id === draftRelation.labelId)?.source_paper_ids ?? []
  );
  const sourceOptions = availablePapers.filter((source) => source.id !== paper?.id && !draftSelectedSources.has(source.id));
  const dialogStyle = { width: "min(700px, calc(100vw - 36px))" };
  const titleRows = title.length > 62 ? 2 : 1;
  const canSave = !isSaving && !isLoading && Boolean(paper) && Boolean(title.trim());

  function handleFormKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      if (canSave) {
        event.currentTarget.requestSubmit();
      }
    }
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <form className={`dialog node-edit-dialog node-edit-dialog-${activeTab}`} style={dialogStyle} onSubmit={submit} onKeyDown={handleFormKeyDown}>
        <div className="dialog-header">
          <div>
            <span className="eyebrow">Node Inspector</span>
            <h2>编辑节点</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>

        {isLoading || !paper ? (
          <div className="dialog-loading">正在载入节点档案...</div>
        ) : (
          <div className="node-edit-body">
            <div className="node-edit-tabs" role="tablist" aria-label="节点编辑面板">
              <button
                type="button"
                className={activeTab === "metadata" ? "active" : ""}
                onClick={() => setActiveTab("metadata")}
                role="tab"
                aria-selected={activeTab === "metadata"}
              >
                Metadata
              </button>
              <button
                type="button"
                className={activeTab === "style" ? "active" : ""}
                onClick={() => setActiveTab("style")}
                role="tab"
                aria-selected={activeTab === "style"}
              >
                样式
              </button>
              <button
                type="button"
                className={activeTab === "relations" ? "active" : ""}
                onClick={() => setActiveTab("relations")}
                role="tab"
                aria-selected={activeTab === "relations"}
              >
                关系
                {existingRelationEdges.length > 0 ? <span>{existingRelationEdges.length}</span> : null}
              </button>
            </div>
            {activeTab === "metadata" ? (
              <div className="node-edit-content node-tab-panel" role="tabpanel">
                <label className="title-field">
                  标题
                  <textarea
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                      }
                    }}
                    rows={titleRows}
                    autoFocus
                    required
                  />
                </label>
                <div className="node-edit-main">
                  <div className="node-metadata-grid">
                    <label>
                      <span className="label-with-icon">
                        <Users size={14} />
                        作者
                      </span>
                      <input value={authors} onChange={(event) => setAuthors(event.target.value)} placeholder="Ashish Vaswani, Noam Shazeer" />
                    </label>
                    <label>
                      年份
                      <input value={year} onChange={(event) => setYear(event.target.value)} inputMode="numeric" placeholder="2026" />
                    </label>
                    <label>
                      会议 / 期刊
                      <input value={venue} onChange={(event) => setVenue(event.target.value)} placeholder="SIGGRAPH" />
                    </label>
                    <label>
                      状态
                      <SelectField value={status} options={statusSelectOptions} onChange={setStatus} ariaLabel="选择状态" />
                    </label>
                    <label className="span-full">
                      <span className="label-with-icon">
                        <Tags size={14} />
                        标签
                      </span>
                      <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Transformer, NLP" />
                    </label>
                  </div>
                </div>

              </div>
            ) : activeTab === "style" ? (
              <section className="node-style-tab node-tab-panel" role="tabpanel">
                <div className="node-relation-context">
                  <span>当前节点</span>
                  <strong>{title}</strong>
                </div>
                <div className="subpanel-heading">
                  <span className="eyebrow">Node Style</span>
                  <h3>节点显示样式</h3>
                </div>
                <div className="node-style-grid">
                  <fieldset>
                    <legend>
                      <Palette size={14} />
                      颜色
                    </legend>
                    <div className="swatch-row">
                      {colorOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={`swatch-option node-color-${option.value}${nodeColor === option.value ? " selected" : ""}`}
                          onClick={() => setNodeColor(option.value)}
                          aria-pressed={nodeColor === option.value}
                        >
                          <span aria-hidden="true" />
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <fieldset>
                    <legend>
                      <Square size={14} />
                      形状
                    </legend>
                    <div className="shape-row">
                      {shapeOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={`shape-option node-shape-${option.value}${nodeShape === option.value ? " selected" : ""}`}
                          onClick={() => setNodeShape(option.value)}
                          aria-pressed={nodeShape === option.value}
                        >
                          {option.value === "capsule" ? <Circle size={14} /> : <Square size={14} />}
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                </div>
              </section>
            ) : (
              <section className="incoming-relations-panel node-relations-tab node-tab-panel" role="tabpanel">
                <div className="node-relation-context">
                  <span>当前节点</span>
                  <strong>{title}</strong>
                </div>
                <div className="subpanel-heading">
                  <span className="eyebrow">Incoming Relations</span>
                  <h3>指向本文的关系</h3>
                </div>
                <div className="relation-edge-list">
                  <div className="relation-edge-header" aria-hidden="true">
                    <span>来源节点</span>
                    <span>标签关系</span>
                    <span />
                  </div>
                  {existingRelationEdges.length === 0 ? (
                    <p className="empty-copy">暂无指向本文的关系。</p>
                  ) : (
                    existingRelationEdges.map((edge) => (
                      <div className="relation-edge-row" key={`${edge.labelId}-${edge.sourceId}`}>
                        <span className="relation-source-card">
                          <strong>{edge.source?.title ?? edge.sourceId}</strong>
                        </span>
                        <span className="relation-label-pill" style={{ borderColor: edge.label?.color ?? undefined }}>
                          <span className="relation-emoji" aria-hidden="true">
                            {edge.label?.emoji ?? "🔗"}
                          </span>
                          <span className="relation-label-text">
                            <strong>{edge.label?.name ?? edge.labelId}</strong>
                          </span>
                        </span>
                        <button
                          type="button"
                          className="icon-button compact"
                          onClick={() => removeRelationEdge(edge.labelId, edge.sourceId)}
                          aria-label="移除关系"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))
                  )}
                  <div className="relation-edge-row relation-edge-add">
                    <div className="relation-picker-field">
                      <SelectField
                        value={draftRelation.sourceId}
                        options={sourceOptions.map((source) => ({ value: source.id, label: source.title }))}
                        onChange={(sourceId) => setDraftRelation((current) => ({ ...current, sourceId }))}
                        placeholder="选择来源节点"
                        disabled={!draftRelation.labelId}
                        ariaLabel="选择来源节点"
                      />
                    </div>
                    <div className="relation-picker-field">
                      <SelectField
                        value={draftRelation.labelId}
                        options={relationLabels.map((label) => ({ value: label.id, label: `${label.emoji} ${label.name}` }))}
                        onChange={(labelId) => setDraftRelation((current) => ({ ...current, labelId, sourceId: "" }))}
                        placeholder="选择关系"
                        disabled={relationLabels.length === 0}
                        ariaLabel="选择关系标签"
                      />
                    </div>
                    <button type="button" onClick={addRelationEdge} disabled={!draftRelation.labelId || !draftRelation.sourceId}>
                      <Plus size={15} />
                      添加
                    </button>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}

        <div className="dialog-actions">
          <button type="button" onClick={onClose}>
            取消
          </button>
          <button className="primary-action" type="submit" disabled={!canSave}>
            <Save size={17} />
            {isSaving ? "保存中" : "保存节点"}
          </button>
        </div>
      </form>
    </div>
  );
}
