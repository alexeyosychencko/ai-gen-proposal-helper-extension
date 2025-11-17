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
import { StatusBadge } from './components/common';

import './App.css';

function App() {
  // User
  const user = useUser();

  // CV State
  const [hasCV, setHasCV] = useState(false);
  const [showCVForm, setShowCVForm] = useState(false);

  // Job State
  const [currentJob, setCurrentJob] = useState('');

  // Regeneration State
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Hooks
  const {
    proposalState,
    matchScoreState,
    generateProposal,
    calculateMatchScore,
  } = useProposal();

  // Test connection
  const welcomeData = useQuery(api.test.getWelcomeMessage);

  // Handlers
  const handleCVUploadSuccess = () => {
    setHasCV(true);
    setShowCVForm(false);
  };

  const handleGenerateProposal = async (jobDescription: string) => {
    setCurrentJob(jobDescription);
    setIsRegenerating(false);

    // Generate proposal
    await generateProposal(user.id, jobDescription);

    // Calculate match score in parallel
    calculateMatchScore(user.id, jobDescription);
  };

  const handleRegenerate = async (feedback: string) => {
    if (!proposalState.data || !currentJob) return;

    await generateProposal(
      user.id,
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

  const handleReuploadCV = () => {
    setShowCVForm(true);
    setHasCV(false);
  };

  const isGenerating = proposalState.status === 'loading';
  const hasProposal = proposalState.status === 'success' && proposalState.data;

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

        {/* CV Section */}
        {!hasCV || showCVForm ? (
          <CVUploadForm
            userId={user.id}
            onUploadSuccess={handleCVUploadSuccess}
          />
        ) : (
          <>
            <CVStatus hasCV={hasCV} onReupload={handleReuploadCV} />

            {/* Job Input */}
            {!hasProposal && (
              <JobInput
                onGenerate={handleGenerateProposal}
                isLoading={isGenerating}
              />
            )}

            {/* Match Score (optional) */}
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
        )}
      </Container>
    </div>
  );
}

export default App;