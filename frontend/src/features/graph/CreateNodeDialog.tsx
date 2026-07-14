import { FormEvent, useState } from "react";
import { Plus, X } from "lucide-react";
import type { PaperCreateRequest } from "../../types/paper";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: PaperCreateRequest) => void;
  isCreating: boolean;
};

export function CreateNodeDialog({ open, onClose, onCreate, isCreating }: Props) {
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [venue, setVenue] = useState("");
  const [tags, setTags] = useState("");

  if (!open) {
    return null;
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return;
    }
    onCreate({
      title: trimmedTitle,
      metadata: {
        year: year ? Number(year) : null,
        venue: venue.trim(),
        tags: tags
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        status: "Unread"
      },
      position: { x: 120, y: 120 }
    });
    setTitle("");
    setYear("");
    setVenue("");
    setTags("");
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <form className="dialog" onSubmit={submit}>
        <div className="dialog-header">
          <div>
            <span className="eyebrow">New Paper</span>
            <h2>新建论文节点</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        <label className="span-2">
          标题
          <input value={title} onChange={(event) => setTitle(event.target.value)} autoFocus required />
        </label>
        <div className="dialog-grid">
          <label>
            年份
            <input value={year} onChange={(event) => setYear(event.target.value)} inputMode="numeric" placeholder="2026" />
          </label>
          <label>
            会议 / 期刊
            <input value={venue} onChange={(event) => setVenue(event.target.value)} placeholder="SIGGRAPH" />
          </label>
        </div>
        <label>
          标签
          <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="数字人, 表情生成, 交互" />
        </label>
        <div className="dialog-actions">
          <button type="button" onClick={onClose}>
            取消
          </button>
          <button className="primary-action" type="submit" disabled={isCreating || !title.trim()}>
            <Plus size={17} />
            {isCreating ? "创建中" : "创建节点"}
          </button>
        </div>
      </form>
    </div>
  );
}
