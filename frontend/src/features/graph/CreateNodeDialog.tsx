import { FormEvent, useState } from "react";
import { Plus, X } from "lucide-react";
import { SelectField } from "../../components/SelectField";
import type { PaperCreateRequest } from "../../types/paper";
import { paperStatusOptions } from "../../utils/labels";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: PaperCreateRequest) => void;
  isCreating: boolean;
};

export function CreateNodeDialog({ open, onClose, onCreate, isCreating }: Props) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("Unread");
  const [tags, setTags] = useState("");
  const [tldr, setTldr] = useState("");

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
        tags: tags
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        status,
        tldr: tldr.trim()
      },
      position: { x: 120, y: 120 }
    });
    setTitle("");
    setStatus("Unread");
    setTags("");
    setTldr("");
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <form className="dialog" onSubmit={submit}>
        <div className="dialog-header">
          <div>
            <span className="eyebrow">新文献</span>
            <h2>添加文献</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        <label className="span-2">
          标题
          <input value={title} onChange={(event) => setTitle(event.target.value)} autoFocus required />
        </label>
        <label>
          状态
          <SelectField value={status} options={paperStatusOptions} onChange={setStatus} ariaLabel="选择状态" />
        </label>
        <label>
          标签
          <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="作者、会议、主题，用逗号分隔" />
        </label>
        <label>
          TLDR
          <textarea
            className="rich-textarea"
            value={tldr}
            onChange={(event) => setTldr(event.target.value)}
            placeholder="用一两句话记录核心结论、方法或价值。支持 Markdown 风格的简短标记。"
          />
        </label>
        <div className="dialog-actions">
          <button type="button" onClick={onClose}>
            取消
          </button>
          <button className="primary-action" type="submit" disabled={isCreating || !title.trim()}>
            <Plus size={17} />
            {isCreating ? "添加中" : "添加文献"}
          </button>
        </div>
      </form>
    </div>
  );
}
