import React from 'react';

/** Button visual variants. */
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';

/** Button size presets. */
export type ButtonSize = 'sm' | 'md' | 'lg';

/** Full prop interface for the reusable Button component. */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant. Defaults to 'primary'. */
  variant?: ButtonVariant;
  /** Size preset. Defaults to 'md'. */
  size?: ButtonSize;
  /** Whether the button is in a loading state. */
  loading?: boolean;
  /** Whether the button should take full width of its container. */
  fullWidth?: boolean;
  /** Optional icon rendered before the label. */
  leftIcon?: React.ReactNode;
  /** Optional icon rendered after the label. */
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 disabled:bg-blue-300',
  secondary:
    'bg-slate-50 hover:bg-slate-100 text-slate-600 disabled:bg-slate-100 disabled:text-slate-400',
  danger:
    'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200 disabled:bg-red-300',
  ghost:
    'bg-transparent hover:bg-slate-50 text-slate-600 disabled:text-slate-300',
  outline:
    'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:text-slate-300',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-xs rounded-lg',
  md: 'px-6 py-3 text-sm rounded-xl',
  lg: 'px-6 py-4 text-base rounded-2xl',
};

/**
 * Reusable Button primitive.
 *
 * Supports multiple variants, sizes, loading state, and full-width layout.
 * All native button props are forwarded.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      children,
      className = '',
      disabled,
      ...rest
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center gap-2 font-bold transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2';

    const classes = [
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      fullWidth ? 'w-full' : '',
      className,
    ].join(' ');

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        aria-busy={loading}
        {...rest}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {!loading && leftIcon}
        {children}
        {!loading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
