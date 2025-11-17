// User types
export interface User {
  id: string;
  // Later: add auth properties
}

// CV types
export interface CVData {
  userId: string;
  cvText: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface CVUploadResult {
  success: boolean;
  profileId: string;
}

// Proposal types
export interface ProposalRequest {
  userId: string;
  jobDescription: string;
  userFeedback?: string;
  previousProposal?: string;
  previousContext?: string;
}

export interface ProposalResult {
  proposal: string;
  context: string;
}

export interface MatchScore {
  score: number;
  strengths: string[];
  gaps: string[];
}

// UI State types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  status: LoadingState;
  error: string | null;
}