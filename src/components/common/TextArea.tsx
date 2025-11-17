import React from 'react';
import { UI } from '../../constants/config';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  error,
  helperText,
  style,
  ...props
}) => {
  return (
    <div style={{ marginBottom: '15px' }}>
      {label && (
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '14px',
          fontWeight: '500',
          color: '#fff',
        }}>
          {label}
        </label>
      )}
      
      <textarea
        style={{
          width: '100%',
          minHeight: UI.TEXTAREA_MIN_HEIGHT,
          padding: '10px',
          borderRadius: '8px',
          border: `1px solid ${error ? UI.COLORS.error : UI.COLORS.border}`,
          background: UI.COLORS.background,
          color: '#fff',
          fontSize: '14px',
          fontFamily: 'monospace',
          resize: 'vertical',
          outline: 'none',
          ...style,
        }}
        {...props}
      />
      
      {error && (
        <div style={{
          marginTop: '5px',
          fontSize: '12px',
          color: UI.COLORS.error,
        }}>
          {error}
        </div>
      )}
      
      {helperText && !error && (
        <div style={{
          marginTop: '5px',
          fontSize: '12px',
          color: '#999',
        }}>
          {helperText}
        </div>
      )}
    </div>
  );
};