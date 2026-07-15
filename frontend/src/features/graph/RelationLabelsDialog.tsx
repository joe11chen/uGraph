import { FormEvent, useEffect, useState } from "react";
import { Plus, Save, Trash2, X } from "lucide-react";
import { SelectField } from "../../components/SelectField";
import type { RelationLabel, RelationLabelInput, RelationLineStyle } from "../../types/relation";
import { formatRelationName } from "../../utils/labels";

type Props = {
  open: boolean;
  labels: RelationLabel[];
  onClose: () => void;
  onCreate: (payload: RelationLabelInput) => void;
  onUpdate: (labelId: string, payload: RelationLabelInput) => void;
  onDelete: (labelId: string) => void;
  isMutating: boolean;
};

type Draft = RelationLabelInput;

const fallbackEmoji = "🔗";

const lineStyleOptions: Array<{ value: RelationLineStyle; label: string }> = [
  { value: "solid", label: "实线" },
  { value: "dashed", label: "虚线" },
  { value: "dotted", label: "点线" }
];
const lineStyleSelectOptions = lineStyleOptions.map((option) => ({ value: option.value, label: option.label }));

function labelToDraft(label: RelationLabel): Draft {
  return {
    name: formatRelationName(label.name),
    emoji: label.emoji,
    color: label.color,
    line_style: label.line_style,
    sort_order: label.sort_order
  };
}

function cleanDraft(draft: Draft): Draft {
  return {
    ...draft,
    name: draft.name.trim(),
    emoji: draft.emoji.trim() || fallbackEmoji
  };
}

export function RelationLabelsDialog({ open, labels, onClose, onCreate, onUpdate, onDelete, isMutating }: Props) {
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [newDraft, setNewDraft] = useState<Draft>({
    name: "",
    emoji: fallbackEmoji,
    color: "#b8653f",
    line_style: "solid",
    sort_order: 100
  });

  useEffect(() => {
    setDrafts(Object.fromEntries(labels.map((label) => [label.id, labelToDraft(label)])));
  }, [labels]);

  if (!open) {
    return null;
  }

  function updateDraft(labelId: string, patch: Partial<Draft>) {
    setDrafts((current) => ({ ...current, [labelId]: { ...current[labelId], ...patch } }));
  }

  function submitNew(event: FormEvent) {
    event.preventDefault();
    const payload = cleanDraft(newDraft);
    if (!payload.name) {
      return;
    }

    onCreate(payload);
    setNewDraft({
      name: "",
      emoji: fallbackEmoji,
      color: "#b8653f",
      line_style: "solid",
      sort_order: newDraft.sort_order + 10
    });
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="dialog relation-labels-dialog" role="dialog" aria-modal="true" aria-labelledby="relation-labels-title">
        <div className="dialog-header">
          <div>
            <span className="eyebrow">关系管理</span>
            <h2 id="relation-labels-title">关系类型</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>

        <div className="relation-label-editor">
          <div className="relation-label-list" aria-label="已有关系类型">
            {labels.map((label) => {
              const draft = drafts[label.id] ?? labelToDraft(label);
              const previewName = draft.name.trim() || "未命名";
              return (
                <div className="relation-label-row" key={label.id}>
                  <div className="relation-preview-pill" style={{ borderColor: draft.color }}>
                    <span className="relation-preview-emoji" aria-hidden="true">{draft.emoji.trim() || fallbackEmoji}</span>
                    <span
                      className={`relation-line-sample line-${draft.line_style}`}
                      style={{ borderTopColor: draft.color }}
                      aria-hidden="true"
                    />
                    <strong>{previewName}</strong>
                  </div>

                  <label className="compact-field relation-emoji-field">
                    <span>图标</span>
                    <input
                      value={draft.emoji}
                      onChange={(event) => updateDraft(label.id, { emoji: event.target.value })}
                      maxLength={16}
                      aria-label="关系图标"
                    />
                  </label>

                  <label className="compact-field relation-name-field">
                    <span>名称</span>
                    <input value={draft.name} onChange={(event) => updateDraft(label.id, { name: event.target.value })} aria-label="关系名称" />
                  </label>

                  <label className="compact-field relation-color-field">
                    <span>颜色</span>
                    <input type="color" value={draft.color} onChange={(event) => updateDraft(label.id, { color: event.target.value })} aria-label="关系颜色" />
                  </label>

                  <label className="compact-field relation-style-field">
                    <span>线型</span>
                    <SelectField
                      value={draft.line_style}
                      options={lineStyleSelectOptions}
                      onChange={(lineStyle) => updateDraft(label.id, { line_style: lineStyle as RelationLineStyle })}
                      ariaLabel="关系线型"
                    />
                  </label>

                  <label className="compact-field relation-order-field">
                    <span>排序</span>
                    <input
                      value={String(draft.sort_order)}
                      onChange={(event) => updateDraft(label.id, { sort_order: Number(event.target.value) || 0 })}
                      inputMode="numeric"
                      aria-label="排序"
                    />
                  </label>

                  <div className="relation-label-actions">
                    <button type="button" onClick={() => onUpdate(label.id, cleanDraft(draft))} disabled={isMutating || !draft.name.trim()}>
                      <Save size={15} />
                      保存
                    </button>
                    <button
                      type="button"
                      className="danger-action icon-only"
                      onClick={() => onDelete(label.id)}
                      disabled={isMutating}
                      aria-label="删除关系类型"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <form className="relation-label-new" onSubmit={submitNew}>
            <div className="relation-label-new-head">
              <span className="eyebrow">新增类型</span>
              <div className="relation-preview-pill" style={{ borderColor: newDraft.color }}>
                <span className="relation-preview-emoji" aria-hidden="true">{newDraft.emoji.trim() || fallbackEmoji}</span>
                <span
                  className={`relation-line-sample line-${newDraft.line_style}`}
                  style={{ borderTopColor: newDraft.color }}
                  aria-hidden="true"
                />
                <strong>{newDraft.name.trim() || "未命名"}</strong>
              </div>
            </div>

            <label className="compact-field relation-emoji-field">
              <span>图标</span>
              <input
                value={newDraft.emoji}
                onChange={(event) => setNewDraft((current) => ({ ...current, emoji: event.target.value }))}
                maxLength={16}
                aria-label="新关系图标"
              />
            </label>

            <label className="compact-field relation-name-field">
              <span>名称</span>
              <input value={newDraft.name} onChange={(event) => setNewDraft((current) => ({ ...current, name: event.target.value }))} placeholder="例如：引用、延伸、对比" />
            </label>

            <label className="compact-field relation-color-field">
              <span>颜色</span>
              <input
                type="color"
                value={newDraft.color}
                onChange={(event) => setNewDraft((current) => ({ ...current, color: event.target.value }))}
                aria-label="新关系颜色"
              />
            </label>

            <label className="compact-field relation-style-field">
              <span>线型</span>
              <SelectField
                value={newDraft.line_style}
                options={lineStyleSelectOptions}
                onChange={(lineStyle) => setNewDraft((current) => ({ ...current, line_style: lineStyle as RelationLineStyle }))}
                ariaLabel="新关系线型"
              />
            </label>

            <button className="primary-action" type="submit" disabled={isMutating || !newDraft.name.trim()}>
              <Plus size={16} />
              添加类型
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
