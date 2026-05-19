import React from 'react';

/** Props for the reusable ProgressBar component. */
export interface ProgressBarProps {
  /** Current progress value (0-100). */
  progress: number;
  /** Label displayed above the progress bar. */
  label?: string;
  /** Percentage text displayed on the right side. */
  percentageText?: string;
  /** Additional CSS classes for the outer container. */
  className?: string;
  /** Color theme for the filled bar. Defaults to 'blue'. */
  color?: 'blue' | 'emerald' | 'amber' | 'purple';
}

const colorClasses: Record<string, string> = {
  blue: 'bg-blue-600',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  purple: 'bg-purple-600',
};

/**
 * Reusable ProgressBar primitive.
 *
 * Displays a linear progress indicator with optional label and percentage text.
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  percentageText,
  className = '',
  color = 'blue',
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={className}>
      {(label || percentageText !== undefined) && (
        <div className="flex justify-between items-center mb-3">
          {label && (
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {label}
            </span>
          )}
          {percentageText !== undefined && (
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {percentageText}
            </span>
          )}
        </div>
      )}
      <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
};
