import React from 'react';
import { UI } from '../../constants/config';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ 
  title = 'Upwork Helper',
  subtitle 
}) => {
  return (
    <header
      style={{
        padding: '15px 20px',
        background: UI.COLORS.background,
        borderBottom: `1px solid ${UI.COLORS.border}`,
      }}
    >
      <h1
        style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: '600',
          color: '#fff',
        }}
      >
        {title}
      </h1>
      {subtitle && (
        <p
          style={{
            margin: '5px 0 0 0',
            fontSize: '12px',
            color: '#999',
          }}
        >
          {subtitle}
        </p>
      )}
    </header>
  );
};