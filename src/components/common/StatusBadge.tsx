import React from 'react';
import { UI } from '../../constants/config';
import type { LoadingState } from '../../types';

interface StatusBadgeProps {
  status: LoadingState;
  successMessage?: string;
  errorMessage?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  successMessage = 'Success!',
  errorMessage = 'An error occurred',
}) => {
  if (status === 'idle') return null;

  const getColor = () => {
    switch (status) {
      case 'loading':
        return UI.COLORS.warning;
      case 'success':
        return UI.COLORS.success;
      case 'error':
        return UI.COLORS.error;
      default:
        return '#999';
    }
  };

  const getMessage = () => {
    switch (status) {
      case 'loading':
        return '⏳ Processing...';
      case 'success':
        return `✅ ${successMessage}`;
      case 'error':
        return `❌ ${errorMessage}`;
      default:
        return '';
    }
  };

  return (
    <div
      style={{
        padding: '10px 15px',
        background: UI.COLORS.background,
        border: `1px solid ${getColor()}`,
        borderRadius: '8px',
        color: getColor(),
        fontSize: '13px',
        marginTop: '10px',
      }}
    >
      {getMessage()}
    </div>
  );
};