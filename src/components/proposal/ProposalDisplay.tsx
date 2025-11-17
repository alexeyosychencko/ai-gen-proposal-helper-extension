import React, { useState } from 'react';
import { Card, Button } from '../common';
import { UI } from '../../constants/config';

interface ProposalDisplayProps {
  proposal: string;
  onCopy?: () => void;
  onRegenerate?: () => void;
}

export const ProposalDisplay: React.FC<ProposalDisplayProps> = ({
  proposal,
  onCopy,
  onRegenerate,
}) => {
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(proposal);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      
      if (onCopy) {
        onCopy();
      }
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Failed to copy to clipboard');
    }
  };

  return (
    <Card title="📝 Generated Proposal">
      <div
        style={{
          padding: '15px',
          background: '#0a0a0a',
          borderRadius: '8px',
          border: `1px solid ${UI.COLORS.border}`,
          marginBottom: '15px',
          maxHeight: '400px',
          overflowY: 'auto',
        }}
      >
        <pre
          style={{
            margin: 0,
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            fontFamily: 'inherit',
            fontSize: '14px',
            lineHeight: '1.6',
            color: '#fff',
          }}
        >
          {proposal}
        </pre>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <Button
          onClick={handleCopy}
          style={{ flex: 1 }}
        >
          {copySuccess ? '✅ Copied!' : '📋 Copy to Clipboard'}
        </Button>

        {onRegenerate && (
          <Button
            onClick={onRegenerate}
            variant="secondary"
            style={{ flex: 1 }}
          >
            🔄 Regenerate
          </Button>
        )}
      </div>
    </Card>
  );
};