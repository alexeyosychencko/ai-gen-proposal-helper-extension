import React, { useState } from 'react';
import { Button, TextArea, Card } from '../common';
import { UI, MESSAGES } from '../../constants/config';

interface JobInputProps {
  onGenerate: (jobDescription: string) => void;
  isLoading: boolean;
}

export const JobInput: React.FC<JobInputProps> = ({ onGenerate, isLoading }) => {
  const [jobDescription, setJobDescription] = useState('');

  const handleGenerate = () => {
    const trimmedJob = jobDescription.trim();

    if (trimmedJob.length < UI.JOB_MIN_LENGTH) {
      alert(MESSAGES.JOB_TOO_SHORT);
      return;
    }

    onGenerate(trimmedJob);
  };

  return (
    <Card title="✨ Generate Proposal">
      <TextArea
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
        placeholder={`Paste the job description here...

The more details you provide, the better the proposal will be.`}
        disabled={isLoading}
        helperText={`Minimum ${UI.JOB_MIN_LENGTH} characters`}
      />

      <Button
        onClick={handleGenerate}
        disabled={isLoading || jobDescription.trim().length < UI.JOB_MIN_LENGTH}
        isLoading={isLoading}
      >
        ✨ Generate Proposal
      </Button>
    </Card>
  );
};