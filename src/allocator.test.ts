/**
 * Tests for allocation logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { calculateAllocations, validateAllocations, getAllocationSummary } from './allocator';
import * as baseline from './baseline';

describe('Allocator', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.restoreAllMocks();
  });
  
  it('should calculate allocations based on votes', () => {
    // Mock baseline votes
    vi.spyOn(baseline, 'getVoteResults').mockReturnValue([
      { projectId: 'ProjectA', voteCount: 3, avgScore: 22, avgRank: 1.3 },
      { projectId: 'ProjectB', voteCount: 2, avgScore: 21, avgRank: 2.0 },
      { projectId: 'ProjectC', voteCount: 1, avgScore: 20, avgRank: 3.0 }
    ]);
    
    // Calculate allocations from a 10 SOL pool
    const allocations = calculateAllocations(10, 1);
    
    // Should have 3 projects
    expect(allocations.length).toBe(3);
    
    // ProjectA should have most votes and best rank
    const projectA = allocations.find(a => a.projectId === 'ProjectA');
    expect(projectA).toBeDefined();
    expect(projectA!.voteCount).toBe(3);
    expect(projectA!.allocation).toBeGreaterThan(0);
    
    // Allocations should sum to pool amount (within rounding)
    expect(validateAllocations(allocations, 10)).toBe(true);
    
    // All allocations should be positive
    for (const alloc of allocations) {
      expect(alloc.allocation).toBeGreaterThan(0);
      expect(alloc.allocationPct).toBeGreaterThan(0);
    }
    
    // ProjectA should get the largest share (most votes, best rank)
    expect(projectA!.allocation).toBeGreaterThan(allocations[1].allocation);
  });
  
  it('should require minimum votes', () => {
    vi.spyOn(baseline, 'getVoteResults').mockReturnValue([
      { projectId: 'ProjectA', voteCount: 3, avgScore: 22, avgRank: 1.0 },
      { projectId: 'ProjectB', voteCount: 1, avgScore: 21, avgRank: 2.0 }
    ]);
    
    // With minVotes=2, ProjectB should be excluded
    const allocations = calculateAllocations(10, 2);
    
    expect(allocations.length).toBe(1);
    expect(allocations[0].projectId).toBe('ProjectA');
    expect(allocations[0].allocation).toBe(10); // Gets full pool
  });
  
  it('should generate readable summary', () => {
    vi.spyOn(baseline, 'getVoteResults').mockReturnValue([
      { projectId: 'ProjectA', voteCount: 2, avgScore: 22, avgRank: 1.0 },
      { projectId: 'ProjectB', voteCount: 1, avgScore: 20, avgRank: 2.0 }
    ]);
    
    const summary = getAllocationSummary(10, 1);
    
    expect(summary).toContain('Fund Allocation');
    expect(summary).toContain('SOL');
    expect(summary).toContain('Total Allocated');
    expect(summary).toContain('ProjectA');
    expect(summary).toContain('ProjectB');
  });
  
  it('should handle zero votes gracefully', () => {
    vi.spyOn(baseline, 'getVoteResults').mockReturnValue([]);
    
    const allocations = calculateAllocations(10, 1);
    expect(allocations.length).toBe(0);
    
    const summary = getAllocationSummary(10, 1);
    expect(summary).toContain('No projects meet the minimum vote threshold');
  });
  
  it('should weight by score and rank correctly', () => {
    // Test the weighting formula: (voteCount * avgScore) / avgRank
    vi.spyOn(baseline, 'getVoteResults').mockReturnValue([
      { projectId: 'HighScore', voteCount: 1, avgScore: 30, avgRank: 1.0 },  // weight: 30
      { projectId: 'HighVotes', voteCount: 3, avgScore: 20, avgRank: 2.0 },  // weight: 30
      { projectId: 'LowBoth', voteCount: 1, avgScore: 20, avgRank: 3.0 }     // weight: 6.67
    ]);
    
    const allocations = calculateAllocations(100, 1);
    
    expect(allocations.length).toBe(3);
    
    // HighScore and HighVotes should have similar allocations (same weight)
    const highScore = allocations.find(a => a.projectId === 'HighScore');
    const highVotes = allocations.find(a => a.projectId === 'HighVotes');
    const lowBoth = allocations.find(a => a.projectId === 'LowBoth');
    
    expect(highScore).toBeDefined();
    expect(highVotes).toBeDefined();
    expect(lowBoth).toBeDefined();
    
    // Similar weights = similar allocations
    expect(Math.abs(highScore!.allocation - highVotes!.allocation)).toBeLessThan(1);
    
    // LowBoth should get much less
    expect(lowBoth!.allocation).toBeLessThan(highScore!.allocation / 2);
  });
  
  it('should validate allocations sum correctly', () => {
    vi.spyOn(baseline, 'getVoteResults').mockReturnValue([
      { projectId: 'A', voteCount: 1, avgScore: 20, avgRank: 1.0 },
      { projectId: 'B', voteCount: 1, avgScore: 20, avgRank: 1.0 },
      { projectId: 'C', voteCount: 1, avgScore: 20, avgRank: 1.0 }
    ]);
    
    const allocations = calculateAllocations(9.99, 1);
    
    // Should validate within tolerance
    expect(validateAllocations(allocations, 9.99, 0.01)).toBe(true);
    
    // Should fail if pool amount is wrong
    expect(validateAllocations(allocations, 10.99, 0.01)).toBe(false);
  });
  
  it('should handle edge case with single project', () => {
    vi.spyOn(baseline, 'getVoteResults').mockReturnValue([
      { projectId: 'OnlyProject', voteCount: 1, avgScore: 20, avgRank: 1.0 }
    ]);
    
    const allocations = calculateAllocations(5, 1);
    
    expect(allocations.length).toBe(1);
    expect(allocations[0].allocation).toBe(5); // Gets entire pool
    expect(allocations[0].allocationPct).toBe(100);
  });
});
