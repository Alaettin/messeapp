import { HTMLAttributes } from 'react';

type Variant = 'default' | 'elevated' | 'interactive';
type Padding = 'sm' | 'md' | 'lg';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  padding?: Padding;
}

const variantStyles: Record<Variant, string> = {
  default: 'bg-bg-surface border border-border',
  elevated: 'bg-bg-elevated border border-border',
  interactive:
    'bg-bg-surface border border-border hover:border-accent hover:shadow-glow cursor-pointer transition-all duration-200',
};

const paddingStyles: Record<Padding, string> = {
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
};

export default function Card({
  variant = 'default',
  padding = 'md',
  className = '',
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-xl ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
