import React, { useEffect } from 'react';

/** Props for the reusable Modal overlay component. */
export interface ModalProps {
  /** Whether the modal is visible. */
  isOpen: boolean;
  /** Content rendered inside the modal. */
  children: React.ReactNode;
  /** Additional CSS classes for the modal panel. */
  className?: string;
  /** Whether clicking the backdrop should close the modal. Defaults to true. */
  closeOnBackdropClick?: boolean;
  /** Callback fired when the modal requests to close. */
  onClose?: () => void;
  /** Max width class for the modal panel. */
  maxWidth?: string;
}

/**
 * Reusable Modal primitive.
 *
 * Renders a centered overlay with a backdrop blur. Does not manage its own open state.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  children,
  className = '',
  closeOnBackdropClick = true,
  onClose,
  maxWidth = 'max-w-md',
}) => {
  useEffect(() => {
    if (!isOpen || !onClose) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnBackdropClick) {
      onClose?.();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={[
          'bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-8 w-full animate-in zoom-in-95 slide-in-from-bottom-8 duration-500',
          maxWidth,
          className,
        ].join(' ')}
      >
        {children}
      </div>
    </div>
  );
};
