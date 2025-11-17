import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const Container: React.FC<ContainerProps> = ({ children, style }) => {
  return (
    <main
      style={{
        padding: '20px',
        maxWidth: '600px',
        margin: '0 auto',
        ...style,
      }}
    >
      {children}
    </main>
  );
};