import React from 'react';
import { UI } from '../../constants/config';

interface CVStatusProps {
  hasCV: boolean;
  onReupload?: () => void;
}

export const CVStatus: React.FC<CVStatusProps> = ({ hasCV, onReupload }) => {
  if (!hasCV) return null;

  return (
    <div
      style={{
        padding: '10px 15px',
        background: UI.COLORS.background,
        border: `1px solid ${UI.COLORS.success}`,
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
      }}
    >
      <span style={{ color: UI.COLORS.success, fontSize: '14px' }}>
        ✅ CV Uploaded
      </span>
      {onReupload && (
        <button
          onClick={onReupload}
          style={{
            background: 'transparent',
            border: `1px solid ${UI.COLORS.border}`,
            color: '#999',
            padding: '5px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          Re-upload
        </button>
      )}
    </div>
  );
};