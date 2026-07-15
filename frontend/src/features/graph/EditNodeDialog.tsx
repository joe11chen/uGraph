import { FormEvent, KeyboardEvent, useEffect, useState } from "react";
import { FileText, Palette, Pill, Plus, Save, SquareRoundCorner, StickyNote, Tags, X } from "lucide-react";
import { SelectField } from "../../components/SelectField";
import type { NodeColor, NodeShape, Paper, PaperMetadata } from "../../types/paper";
import type { IncomingRelationGroup, RelationLabel } from "../../types/relation";
import { formatRelationName, paperStatusOptions } from "../../utils/labels";
import { nodeColorOptions, nodeShapeOptions, normalizeNodeColor, normalizeNodeShape } from "./nodeStyles";

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

const shapeIcons = {
  rounded: SquareRoundCorner,
  note: StickyNote,
  capsule: Pill
};

function textToList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function mergedTagText(metadata: PaperMetadata): string {
  const legacyTags = [
    ...(Array.isArray(metadata.tags) ? metadata.tags : []),
    ...(Array.isArray(metadata.authors) ? metadata.authors : []),
    metadata.year,
    metadata.venue
  ]
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
  return Array.from(new Set(legacyTags)).join(", ");
}

function metadataBase(metadata: PaperMetadata): PaperMetadata {
  const { authors: _authors, year: _year, venue: _venue, ...base } = metadata;
  return base;
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
  const [status, setStatus] = useState("Unread");
  const [tags, setTags] = useState("");
  const [tldr, setTldr] = useState("");
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
    setStatus(String(paper.metadata.status ?? "Unread"));
    setTags(mergedTagText(paper.metadata));
    setTldr(String(paper.metadata.tldr ?? ""));
    setNodeColor(normalizeNodeColor(paper.metadata.nodeColor));
    setNodeShape(normalizeNodeShape(paper.metadata.nodeShape));
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
        ...metadataBase(paper.metadata),
        status,
        tags: textToList(tags),
        tldr: tldr.trim(),
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
      <form className={`dialog node-edit-dialog node-edit-dialog-${activeTab}`} onSubmit={submit} onKeyDown={handleFormKeyDown}>
        <div className="dialog-header">
          <div>
            <span className="eyebrow">文献档案</span>
            <h2>编辑文献</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>

        {isLoading || !paper ? (
          <div className="dialog-loading">正在载入文献信息...</div>
        ) : (
          <div className="node-edit-body">
            <div className="node-edit-tabs" role="tablist" aria-label="文献编辑面板">
              <button
                type="button"
                className={activeTab === "metadata" ? "active" : ""}
                onClick={() => setActiveTab("metadata")}
                role="tab"
                aria-selected={activeTab === "metadata"}
              >
                信息
              </button>
              <button
                type="button"
                className={activeTab === "style" ? "active" : ""}
                onClick={() => setActiveTab("style")}
                role="tab"
                aria-selected={activeTab === "style"}
              >
                显示
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
                      状态
                      <SelectField value={status} options={paperStatusOptions} onChange={setStatus} ariaLabel="选择状态" />
                    </label>
                    <label className="span-full">
                      <span className="label-with-icon">
                        <Tags size={14} />
                        标签
                      </span>
                      <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="作者、会议、主题，用逗号分隔" />
                    </label>
                    <label className="span-full">
                      <span className="label-with-icon">
                        <FileText size={14} />
                        TLDR
                      </span>
                      <textarea
                        className="rich-textarea"
                        value={tldr}
                        onChange={(event) => setTldr(event.target.value)}
                        placeholder="记录核心结论、方法贡献或后续要追踪的问题。支持 Markdown 风格的简短标记。"
                      />
                    </label>
                  </div>
                </div>

              </div>
            ) : activeTab === "style" ? (
              <section className="node-style-tab node-tab-panel" role="tabpanel">
                <div className="node-relation-context">
                  <span>当前文献</span>
                  <strong>{title}</strong>
                </div>
                <div className="subpanel-heading">
                  <span className="eyebrow">展示方式</span>
                  <h3>文献卡片样式</h3>
                </div>
                <div className="node-style-grid">
                  <fieldset>
                    <legend>
                      <Palette size={14} />
                      颜色
                    </legend>
                    <div className="swatch-row">
                      {nodeColorOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={`swatch-option${nodeColor === option.value ? " selected" : ""}`}
                          onClick={() => setNodeColor(option.value)}
                          aria-pressed={nodeColor === option.value}
                        >
                          <span
                            className={`node-style-preview node-color-${option.value} node-shape-${nodeShape}`}
                            aria-hidden="true"
                          >
                            <span />
                            <span />
                          </span>
                          <span>{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <fieldset>
                    <legend>
                      <SquareRoundCorner size={14} />
                      形状
                    </legend>
                    <div className="shape-row">
                      {nodeShapeOptions.map((option) => {
                        const ShapeIcon = shapeIcons[option.value];
                        return (
                          <button
                            key={option.value}
                            type="button"
                            className={`shape-option${nodeShape === option.value ? " selected" : ""}`}
                            onClick={() => setNodeShape(option.value)}
                            aria-pressed={nodeShape === option.value}
                          >
                            <ShapeIcon size={15} />
                            <span
                              className={`node-style-preview node-color-${nodeColor} node-shape-${option.value}`}
                              aria-hidden="true"
                            >
                              <span />
                              <span />
                            </span>
                            <span>{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                </div>
              </section>
            ) : (
              <section className="incoming-relations-panel node-relations-tab node-tab-panel" role="tabpanel">
                <div className="node-relation-context">
                  <span>当前文献</span>
                  <strong>{title}</strong>
                </div>
                <div className="subpanel-heading">
                  <span className="eyebrow">文献关系</span>
                  <h3>指向本文的关系</h3>
                </div>
                <div className="relation-edge-list">
                  <div className="relation-edge-header" aria-hidden="true">
                    <span>来源文献</span>
                    <span>关系类型</span>
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
                          <span
                            className={`relation-line-sample line-${edge.label?.line_style ?? "solid"}`}
                            style={{ borderTopColor: edge.label?.color ?? undefined }}
                            aria-hidden="true"
                          />
                          <span className="relation-emoji" aria-hidden="true">
                            {edge.label?.emoji ?? "🔗"}
                          </span>
                          <span className="relation-label-text">
                            <strong>{edge.label ? formatRelationName(edge.label.name) : edge.labelId}</strong>
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
                        placeholder="选择来源文献"
                        disabled={!draftRelation.labelId}
                        ariaLabel="选择来源文献"
                      />
                    </div>
                    <div className="relation-picker-field">
                      <SelectField
                        value={draftRelation.labelId}
                        options={relationLabels.map((label) => ({ value: label.id, label: `${label.emoji} ${formatRelationName(label.name)}` }))}
                        onChange={(labelId) => setDraftRelation((current) => ({ ...current, labelId, sourceId: "" }))}
                        placeholder="选择关系类型"
                        disabled={relationLabels.length === 0}
                        ariaLabel="选择关系类型"
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
            {isSaving ? "保存中" : "保存文献"}
          </button>
        </div>
      </form>
    </div>
  );
}
