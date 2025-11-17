import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  isLoading = false,
  children,
  disabled,
  style,
  ...props
}) => {
  const getBackgroundColor = () => {
    if (disabled || isLoading) return '#666';
    
    switch (variant) {
      case 'primary':
        return '#4ade80';
      case 'secondary':
        return '#3b82f6';
      case 'danger':
        return '#ef4444';
      default:
        return '#4ade80';
    }
  };

  return (
    <button
      disabled={disabled || isLoading}
      style={{
        padding: '10px 20px',
        background: getBackgroundColor(),
        color: variant === 'primary' ? '#000' : '#fff',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 'bold',
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        width: '100%',
        transition: 'opacity 0.2s',
        opacity: disabled || isLoading ? 0.6 : 1,
        ...style,
      }}
      {...props}
    >
      {isLoading ? '⏳ Loading...' : children}
    </button>
  );
};