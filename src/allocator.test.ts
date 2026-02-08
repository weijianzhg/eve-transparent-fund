/**
 * Tests for allocation logic
 */

import { describe, it, expect } from 'vitest';
import { calculateAllocations, validateAllocations, getAllocationSummary } from './allocator';

describe('Allocator', () => {
  it('should calculate allocations based on votes', () => {
    const voteResults = [
      { projectId: 'ProjectA', voteCount: 3, avgScore: 22, avgRank: 1.3 },
      { projectId: 'ProjectB', voteCount: 2, avgScore: 21, avgRank: 2.0 },
      { projectId: 'ProjectC', voteCount: 1, avgScore: 20, avgRank: 3.0 }
    ];
    
    // Calculate allocations from a 10 SOL pool
    const allocations = calculateAllocations(voteResults, 10);
    
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
    const voteResults = [
      { projectId: 'ProjectA', voteCount: 3, avgScore: 22, avgRank: 1.0 },
      { projectId: 'ProjectB', voteCount: 1, avgScore: 21, avgRank: 2.0 }
    ];
    
    // With minVotes=2, ProjectB should be excluded
    const allocations = calculateAllocations(voteResults, 10, { minVotes: 2 });
    
    expect(allocations.length).toBe(1);
    expect(allocations[0].projectId).toBe('ProjectA');
    expect(allocations[0].allocation).toBe(10); // Gets full pool
  });
  
  it('should generate readable summary', () => {
    const voteResults = [
      { projectId: 'ProjectA', voteCount: 2, avgScore: 22, avgRank: 1.0 },
      { projectId: 'ProjectB', voteCount: 1, avgScore: 20, avgRank: 2.0 }
    ];
    
    const summary = getAllocationSummary(voteResults, 10);
    
    expect(summary).toContain('Fund Allocation');
    expect(summary).toContain('SOL');
    expect(summary).toContain('Total Allocated');
    expect(summary).toContain('ProjectA');
    expect(summary).toContain('ProjectB');
  });
  
  it('should handle zero votes gracefully', () => {
    const allocations = calculateAllocations([], 10);
    expect(allocations.length).toBe(0);
    
    const summary = getAllocationSummary([], 10);
    expect(summary).toContain('No projects meet the minimum vote threshold');
  });
  
  it('should weight by score and rank correctly', () => {
    // Test the weighting formula: (voteCount * avgScore) / avgRank
    const voteResults = [
      { projectId: 'HighScore', voteCount: 1, avgScore: 30, avgRank: 1.0 },  // weight: 30
      { projectId: 'HighVotes', voteCount: 3, avgScore: 20, avgRank: 2.0 },  // weight: 30
      { projectId: 'LowBoth', voteCount: 1, avgScore: 20, avgRank: 3.0 }     // weight: 6.67
    ];
    
    const allocations = calculateAllocations(voteResults, 100);
    
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
    const voteResults = [
      { projectId: 'A', voteCount: 1, avgScore: 20, avgRank: 1.0 },
      { projectId: 'B', voteCount: 1, avgScore: 20, avgRank: 1.0 },
      { projectId: 'C', voteCount: 1, avgScore: 20, avgRank: 1.0 }
    ];
    
    const allocations = calculateAllocations(voteResults, 9.99);
    
    // Should validate within tolerance
    expect(validateAllocations(allocations, 9.99, 0.01)).toBe(true);
    
    // Should fail if pool amount is wrong
    expect(validateAllocations(allocations, 10.99, 0.01)).toBe(false);
  });
  
  it('should handle edge case with single project', () => {
    const voteResults = [
      { projectId: 'OnlyProject', voteCount: 1, avgScore: 20, avgRank: 1.0 }
    ];
    
    const allocations = calculateAllocations(voteResults, 5);
    
    expect(allocations.length).toBe(1);
    expect(allocations[0].allocation).toBe(5); // Gets entire pool
    expect(allocations[0].allocationPct).toBe(100);
  });
  
  it('should support topN option', () => {
    const voteResults = [
      { projectId: 'First', voteCount: 5, avgScore: 25, avgRank: 1.0 },
      { projectId: 'Second', voteCount: 4, avgScore: 24, avgRank: 1.5 },
      { projectId: 'Third', voteCount: 3, avgScore: 23, avgRank: 2.0 },
      { projectId: 'Fourth', voteCount: 2, avgScore: 22, avgRank: 2.5 },
      { projectId: 'Fifth', voteCount: 1, avgScore: 21, avgRank: 3.0 }
    ];
    
    // Get only top 3
    const allocations = calculateAllocations(voteResults, 10, { topN: 3 });
    
    expect(allocations.length).toBe(3);
    expect(allocations[0].projectId).toBe('First');
    expect(allocations[1].projectId).toBe('Second');
    expect(allocations[2].projectId).toBe('Third');
  });
});
