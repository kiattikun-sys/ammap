interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open: _open,
  title: _title,
  description: _description,
  onConfirm: _onConfirm,
  onCancel: _onCancel,
}: ConfirmDialogProps) {
  return <div>Confirm dialog placeholder</div>;
}
