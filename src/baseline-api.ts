/**
 * Baseline Test API Server
 * 
 * Exposes REST endpoints for the agent baseline test.
 */

import express, { Request } from 'express';
import cors from 'cors';
import {
  startBaseline,
  answerBaseline,
  completeBaseline,
  getVoteResults,
  getAllSessions,
  getSession
} from './baseline';
import { verifyToken } from './auth-middleware';

interface AuthRequest extends Request {
  agentId?: string;
}

const app = express();
app.use(cors());
app.use(express.json());

/**
 * POST /api/baseline/start
 * Start a new baseline test session
 * Requires: Authorization header with Colosseum token + agentId in body
 */
app.post('/api/baseline/start', verifyToken, (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const agentId = authReq.agentId!; // Verified by middleware
    const { projects } = req.body;
    
    if (!projects || !Array.isArray(projects) || projects.length === 0) {
      return res.status(400).json({
        error: 'Missing required field: projects (array of project names to evaluate)'
      });
    }
    
    const result = startBaseline(agentId, projects);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/baseline/answer
 * Submit an answer and get the next question
 */
app.post('/api/baseline/answer', (req, res) => {
  try {
    const { sessionId, answer } = req.body;
    
    if (!sessionId || !answer) {
      return res.status(400).json({
        error: 'Missing required fields: sessionId, answer'
      });
    }
    
    const result = answerBaseline(sessionId, answer);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/baseline/complete
 * Complete baseline and submit votes
 */
app.post('/api/baseline/complete', (req, res) => {
  try {
    const { sessionId, votes } = req.body;
    
    if (!sessionId || !votes) {
      return res.status(400).json({
        error: 'Missing required fields: sessionId, votes'
      });
    }
    
    const result = completeBaseline(sessionId, votes);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/baseline/results
 * Get aggregated vote results
 */
app.get('/api/baseline/results', (req, res) => {
  try {
    const results = getVoteResults();
    res.json({ results });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/baseline/sessions
 * Get all baseline sessions (transparency)
 */
app.get('/api/baseline/sessions', (req, res) => {
  try {
    const sessions = getAllSessions();
    res.json({ sessions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/baseline/sessions/:sessionId
 * Get a specific session
 */
app.get('/api/baseline/sessions/:sessionId', (req, res) => {
  try {
    const session = getSession(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json({ session });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/baseline/health
 * Health check
 */
app.get('/api/baseline/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;

export function startServer() {
  app.listen(PORT, () => {
    console.log(`Baseline API running on http://localhost:${PORT}`);
    console.log('');
    console.log('Endpoints:');
    console.log('  POST /api/baseline/start');
    console.log('  POST /api/baseline/answer');
    console.log('  POST /api/baseline/complete');
    console.log('  GET  /api/baseline/results');
    console.log('  GET  /api/baseline/sessions');
    console.log('  GET  /api/baseline/sessions/:sessionId');
  });
}

// Run if executed directly
// In ESM, check if this is the main module
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  startServer();
}

export default app;
