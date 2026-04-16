import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-accent text-white hover:bg-accent-hover shadow-glow hover:shadow-glow-lg',
  secondary:
    'bg-transparent border border-accent text-accent hover:bg-accent-muted',
  ghost:
    'bg-transparent text-txt-secondary hover:text-txt-primary hover:bg-bg-elevated',
  danger:
    'bg-error/10 text-error border border-error/30 hover:bg-error/20',
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-2 text-sm min-h-[40px]',
  md: 'px-5 py-3 text-sm min-h-[48px]',
  lg: 'px-7 py-4 text-base min-h-[56px]',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center gap-2
          rounded-lg font-medium
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
