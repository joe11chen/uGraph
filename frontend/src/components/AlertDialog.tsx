import { AlertTriangle, X } from "lucide-react";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
};

export function AlertDialog({ open, title, message, confirmLabel = "确认", onConfirm }: Props) {
  if (!open) {
    return null;
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="dialog alert-dialog" role="alertdialog" aria-modal="true" aria-labelledby="alert-dialog-title">
        <div className="dialog-header">
          <div className="alert-dialog-title">
            <span className="alert-dialog-mark" aria-hidden="true">
              <AlertTriangle size={18} />
            </span>
            <div>
              <span className="eyebrow">Attention</span>
              <h2 id="alert-dialog-title">{title}</h2>
            </div>
          </div>
          <button type="button" className="icon-button" onClick={onConfirm} aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        <p className="alert-dialog-copy">{message}</p>
        <div className="dialog-actions">
          <button type="button" className="primary-action" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
