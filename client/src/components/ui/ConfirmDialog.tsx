import { AlertTriangle } from 'lucide-react';
import Button from './Button';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Löschen',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-bg-primary border border-border rounded-2xl shadow-glow-lg w-full max-w-sm p-6 flex flex-col items-center gap-4 animate-in">
        <div className="w-14 h-14 rounded-full bg-error/10 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-error" />
        </div>

        <h3 className="text-lg font-semibold text-txt-primary text-center">{title}</h3>
        <p className="text-sm text-txt-secondary text-center">{message}</p>

        <div className="flex gap-3 w-full mt-2">
          <Button variant="ghost" fullWidth onClick={onCancel} disabled={loading}>
            Abbrechen
          </Button>
          <Button variant="danger" fullWidth onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
