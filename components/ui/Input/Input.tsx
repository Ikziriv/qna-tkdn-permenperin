import React from 'react';

/** Props for the reusable Input component. */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Label text displayed above the input. */
  label?: string;
  /** Error message displayed below the input. */
  error?: string;
  /** Helper text displayed below the input when there is no error. */
  helperText?: string;
}

/**
 * Reusable Input primitive with optional label, error, and helper text.
 *
 * All native input props are forwarded.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...rest }, ref) => {
    const inputId = id || React.useId();
    const hasError = Boolean(error);

    return (
      <div className={className}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-slate-700 mb-2"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            'w-full px-4 py-3 rounded-xl border transition-all outline-none',
            'focus:ring-2 focus:border-transparent',
            hasError
              ? 'border-red-300 focus:ring-red-500 bg-red-50'
              : 'border-slate-200 focus:ring-blue-500',
          ].join(' ')}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${inputId}-error` : helperText ? `${inputId}-help` : undefined}
          {...rest}
        />
        {hasError && (
          <p id={`${inputId}-error`} className="mt-2 text-sm font-medium text-red-500">
            {error}
          </p>
        )}
        {!hasError && helperText && (
          <p id={`${inputId}-help`} className="mt-2 text-sm text-slate-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
