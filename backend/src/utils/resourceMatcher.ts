import ResourceCapability from '../models/ResourceCapability';
import { ResourceCapabilityAttributes } from '../models/ResourceCapability';
import { ProjectRequirementAttributes } from '../models/ProjectRequirement';

/**
 * Proficiency level scoring weights
 * Higher number = more advanced proficiency
 */
const PROFICIENCY_SCORES: Record<string, number> = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
  Expert: 4,
};

/**
 * Match score calculation weights
 */
const WEIGHTS = {
  EXACT_MATCH: 40, // App/Tech/Role exact match
  PROFICIENCY: 30, // Proficiency level match
  EXPERIENCE: 20, // Years of experience match
  IS_PRIMARY: 10, // Whether this is a primary capability
};

/**
 * Calculate match score between a resource capability and a project requirement
 * @param capability - Resource capability
 * @param requirement - Project requirement
 * @returns Match score (0-100)
 */
export function calculateMatchScore(
  capability: ResourceCapabilityAttributes,
  requirement: ProjectRequirementAttributes
): number {
  let score = 0;

  // 1. Exact Match Score (40 points)
  // All three must match: App, Technology, Role
  if (
    capability.appId === requirement.appId &&
    capability.technologyId === requirement.technologyId &&
    capability.roleId === requirement.roleId
  ) {
    score += WEIGHTS.EXACT_MATCH;
  } else {
    // No match at all - return 0
    return 0;
  }

  // 2. Proficiency Level Score (30 points)
  const capabilityProficiency = PROFICIENCY_SCORES[capability.proficiencyLevel];
  const requirementProficiency = PROFICIENCY_SCORES[requirement.proficiencyLevel];

  if (capabilityProficiency >= requirementProficiency) {
    // Resource meets or exceeds requirement
    if (capabilityProficiency === requirementProficiency) {
      // Exact match
      score += WEIGHTS.PROFICIENCY;
    } else {
      // Higher than required - good, but not perfect (slight penalty for overqualification)
      const excess = capabilityProficiency - requirementProficiency;
      score += WEIGHTS.PROFICIENCY * (1 - excess * 0.1);
    }
  } else {
    // Resource is under-qualified
    const gap = requirementProficiency - capabilityProficiency;
    // Penalty increases with gap
    score += WEIGHTS.PROFICIENCY * Math.max(0, 1 - gap * 0.3);
  }

  // 3. Years of Experience Score (20 points)
  if (requirement.minYearsExp !== undefined && requirement.minYearsExp !== null) {
    const resourceYears = capability.yearsOfExperience || 0;

    if (resourceYears >= requirement.minYearsExp) {
      // Meets or exceeds requirement
      if (resourceYears === requirement.minYearsExp) {
        // Exact match
        score += WEIGHTS.EXPERIENCE;
      } else {
        // More experience than required
        const excess = Math.min(resourceYears - requirement.minYearsExp, 5); // Cap excess at 5 years
        score += WEIGHTS.EXPERIENCE * (1 - excess * 0.05);
      }
    } else {
      // Less experience than required
      const gap = requirement.minYearsExp - resourceYears;
      // Penalty increases with gap
      score += WEIGHTS.EXPERIENCE * Math.max(0, 1 - gap * 0.15);
    }
  } else {
    // No experience requirement - full points
    score += WEIGHTS.EXPERIENCE;
  }

  // 4. Is Primary Capability Bonus (10 points)
  if (capability.isPrimary) {
    score += WEIGHTS.IS_PRIMARY;
  } else {
    // Secondary capability - still valuable but slight penalty
    score += WEIGHTS.IS_PRIMARY * 0.7;
  }

  // Ensure score is within 0-100 range
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Find matching resources for a project requirement
 * @param requirement - Project requirement
 * @param capabilities - List of resource capabilities to search
 * @param minScore - Minimum match score threshold (default: 60)
 * @returns Array of capabilities with match scores, sorted by score descending
 */
export async function findMatchingResources(
  requirement: ProjectRequirementAttributes,
  capabilities?: ResourceCapabilityAttributes[],
  minScore: number = 60
): Promise<Array<ResourceCapabilityAttributes & { matchScore: number }>> {
  // If capabilities not provided, fetch all active capabilities
  let capabilitiesToSearch = capabilities;

  if (!capabilitiesToSearch) {
    capabilitiesToSearch = await ResourceCapability.findAll({
      where: {
        isActive: true,
        appId: requirement.appId,
        technologyId: requirement.technologyId,
        roleId: requirement.roleId,
      },
    });
  }

  // Calculate match scores
  const matches = capabilitiesToSearch
    .map((capability) => ({
      ...capability,
      matchScore: calculateMatchScore(capability, requirement),
    }))
    .filter((match) => match.matchScore >= minScore)
    .sort((a, b) => b.matchScore - a.matchScore);

  return matches;
}

/**
 * Get recommended resources for a project requirement
 * Returns top N resources with highest match scores
 * @param requirement - Project requirement
 * @param topN - Number of top matches to return (default: 5)
 * @param minScore - Minimum match score threshold (default: 60)
 */
export async function getRecommendedResources(
  requirement: ProjectRequirementAttributes,
  topN: number = 5,
  minScore: number = 60
): Promise<Array<ResourceCapabilityAttributes & { matchScore: number }>> {
  const matches = await findMatchingResources(requirement, undefined, minScore);
  return matches.slice(0, topN);
}

/**
 * Batch calculate match scores for multiple requirements
 * Useful for analyzing entire project staffing needs
 * @param requirements - List of project requirements
 * @param minScore - Minimum match score threshold
 */
export async function batchMatchRequirements(
  requirements: ProjectRequirementAttributes[],
  minScore: number = 60
): Promise<
  Record<
    number,
    Array<ResourceCapabilityAttributes & { matchScore: number }>
  >
> {
  const results: Record<
    number,
    Array<ResourceCapabilityAttributes & { matchScore: number }>
  > = {};

  for (const requirement of requirements) {
    if (requirement.id) {
      results[requirement.id] = await findMatchingResources(
        requirement,
        undefined,
        minScore
      );
    }
  }

  return results;
}

export default {
  calculateMatchScore,
  findMatchingResources,
  getRecommendedResources,
  batchMatchRequirements,
};
