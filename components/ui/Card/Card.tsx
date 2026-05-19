import React from 'react';

/** Props for the Card container. */
export interface CardProps {
  /** Card contents. */
  children: React.ReactNode;
  /** Additional CSS classes. */
  className?: string;
  /** Whether to apply the default padding. Defaults to true. */
  padded?: boolean;
  /** Whether to apply the default shadow. Defaults to true. */
  shadow?: boolean;
  /** Whether to apply the default border radius. Defaults to true. */
  rounded?: boolean;
}

/**
 * Reusable Card container primitive.
 *
 * Provides consistent white background, border, and optional padding/shadow/radius.
 */
export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padded = true,
  shadow = true,
  rounded = true,
}) => {
  const classes = [
    'bg-white border border-slate-100',
    padded ? 'p-8' : '',
    shadow ? 'shadow-xl shadow-slate-200/50' : '',
    rounded ? 'rounded-2xl' : '',
    className,
  ].join(' ');

  return <div className={classes}>{children}</div>;
};

/** Props for the CardHeader sub-component. */
export interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

/** Header section of a Card. */
export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => (
  <div className={`mb-6 ${className}`}>{children}</div>
);

/** Props for the CardContent sub-component. */
export interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

/** Body section of a Card. */
export const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => (
  <div className={className}>{children}</div>
);

/** Props for the CardFooter sub-component. */
export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

/** Footer section of a Card. */
export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => (
  <div className={`mt-6 pt-6 border-t border-slate-100 ${className}`}>{children}</div>
);
