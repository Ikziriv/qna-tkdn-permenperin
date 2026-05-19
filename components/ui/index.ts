/**
 * Centralized exports for UI primitive components.
 *
 * Import pattern: import { Button, Card, Input } from '@/components/ui';
 */
export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

export { Card, CardHeader, CardContent, CardFooter } from './Card';
export type { CardProps, CardHeaderProps, CardContentProps, CardFooterProps } from './Card';

export { Input } from './Input';
export type { InputProps } from './Input';

export { Modal } from './Modal';
export type { ModalProps } from './Modal';

export { Badge } from './Badge';
export type { BadgeProps, BadgeVariant } from './Badge';

export { ProgressBar } from './ProgressBar';
export type { ProgressBarProps } from './ProgressBar';

export { Icon, ICON_PATHS } from './Icon';
export type { IconProps } from './Icon';

export { LanguageSwitcher } from './LanguageSwitcher';
export type { LanguageSwitcherProps } from './LanguageSwitcher';

export { Spinner } from './Spinner';
export type { SpinnerProps } from './Spinner';

export { QuestionNavPad } from './QuestionNavPad';
export type { QuestionNavPadProps } from './QuestionNavPad';
