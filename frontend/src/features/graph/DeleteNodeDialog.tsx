import { AlertTriangle, Trash2, X } from "lucide-react";

type Props = {
  open: boolean;
  title: string;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteNodeDialog({ open, title, isDeleting, onCancel, onConfirm }: Props) {
  if (!open) {
    return null;
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="dialog delete-node-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-node-title">
        <div className="dialog-header">
          <div className="delete-dialog-title">
            <span className="delete-dialog-mark" aria-hidden="true">
              <AlertTriangle size={18} />
            </span>
            <div>
              <span className="eyebrow">Delete Node</span>
              <h2 id="delete-node-title">删除论文节点</h2>
            </div>
          </div>
          <button type="button" className="icon-button" onClick={onCancel} aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        <p className="delete-dialog-copy">
          确认删除“<strong>{title}</strong>”？该论文笔记和画布节点都会被删除。
        </p>
        <div className="dialog-actions">
          <button type="button" onClick={onCancel}>
            取消
          </button>
          <button type="button" className="danger-primary" onClick={onConfirm} disabled={isDeleting}>
            <Trash2 size={17} />
            {isDeleting ? "删除中" : "删除节点"}
          </button>
        </div>
      </section>
    </div>
  );
}
