import { DEMO_USER_ID } from '../constants/config';
import type { User } from '../types';

/**
 * Hook for managing user state
 * TODO: Replace with real authentication later
 */
export const useUser = (): User => {
  // For MVP, return demo user
  // Later: integrate with Convex auth or other auth provider
  return {
    id: DEMO_USER_ID,
  };
};