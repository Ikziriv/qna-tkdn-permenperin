import React from 'react';
import { useTranslation } from 'react-i18next';

/** Props for the Spinner loading indicator. */
export interface SpinnerProps {
  /** Size class for the spinner. Defaults to 'h-8 w-8'. */
  size?: string;
  /** Color class for the spinner border. Defaults to 'border-blue-600'. */
  color?: string;
  /** Accessible label for screen readers. */
  label?: string;
  /** Additional CSS classes for the wrapper. */
  className?: string;
}

/**
 * Reusable Spinner primitive for loading states.
 */
export const Spinner: React.FC<SpinnerProps> = ({
  size = 'h-8 w-8',
  color = 'border-blue-600',
  label,
  className = '',
}) => {
  const { t } = useTranslation();
  const resolvedLabel = label || t('common.loading');
  return (
    <div className={`flex items-center justify-center ${className}`} role="status" aria-live="polite">
      <div
        className={`animate-spin rounded-full ${size} border-b-2 ${color}`}
        aria-label={resolvedLabel}
      />
      <span className="sr-only">{resolvedLabel}</span>
    </div>
  );
};
