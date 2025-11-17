import React from 'react';

interface LoaderProps {
  size?: number;
  color?: string;
}

export const Loader: React.FC<LoaderProps> = ({ 
  size = 24, 
  color = '#4ade80' 
}) => {
  return (
    <div
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        border: `3px solid ${color}`,
        borderTop: '3px solid transparent',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }}
    />
  );
};

// Add CSS animation to index.css or App.css
// @keyframes spin {
//   0% { transform: rotate(0deg); }
//   100% { transform: rotate(360deg); }
// }