import { useEffect } from "react";

type Props = {
  message: string | null;
  onDismiss: () => void;
  durationMs?: number;
};

export function NoticeBanner({ message, onDismiss, durationMs = 3200 }: Props) {
  useEffect(() => {
    if (!message) {
      return;
    }

    const timer = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs, message, onDismiss]);

  if (!message) {
    return null;
  }

  return (
    <div className="notice" role="status" aria-live="polite">
      <span>{message}</span>
      <button className="text-button" onClick={onDismiss}>
        关闭
      </button>
    </div>
  );
}
