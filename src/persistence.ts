/**
 * Persistence Layer
 * 
 * Save/load sessions and votes to JSON files.
 * Railway provides persistent storage in /app/data/
 */

import * as fs from 'fs';
import * as path from 'path';

// Use data directory (persistent on Railway)
const DATA_DIR = process.env.DATA_DIR || './data';
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const VOTES_FILE = path.join(DATA_DIR, 'votes.json');

/**
 * Ensure data directory exists
 */
function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Save sessions to file
 */
export function saveSessions(sessions: Map<string, any>): void {
  ensureDataDir();
  const data = Object.fromEntries(sessions);
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(data, null, 2));
}

/**
 * Load sessions from file
 */
export function loadSessions(): Map<string, any> {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf-8'));
      return new Map(Object.entries(data));
    }
  } catch (error) {
    console.error('Failed to load sessions:', error);
  }
  return new Map();
}

/**
 * Save votes to file
 */
export function saveVotes(votes: Map<string, any[]>): void {
  ensureDataDir();
  const data = Object.fromEntries(votes);
  fs.writeFileSync(VOTES_FILE, JSON.stringify(data, null, 2));
}

/**
 * Load votes from file
 */
export function loadVotes(): Map<string, any[]> {
  try {
    if (fs.existsSync(VOTES_FILE)) {
      const data = JSON.parse(fs.readFileSync(VOTES_FILE, 'utf-8'));
      return new Map(Object.entries(data));
    }
  } catch (error) {
    console.error('Failed to load votes:', error);
  }
  return new Map();
}
