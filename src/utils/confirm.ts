export type ConfirmDialogState = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
};

let showHandler: ((state: ConfirmDialogState) => void) | null = null;

export function registerConfirmHandler(handler: (state: ConfirmDialogState) => void): void {
  showHandler = handler;
}

export function confirmDestructive(title: string, message: string, confirmLabel: string, onConfirm: () => void): void {
  showHandler?.({ title, message, confirmLabel, onConfirm });
}
