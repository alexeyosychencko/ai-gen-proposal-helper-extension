import React, { useState } from 'react';
import { Button, TextArea, Card } from '../common';

interface RegenerateFormProps {
  previousProposal: string;
  previousContext: string;
  onRegenerate: (feedback: string) => void;
  isLoading: boolean;
  onCancel: () => void;
}

export const RegenerateForm: React.FC<RegenerateFormProps> = ({
  previousProposal,
  previousContext,
  onRegenerate,
  isLoading,
  onCancel,
}) => {
    const asd = previousProposal;
    const zxc = previousContext;
    const [feedback, setFeedback] = useState('');

  const handleRegenerate = () => {
    if (!feedback.trim()) {
      alert('Please provide feedback on how to improve the proposal');
      return;
    }

    onRegenerate(feedback.trim());
  };

  return (
    <Card title="🔄 Regenerate Proposal">
      <p style={{ fontSize: '13px', color: '#999', marginBottom: '15px' }}>
        Tell me how to improve the proposal:
      </p>

      <TextArea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder={`Examples:
- Make it more formal
- Add more technical details
- Make it shorter
- Emphasize my experience with [specific skill]`}
        disabled={isLoading}
        style={{ minHeight: '120px' }}
      />

      <div style={{ display: 'flex', gap: '10px' }}>
        <Button
          onClick={handleRegenerate}
          disabled={isLoading || !feedback.trim()}
          isLoading={isLoading}
          style={{ flex: 1 }}
        >
          🔄 Regenerate
        </Button>

        <Button
          onClick={onCancel}
          variant="secondary"
          disabled={isLoading}
          style={{ flex: 1 }}
        >
          Cancel
        </Button>
      </div>
    </Card>
  );
};