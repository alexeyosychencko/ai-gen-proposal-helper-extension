import React, { useState } from 'react';
import { Button, TextArea, Card, StatusBadge } from '../common';
import { UI, MESSAGES } from '../../constants/config';
import { useCV } from '../../hooks';

interface CVUploadFormProps {
  userId: string;
  onUploadSuccess?: () => void;
}

export const CVUploadForm: React.FC<CVUploadFormProps> = ({ 
  userId, 
  onUploadSuccess 
}) => {
  const [cvText, setCvText] = useState('');
  const { uploadState, uploadCV } = useCV();

  const handleSubmit = async () => {
    const trimmedCV = cvText.trim();

    if (trimmedCV.length < UI.CV_MIN_LENGTH) {
      alert(MESSAGES.CV_TOO_SHORT);
      return;
    }

    await uploadCV(userId, trimmedCV);

    if (onUploadSuccess) {
      onUploadSuccess();
    }
  };

  const isLoading = uploadState.status === 'loading';
  const isSuccess = uploadState.status === 'success';

  return (
    <Card title="📄 Upload Your CV">
      <TextArea
        value={cvText}
        onChange={(e) => setCvText(e.target.value)}
        placeholder={`Paste your CV text here...

Include:
- Your experience
- Skills  
- Key projects
- Achievements`}
        disabled={isLoading}
        error={uploadState.error || undefined}
        helperText={`Minimum ${UI.CV_MIN_LENGTH} characters`}
      />

      <Button
        onClick={handleSubmit}
        disabled={isLoading || cvText.trim().length < UI.CV_MIN_LENGTH}
        isLoading={isLoading}
      >
        ⬆️ Upload CV
      </Button>

      {isSuccess && (
        <StatusBadge
          status="success"
          successMessage={MESSAGES.CV_UPLOAD_SUCCESS}
        />
      )}

      {uploadState.error && (
        <StatusBadge
          status="error"
          errorMessage={uploadState.error}
        />
      )}
    </Card>
  );
};