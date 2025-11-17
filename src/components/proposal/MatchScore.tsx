import React from 'react';
import { Card, Loader } from '../common';
import { UI } from '../../constants/config';
import type { MatchScore as MatchScoreType } from '../../types';

interface MatchScoreProps {
  score: MatchScoreType | null;
  isLoading: boolean;
}

export const MatchScore: React.FC<MatchScoreProps> = ({ score, isLoading }) => {
  if (isLoading) {
    return (
      <Card title="🎯 Match Analysis">
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Loader size={32} />
          <p style={{ marginTop: '10px', color: '#999', fontSize: '14px' }}>
            Analyzing match...
          </p>
        </div>
      </Card>
    );
  }

  if (!score) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return UI.COLORS.success;
    if (score >= 60) return UI.COLORS.warning;
    return UI.COLORS.error;
  };

  return (
    <Card title="🎯 Match Analysis">
      {/* Score Circle */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            border: `4px solid ${getScoreColor(score.score)}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 'bold',
            color: getScoreColor(score.score),
          }}
        >
          {score.score}%
        </div>
      </div>

      {/* Strengths */}
      {score.strengths.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <h4
            style={{
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '8px',
              color: UI.COLORS.success,
            }}
          >
            ✅ Strengths
          </h4>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
            {score.strengths.map((strength, index) => (
              <li key={index} style={{ marginBottom: '5px', color: '#ccc' }}>
                {strength}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Gaps */}
      {score.gaps.length > 0 && (
        <div>
          <h4
            style={{
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '8px',
              color: UI.COLORS.warning,
            }}
          >
            ⚠️ Gaps to Address
          </h4>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
            {score.gaps.map((gap, index) => (
              <li key={index} style={{ marginBottom: '5px', color: '#ccc' }}>
                {gap}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
};