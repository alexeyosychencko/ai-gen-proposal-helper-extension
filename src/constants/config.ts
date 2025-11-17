// Temporary hardcoded user ID (will be replaced with auth)
export const DEMO_USER_ID = 'demo-user-123';

// UI Constants
export const UI = {
  CV_MIN_LENGTH: 50,
  JOB_MIN_LENGTH: 30,
  TEXTAREA_MIN_HEIGHT: '200px',
  COLORS: {
    success: '#4ade80',
    error: '#ef4444',
    warning: '#f59e0b',
    primary: '#3b82f6',
    background: '#1a1a1a',
    border: '#333',
  },
} as const;

// Messages
export const MESSAGES = {
  CV_UPLOAD_SUCCESS: '✅ CV uploaded successfully!',
  CV_UPLOAD_ERROR: '❌ Failed to upload CV. Please try again.',
  PROPOSAL_SUCCESS: '✅ Proposal generated!',
  PROPOSAL_ERROR: '❌ Failed to generate proposal. Please try again.',
  CV_TOO_SHORT: 'Please enter at least 50 characters',
  JOB_TOO_SHORT: 'Please enter at least 30 characters',
} as const;