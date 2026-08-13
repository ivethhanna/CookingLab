import { KeyboardEvent, MouseEvent, ReactNode, useEffect, useId, useRef } from 'react';

type ConfirmDialogSeverity = 'normal' | 'destructive';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  severity?: ConfirmDialogSeverity;
  onCancel: () => void;
  onConfirm: () => void;
};

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancelar',
  severity = 'normal',
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    cancelButtonRef.current?.focus();

    return () => {
      previousFocusRef.current?.focus();
    };
  }, [open]);

  if (!open) {
    return null;
  }

  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      onCancel();
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusableElements = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []
    );

    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  return (
    <div className="dialog-overlay" onClick={handleBackdropClick} onKeyDown={handleKeyDown}>
      <div
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="confirm-dialog"
        ref={dialogRef}
        role="dialog"
      >
        <div className={`confirm-dialog-mark ${severity}`} aria-hidden="true">
          !
        </div>

        <div className="confirm-dialog-copy">
          <h3 id={titleId}>{title}</h3>
          <p id={descriptionId}>{description}</p>
        </div>

        <div className="confirm-dialog-actions">
          <button className="btn-secondary" onClick={onCancel} ref={cancelButtonRef} type="button">
            {cancelLabel}
          </button>
          <button className={`btn-primary confirm-dialog-confirm ${severity}`} onClick={onConfirm} type="button">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
