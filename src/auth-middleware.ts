/**
 * Auth Middleware - Simple token-based auth with consistency checks
 * 
 * Approach: Accept token + agentId, enforce consistency
 * - First use of token: store token -> agentId mapping
 * - Subsequent uses: verify same token always uses same agentId
 * - Prevents one agent from impersonating another
 */

import { Request, Response, NextFunction } from 'express';

interface AuthRequest extends Request {
  agentId?: string;
}

// In-memory store: token -> agentId
// In production, this would be persisted to DB
const tokenRegistry = new Map<string, string>();

/**
 * Verify token and enforce consistency
 */
export async function verifyToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Missing or invalid Authorization header. Use: Authorization: Bearer <your-colosseum-token>'
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer '
    const { agentId } = req.body;
    
    if (!agentId) {
      return res.status(400).json({
        error: 'Missing agentId in request body'
      });
    }
    
    // Check if this token has been used before
    const registeredAgentId = tokenRegistry.get(token);
    
    if (registeredAgentId) {
      // Token exists - verify consistency
      if (registeredAgentId !== agentId) {
        return res.status(403).json({
          error: `Token already registered to agent "${registeredAgentId}". Cannot use for "${agentId}".`
        });
      }
      // Valid: same token, same agentId
    } else {
      // First use of this token - register it
      tokenRegistry.set(token, agentId);
      console.log(`Registered new token for agent: ${agentId}`);
    }
    
    // Attach verified agentId to request
    req.agentId = agentId;
    
    next();
  } catch (error: any) {
    return res.status(500).json({
      error: `Auth verification failed: ${error.message}`
    });
  }
}

/**
 * Get all registered agents (for transparency)
 */
export function getRegisteredAgents(): string[] {
  return Array.from(new Set(tokenRegistry.values()));
}
