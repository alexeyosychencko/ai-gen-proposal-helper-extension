import React, { useState, useEffect } from 'react';
import { Button, TextArea, Card } from '../common';
import { UI, MESSAGES } from '../../constants/config';

const JOB_DESCRIPTION_KEY = 'upwork_helper_job_description';

interface JobInputProps {
  onGenerate: (jobDescription: string) => void;
  isLoading: boolean;
  initialValue?: string;
}

export const JobInput: React.FC<JobInputProps> = ({ onGenerate, isLoading, initialValue = '' }) => {
  const [jobDescription, setJobDescription] = useState(initialValue);

  // Save to localStorage whenever jobDescription changes
  useEffect(() => {
    if (jobDescription) {
      localStorage.setItem(JOB_DESCRIPTION_KEY, jobDescription);
    }
  }, [jobDescription]);

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