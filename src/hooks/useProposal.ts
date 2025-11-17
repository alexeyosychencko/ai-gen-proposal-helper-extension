import { useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { ProposalResult, MatchScore, AsyncState } from '../types';
import { MESSAGES } from '../constants/config';

interface UseProposalReturn {
  proposalState: AsyncState<ProposalResult>;
  matchScoreState: AsyncState<MatchScore>;
  generateProposal: (
    userId: string,
    jobDescription: string,
    userFeedback?: string,
    previousProposal?: string,
    previousContext?: string
  ) => Promise<void>;
  calculateMatchScore: (userId: string, jobDescription: string) => Promise<void>;
  resetProposal: () => void;
}

/**
 * Hook for managing proposal generation and match scoring
 */
export const useProposal = (): UseProposalReturn => {
  const [proposalState, setProposalState] = useState<AsyncState<ProposalResult>>({
    data: null,
    status: 'idle',
    error: null,
  });

  const [matchScoreState, setMatchScoreState] = useState<AsyncState<MatchScore>>({
    data: null,
    status: 'idle',
    error: null,
  });

  const generateProposalAction = useAction(api.proposals.generateProposal);
  const calculateMatchScoreAction = useAction(api.proposals.calculateMatchScore);

  const generateProposal = async (
    userId: string,
    jobDescription: string,
    userFeedback?: string,
    previousProposal?: string,
    previousContext?: string
  ) => {
    setProposalState({ data: null, status: 'loading', error: null });

    try {
      const result = await generateProposalAction({
        userId,
        jobDescription,
        userFeedback,
        previousProposal,
        previousContext,
      });

      setProposalState({
        data: result,
        status: 'success',
        error: null,
      });
    } catch (error) {
      console.error('Proposal generation failed:', error);

      setProposalState({
        data: null,
        status: 'error',
        error: error instanceof Error ? error.message : MESSAGES.PROPOSAL_ERROR,
      });
    }
  };

  const calculateMatchScore = async (userId: string, jobDescription: string) => {
    setMatchScoreState({ data: null, status: 'loading', error: null });

    try {
      const result = await calculateMatchScoreAction({
        userId,
        jobDescription,
      });

      setMatchScoreState({
        data: result,
        status: 'success',
        error: null,
      });
    } catch (error) {
      console.error('Match score calculation failed:', error);

      setMatchScoreState({
        data: null,
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to calculate match score',
      });
    }
  };

  const resetProposal = () => {
    setProposalState({ data: null, status: 'idle', error: null });
    setMatchScoreState({ data: null, status: 'idle', error: null });
  };

  return {
    proposalState,
    matchScoreState,
    generateProposal,
    calculateMatchScore,
    resetProposal,
  };
};