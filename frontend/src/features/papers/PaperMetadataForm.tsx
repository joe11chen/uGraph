import { FileText, Tags } from "lucide-react";
import { SelectField } from "../../components/SelectField";
import type { PaperMetadata } from "../../types/paper";
import { formatPaperStatus, paperStatusOptions } from "../../utils/labels";

type Props = {
  title: string;
  metadata: PaperMetadata;
  onTitleChange: (title: string) => void;
  onMetadataChange: (metadata: PaperMetadata) => void;
};

export function PaperMetadataForm({ title, metadata, onTitleChange, onMetadataChange }: Props) {
  const tags = [
    ...(Array.isArray(metadata.tags) ? metadata.tags : []),
    ...(Array.isArray(metadata.authors) ? metadata.authors : []),
    metadata.year,
    metadata.venue
  ]
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
  const tagText = Array.from(new Set(tags)).join(", ");
  const tldr = String(metadata.tldr ?? "");

  function updateMetadata(next: Partial<PaperMetadata>) {
    const { authors: _authors, year: _year, venue: _venue, ...base } = metadata;
    onMetadataChange({ ...base, ...next });
  }

  return (
    <section className="metadata-panel">
      <div className="metadata-heading">
        <div>
          <span className="eyebrow">文献信息</span>
          <h3>资料卡片</h3>
        </div>
        <span className="status-chip">{formatPaperStatus(metadata.status)}</span>
      </div>
      <label className="title-field">
        标题
        <input value={title} onChange={(event) => onTitleChange(event.target.value)} required />
      </label>
      <div className="metadata-grid">
        <label>
          状态
          <SelectField
            value={String(metadata.status ?? "Unread")}
            options={paperStatusOptions}
            onChange={(status) => updateMetadata({ status })}
            ariaLabel="选择状态"
          />
        </label>
        <label className="span-2">
          <span className="label-with-icon">
            <Tags size={14} />
            标签
          </span>
          <input
            value={tagText}
            onChange={(event) =>
              updateMetadata({
                tags: event.target.value
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean)
              })
            }
            placeholder="作者、会议、主题，用逗号分隔"
          />
        </label>
        <label className="span-2">
          <span className="label-with-icon">
            <FileText size={14} />
            TLDR
          </span>
          <textarea
            className="rich-textarea"
            value={tldr}
            onChange={(event) => updateMetadata({ tldr: event.target.value })}
            placeholder="用简短段落记录核心结论、方法贡献或待追踪问题。支持 Markdown 风格的简短标记。"
          />
        </label>
      </div>
    </section>
  );
}
