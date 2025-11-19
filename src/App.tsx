import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';

// Hooks
import { useUser, useProposal } from './hooks';

// Layout
import { Header, Container } from './components/layout';

// CV Components
import { CVUploadForm, CVStatus } from './components/cv';

// Proposal Components
import {
  JobInput,
  ProposalDisplay,
  MatchScore,
  RegenerateForm,
} from './components/proposal';

// Common
import { StatusBadge, Loader } from './components/common';

import './App.css';

// LocalStorage key for job description
const JOB_DESCRIPTION_KEY = 'upwork_helper_job_description';

// ============================================================================
// CV Section Component
// ============================================================================
interface CVSectionProps {
  userId: string;
  hasProfile: boolean;
  onCVUploaded: () => void;
}

function CVSection({ userId, hasProfile, onCVUploaded }: CVSectionProps) {
  const [showUploadForm, setShowUploadForm] = useState(false);

  const handleUploadSuccess = () => {
    setShowUploadForm(false);
    onCVUploaded();
  };

  const handleReupload = () => {
    setShowUploadForm(true);
  };

  // If no profile exists or user wants to re-upload
  if (!hasProfile || showUploadForm) {
    return (
      <CVUploadForm
        userId={userId}
        onUploadSuccess={handleUploadSuccess}
      />
    );
  }

  // Profile exists - show status
  return <CVStatus hasCV={true} onReupload={handleReupload} />;
}

// ============================================================================
// Proposal Section Component
// ============================================================================
interface ProposalSectionProps {
  userId: string;
}

function ProposalSection({ userId }: ProposalSectionProps) {
  const [currentJob, setCurrentJob] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Load saved job description from localStorage on mount
  const [savedJobDescription] = useState(() => {
    return localStorage.getItem(JOB_DESCRIPTION_KEY) || '';
  });

  const {
    proposalState,
    matchScoreState,
    generateProposal,
    calculateMatchScore,
  } = useProposal();

  const handleGenerateProposal = async (jobDescription: string) => {
    setCurrentJob(jobDescription);
    setIsRegenerating(false);

    // Generate proposal
    await generateProposal(userId, jobDescription);

    // Calculate match score in parallel
    calculateMatchScore(userId, jobDescription);
  };

  const handleRegenerate = async (feedback: string) => {
    if (!proposalState.data || !currentJob) return;

    await generateProposal(
      userId,
      currentJob,
      feedback,
      proposalState.data.proposal,
      proposalState.data.context
    );

    setIsRegenerating(false);
  };

  const handleShowRegenerateForm = () => {
    setIsRegenerating(true);
  };

  const handleCancelRegenerate = () => {
    setIsRegenerating(false);
  };

  const isGenerating = proposalState.status === 'loading';
  const hasProposal = proposalState.status === 'success' && proposalState.data;

  return (
    <>
      {/* Job Input - only show if no proposal generated yet */}
      {!hasProposal && (
        <JobInput
          onGenerate={handleGenerateProposal}
          isLoading={isGenerating}
          initialValue={savedJobDescription}
        />
      )}

      {/* Match Score */}
      {matchScoreState.data && (
        <MatchScore
          score={matchScoreState.data}
          isLoading={matchScoreState.status === 'loading'}
        />
      )}

      {/* Proposal Display */}
      {hasProposal && !isRegenerating && (
        <ProposalDisplay
          proposal={proposalState.data!.proposal}
          onRegenerate={handleShowRegenerateForm}
        />
      )}

      {/* Regenerate Form */}
      {hasProposal && isRegenerating && (
        <RegenerateForm
          previousProposal={proposalState.data!.proposal}
          previousContext={proposalState.data!.context}
          onRegenerate={handleRegenerate}
          isLoading={isGenerating}
          onCancel={handleCancelRegenerate}
        />
      )}

      {/* Error State */}
      {proposalState.status === 'error' && (
        <StatusBadge
          status="error"
          errorMessage={proposalState.error || 'Failed to generate proposal'}
        />
      )}
    </>
  );
}

// ============================================================================
// Main App Component
// ============================================================================
function App() {
  const user = useUser();
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);

  // Check if user has existing profile
  const userProfile = useQuery(api.profiles.getProfile, { userId: user.id });
  const welcomeData = useQuery(api.test.getWelcomeMessage);

  // Force refresh when CV is uploaded
  const handleCVUploaded = () => {
    setProfileRefreshKey(prev => prev + 1);
  };

  const hasProfile = !!userProfile;
  const isLoadingProfile = userProfile === undefined;

  return (
    <div className="App">
      <Header
        title="Upwork Helper"
        subtitle="AI-powered proposal generator"
      />

      <Container>
        {/* Connection Status */}
        {welcomeData && (
          <StatusBadge
            status="success"
            successMessage={welcomeData.message}
          />
        )}

        {/* Loading State */}
        {isLoadingProfile ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <Loader />
            <p style={{ marginTop: '1rem', color: '#666' }}>Loading your profile...</p>
          </div>
        ) : (
          <>
            {/* CV Section */}
            <CVSection
              key={profileRefreshKey}
              userId={user.id}
              hasProfile={hasProfile}
              onCVUploaded={handleCVUploaded}
            />

            {/* Proposal Section - only show if profile exists */}
            {hasProfile && <ProposalSection userId={user.id} />}
          </>
        )}
      </Container>
    </div>
  );
}

export default App;
