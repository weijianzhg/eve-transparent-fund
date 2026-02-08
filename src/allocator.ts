/**
 * Allocator - Converts baseline voting results into fund allocations
 */

import { getVoteResults } from './baseline';

interface VoteResult {
  projectId: string;
  voteCount: number;
  avgScore: number;
  avgRank: number;
}

export interface AllocationResult {
  projectId: string;
  allocation: number; // SOL amount
  voteCount: number;
  avgScore: number;
  avgRank: number;
  allocationPct: number; // Percentage of total pool
}

/**
 * Calculate fund allocations based on baseline voting results
 * 
 * Allocation formula:
 * 1. Only projects with votes are considered
 * 2. Weight = voteCount * avgScore / avgRank
 *    (more votes, higher scores, better ranks = more weight)
 * 3. Each project gets: (weight / totalWeight) * poolAmount
 * 
 * @param voteResults - Vote results from baseline test
 * @param poolAmount - Total SOL available for allocation
 * @param options - Optional filters (minVotes, topN)
 */
export function calculateAllocations(
  voteResults: VoteResult[],
  poolAmount: number,
  options: { minVotes?: number; topN?: number } = {}
): AllocationResult[] {
  const { minVotes = 1, topN } = options;
  
  // Filter out projects with insufficient votes
  const eligible = voteResults.filter(r => r.voteCount >= minVotes);
  
  if (eligible.length === 0) {
    return [];
  }
  
  // Calculate weights
  // Higher voteCount = more agents agree
  // Higher avgScore = higher quality agents
  // Lower avgRank = more preferred (rank 1 is better than rank 3)
  const weighted = eligible.map(project => ({
    ...project,
    weight: (project.voteCount * project.avgScore) / project.avgRank
  }));
  
  const totalWeight = weighted.reduce((sum, p) => sum + p.weight, 0);
  
  // Calculate allocations
  const allocations: AllocationResult[] = weighted.map(project => {
    const allocationPct = (project.weight / totalWeight) * 100;
    const allocation = (project.weight / totalWeight) * poolAmount;
    
    return {
      projectId: project.projectId,
      allocation: parseFloat(allocation.toFixed(4)), // Round to 4 decimals
      voteCount: project.voteCount,
      avgScore: project.avgScore,
      avgRank: project.avgRank,
      allocationPct: parseFloat(allocationPct.toFixed(2))
    };
  });
  
  // Sort by allocation (highest first)
  allocations.sort((a, b) => b.allocation - a.allocation);
  
  // Apply topN filter if specified
  if (topN && topN < allocations.length) {
    return allocations.slice(0, topN);
  }
  
  return allocations;
}

/**
 * Get allocation summary as human-readable text
 */
export function getAllocationSummary(
  voteResults: VoteResult[],
  poolAmount: number,
  options?: { minVotes?: number; topN?: number }
): string {
  const allocations = calculateAllocations(voteResults, poolAmount, options);
  
  if (allocations.length === 0) {
    return 'No projects meet the minimum vote threshold.';
  }
  
  const lines = [
    `Fund Allocation (${poolAmount} SOL pool)`,
    '='.repeat(50),
    ''
  ];
  
  let total = 0;
  for (const alloc of allocations) {
    lines.push(
      `${alloc.projectId}`,
      `  Allocation: ${alloc.allocation} SOL (${alloc.allocationPct}%)`,
      `  Votes: ${alloc.voteCount} | Avg Score: ${alloc.avgScore.toFixed(1)} | Avg Rank: ${alloc.avgRank.toFixed(1)}`,
      ''
    );
    total += alloc.allocation;
  }
  
  lines.push('='.repeat(50));
  lines.push(`Total Allocated: ${total.toFixed(4)} SOL`);
  
  return lines.join('\n');
}

/**
 * Validate allocations sum to pool amount (within rounding error)
 */
export function validateAllocations(
  allocations: AllocationResult[],
  poolAmount: number,
  tolerance: number = 0.01
): boolean {
  const total = allocations.reduce((sum, a) => sum + a.allocation, 0);
  const diff = Math.abs(total - poolAmount);
  return diff <= tolerance;
}
