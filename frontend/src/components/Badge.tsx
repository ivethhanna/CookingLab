import { CSSProperties, ReactNode } from 'react';

type BadgeProps = {
  children: ReactNode;
  variant?: 'default' | 'accent' | 'scheduled' | 'cancelled' | 'finished';
  className?: string;
  style?: CSSProperties;
};

export function Badge({ children, variant = 'default', className = '', style }: BadgeProps) {
  if (variant === 'scheduled' || variant === 'cancelled' || variant === 'finished') {
    return (
      <span className={`status-badge ${variant} ${className}`} style={style}>
        {children}
      </span>
    );
  }

  const variantClass = variant === 'accent' ? 'badge-accent' : '';
  return (
    <span className={`badge ${variantClass} ${className}`} style={style}>
      {children}
    </span>
  );
}
