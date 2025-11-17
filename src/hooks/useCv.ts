import { useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { CVUploadResult, AsyncState } from '../types';
import { MESSAGES } from '../constants/config';

interface UseCVReturn {
  uploadState: AsyncState<CVUploadResult>;
  uploadCV: (userId: string, cvText: string) => Promise<void>;
  resetUpload: () => void;
}

/**
 * Hook for managing CV upload
 */
export const useCV = (): UseCVReturn => {
  const [uploadState, setUploadState] = useState<AsyncState<CVUploadResult>>({
    data: null,
    status: 'idle',
    error: null,
  });

  const uploadCVAction = useAction(api.profiles.uploadCV);

  const uploadCV = async (userId: string, cvText: string) => {
    setUploadState({ data: null, status: 'loading', error: null });

    try {
      const result = await uploadCVAction({ userId, cvText });
      
      setUploadState({
        data: result,
        status: 'success',
        error: null,
      });
    } catch (error) {
      console.error('CV upload failed:', error);
      
      setUploadState({
        data: null,
        status: 'error',
        error: error instanceof Error ? error.message : MESSAGES.CV_UPLOAD_ERROR,
      });
    }
  };

  const resetUpload = () => {
    setUploadState({ data: null, status: 'idle', error: null });
  };

  return {
    uploadState,
    uploadCV,
    resetUpload,
  };
};