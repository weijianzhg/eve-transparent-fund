/**
 * Agent Baseline Test - Core Logic
 * 
 * Verify agent autonomy through multi-turn Q&A before accepting votes.
 */

import { generateQuestions, evaluateAnswer, BASELINE_QUESTIONS } from './baseline-questions';
import { saveSessions, loadSessions, saveVotes, loadVotes } from './persistence';

export interface BaselineSession {
  id: string;
  agentId: string;
  projects: string[];
  questions: Array<{ question: string; id: string; category: string }>;
  answers: Array<{ questionId: string; answer: string; score: number; flags: string[] }>;
  currentQuestionIndex: number;
  startTime: Date;
  completed: boolean;
  finalScore?: {
    knowledge: number;
    reasoning: number;
    autonomy: number;
    total: number;
    passed: boolean;
  };
}

export interface VerifiedVote {
  agentId: string;
  projectId: string;
  rank: number;
  baselineScore: number;
  sessionId: string;
  timestamp: Date;
}

// Persistent storage - load on startup, save on changes
let sessions: Map<string, BaselineSession> = loadSessions() as Map<string, BaselineSession>;
let votes: Map<string, VerifiedVote[]> = loadVotes() as Map<string, VerifiedVote[]>;

console.log(`Loaded ${sessions.size} sessions and ${votes.size} agent votes from disk`);

/**
 * Start a new baseline test session
 */
export function startBaseline(agentId: string, projects: string[]): {
  sessionId: string;
  question: string;
} {
  const sessionId = `baseline_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const questions = generateQuestions(projects);
  
  const session: BaselineSession = {
    id: sessionId,
    agentId,
    projects,
    questions,
    answers: [],
    currentQuestionIndex: 0,
    startTime: new Date(),
    completed: false
  };
  
  sessions.set(sessionId, session);
  saveSessions(sessions);
  
  return {
    sessionId,
    question: questions[0].question
  };
}

/**
 * Submit an answer and get the next question
 */
export function answerBaseline(
  sessionId: string,
  answer: string
): {
  complete: boolean;
  question?: string;
  score?: BaselineSession['finalScore'];
} {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }
  
  if (session.completed) {
    throw new Error('Session already completed');
  }
  
  // Evaluate the current answer
  const currentQ = session.questions[session.currentQuestionIndex];
  const questionDef = BASELINE_QUESTIONS.find(q => q.id === currentQ.id);
  const evaluation = evaluateAnswer(currentQ.id, answer, questionDef?.expectedElements);
  
  session.answers.push({
    questionId: currentQ.id,
    answer,
    score: evaluation.score,
    flags: evaluation.flags
  });
  
  // Move to next question
  session.currentQuestionIndex++;
  saveSessions(sessions);
  
  // Check if done
  if (session.currentQuestionIndex >= session.questions.length) {
    session.completed = true;
    session.finalScore = calculateFinalScore(session);
    
    return {
      complete: true,
      score: session.finalScore
    };
  }
  
  // Return next question
  return {
    complete: false,
    question: session.questions[session.currentQuestionIndex].question
  };
}

/**
 * Complete baseline and record votes
 */
export function completeBaseline(
  sessionId: string,
  voteRanking: Record<string, number> // projectId -> rank (1=best, 2=second, etc)
): {
  passed: boolean;
  score: BaselineSession['finalScore'];
  votesRecorded: number;
} {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }
  
  if (!session.completed || !session.finalScore) {
    throw new Error('Session not completed - finish all questions first');
  }
  
  // Only record votes if passed
  if (session.finalScore.passed) {
    const agentVotes: VerifiedVote[] = [];
    
    for (const [projectId, rank] of Object.entries(voteRanking)) {
      agentVotes.push({
        agentId: session.agentId,
        projectId,
        rank,
        baselineScore: session.finalScore.total,
        sessionId: session.id,
        timestamp: new Date()
      });
    }
    
    votes.set(session.agentId, agentVotes);
    saveVotes(votes);
    
    return {
      passed: true,
      score: session.finalScore,
      votesRecorded: agentVotes.length
    };
  }
  
  return {
    passed: false,
    score: session.finalScore,
    votesRecorded: 0
  };
}

/**
 * Calculate final score from answers
 */
function calculateFinalScore(session: BaselineSession): BaselineSession['finalScore'] {
  let knowledge = 0;
  let reasoning = 0;
  let autonomy = 0;
  
  let knowledgeCount = 0;
  let reasoningCount = 0;
  let autonomyCount = 0;
  
  for (const answer of session.answers) {
    const question = session.questions.find(q => q.id === answer.questionId);
    if (!question) continue;
    
    switch (question.category) {
      case 'knowledge':
        knowledge += answer.score;
        knowledgeCount++;
        break;
      case 'reasoning':
        reasoning += answer.score;
        reasoningCount++;
        break;
      case 'autonomy':
        autonomy += answer.score;
        autonomyCount++;
        break;
    }
  }
  
  // Average by category
  if (knowledgeCount > 0) knowledge = knowledge / knowledgeCount;
  if (reasoningCount > 0) reasoning = reasoning / reasoningCount;
  if (autonomyCount > 0) autonomy = autonomy / autonomyCount;
  
  const total = knowledge + reasoning + autonomy;
  const passed = total >= 20; // Threshold: 20/30 (relaxed for MVP)
  
  return {
    knowledge: Math.round(knowledge * 10) / 10,
    reasoning: Math.round(reasoning * 10) / 10,
    autonomy: Math.round(autonomy * 10) / 10,
    total: Math.round(total * 10) / 10,
    passed
  };
}

/**
 * Get aggregated vote results
 */
export function getVoteResults(): Array<{
  projectId: string;
  voteCount: number;
  avgScore: number;
  avgRank: number;
}> {
  const projectVotes = new Map<string, {count: number; totalScore: number; totalRank: number}>();
  
  for (const agentVotes of votes.values()) {
    for (const vote of agentVotes) {
      const existing = projectVotes.get(vote.projectId) || {count: 0, totalScore: 0, totalRank: 0};
      existing.count++;
      existing.totalScore += vote.baselineScore;
      existing.totalRank += vote.rank;
      projectVotes.set(vote.projectId, existing);
    }
  }
  
  const results = Array.from(projectVotes.entries()).map(([projectId, data]) => ({
    projectId,
    voteCount: data.count,
    avgScore: Math.round((data.totalScore / data.count) * 10) / 10,
    avgRank: Math.round((data.totalRank / data.count) * 10) / 10
  }));
  
  // Sort by vote count, then by avg rank (lower rank = better)
  results.sort((a, b) => {
    if (b.voteCount !== a.voteCount) return b.voteCount - a.voteCount;
    return a.avgRank - b.avgRank;
  });
  
  return results;
}

/**
 * Get all sessions (for transparency)
 */
export function getAllSessions(): BaselineSession[] {
  return Array.from(sessions.values());
}

/**
 * Get session details
 */
export function getSession(sessionId: string): BaselineSession | undefined {
  return sessions.get(sessionId);
}

/**
 * Reset all state (for testing)
 */
export function resetBaseline(): void {
  sessions.clear();
  votes.clear();
  saveSessions(sessions);
  saveVotes(votes);
}
