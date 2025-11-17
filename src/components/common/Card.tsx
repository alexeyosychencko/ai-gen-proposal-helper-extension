import React from 'react';
import { UI } from '../../constants/config';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ children, title, style }) => {
  return (
    <div
      style={{
        padding: '20px',
        background: UI.COLORS.background,
        borderRadius: '12px',
        border: `1px solid ${UI.COLORS.border}`,
        marginBottom: '20px',
        ...style,
      }}
    >
      {title && (
        <h2 style={{
          fontSize: '16px',
          fontWeight: '600',
          marginBottom: '15px',
          marginTop: 0,
        }}>
          {title}
        </h2>
      )}
      {children}
    </div>
  );
};