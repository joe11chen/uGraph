import { AlertTriangle, X } from "lucide-react";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "确认",
  cancelLabel = "取消",
  onCancel,
  onConfirm
}: Props) {
  if (!open) {
    return null;
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="dialog alert-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
        <div className="dialog-header">
          <div className="alert-dialog-title">
            <span className="alert-dialog-mark" aria-hidden="true">
              <AlertTriangle size={18} />
            </span>
            <div>
              <span className="eyebrow">确认操作</span>
              <h2 id="confirm-dialog-title">{title}</h2>
            </div>
          </div>
          <button type="button" className="icon-button" onClick={onCancel} aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        <p className="alert-dialog-copy">{message}</p>
        <div className="dialog-actions">
          <button type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="primary-action" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
