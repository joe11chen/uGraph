import { Tags, Users } from "lucide-react";
import { SelectField } from "../../components/SelectField";
import type { PaperMetadata } from "../../types/paper";

type Props = {
  title: string;
  metadata: PaperMetadata;
  onTitleChange: (title: string) => void;
  onMetadataChange: (metadata: PaperMetadata) => void;
};

const statusOptions = ["Unread", "Reading", "Read", "Important", "Archived"];
const statusSelectOptions = statusOptions.map((status) => ({ value: status, label: status }));

export function PaperMetadataForm({ title, metadata, onTitleChange, onMetadataChange }: Props) {
  const tags = Array.isArray(metadata.tags) ? metadata.tags.join(", ") : "";
  const authors = Array.isArray(metadata.authors) ? metadata.authors.join(", ") : "";

  function updateMetadata(next: Partial<PaperMetadata>) {
    onMetadataChange({ ...metadata, ...next });
  }

  return (
    <section className="metadata-panel">
      <div className="metadata-heading">
        <div>
          <span className="eyebrow">Metadata</span>
          <h3>论文档案</h3>
        </div>
        <span className="status-chip">{String(metadata.status ?? "Unread")}</span>
      </div>
      <label className="title-field">
        标题
        <input value={title} onChange={(event) => onTitleChange(event.target.value)} required />
      </label>
      <div className="metadata-grid">
        <label>
          <span className="label-with-icon">
            <Users size={14} />
            作者
          </span>
          <input
            value={authors}
            onChange={(event) =>
              updateMetadata({
                authors: event.target.value
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean)
              })
            }
            placeholder="Ashish Vaswani, Noam Shazeer"
          />
        </label>
        <label>
          年份
          <input
            value={metadata.year ? String(metadata.year) : ""}
            onChange={(event) =>
              updateMetadata({
                year: event.target.value ? Number(event.target.value) : null
              })
            }
            inputMode="numeric"
          />
        </label>
        <label>
          会议 / 期刊
          <input value={String(metadata.venue ?? "")} onChange={(event) => updateMetadata({ venue: event.target.value })} />
        </label>
        <label>
          状态
          <SelectField
            value={String(metadata.status ?? "Unread")}
            options={statusSelectOptions}
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
            value={tags}
            onChange={(event) =>
              updateMetadata({
                tags: event.target.value
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean)
              })
            }
            placeholder="Transformer, NLP"
          />
        </label>
      </div>
    </section>
  );
}
