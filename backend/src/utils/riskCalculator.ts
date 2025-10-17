import Project from '../models/Project';
import ProjectDependency from '../models/ProjectDependency';
import ResourceAllocation from '../models/ResourceAllocation';
import ProjectRequirement from '../models/ProjectRequirement';

export interface RiskBreakdown {
  budgetRisk: number;
  scheduleRisk: number;
  resourceRisk: number;
  dependencyRisk: number;
  complexityRisk: number;
  healthRisk: number;
  totalScore: number;
  details: {
    budgetRisk: string;
    scheduleRisk: string;
    resourceRisk: string;
    dependencyRisk: string;
    complexityRisk: string;
    healthRisk: string;
  };
}

export interface ProjectRiskScore {
  projectId: number;
  projectName: string;
  riskScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
}

export interface RiskDistribution {
  lowRisk: number;
  mediumRisk: number;
  highRisk: number;
  totalProjects: number;
}

export interface SegmentFunctionRisk extends RiskBreakdown {
  maxRisk: number;
  distribution: RiskDistribution;
  projectRisks: ProjectRiskScore[];
  projectsNeedingAttention: number;
}

/**
 * Calculate risk level from score
 */
const getRiskLevel = (score: number): 'Low' | 'Medium' | 'High' => {
  if (score < 30) return 'Low';
  if (score < 60) return 'Medium';
  return 'High';
};

/**
 * Calculate automatic health status based on actual project metrics
 * This overrides manual health status when metrics indicate problems
 */
export const calculateAutoHealthStatus = (project: Project): 'Green' | 'Yellow' | 'Red' => {
  const criticalIssues: string[] = [];
  const warningIssues: string[] = [];

  // 1. Budget health check
  const budget = Number(project.budget) || 0;
  const actualCost = Number(project.actualCost) || 0;
  const forecast = Number(project.forecastedCost) || budget;
  const costToCompare = Math.max(actualCost, forecast);

  if (budget > 0) {
    const budgetVariance = ((costToCompare - budget) / budget) * 100;
    if (budgetVariance > 50) {
      criticalIssues.push(`${budgetVariance.toFixed(0)}% over budget`);
    } else if (budgetVariance > 20) {
      warningIssues.push(`${budgetVariance.toFixed(0)}% over budget`);
    }
  }

  // 2. Schedule health check
  // Use desiredCompletionDate if available, otherwise fallback to endDate as planned
  const plannedEnd = project.desiredCompletionDate
    ? new Date(project.desiredCompletionDate)
    : (project.endDate ? new Date(project.endDate) : null);

  // Use the later of actualEndDate or endDate, or today if project is ongoing
  const actualEndDate = project.actualEndDate ? new Date(project.actualEndDate) : null;
  const endDate = project.endDate ? new Date(project.endDate) : null;
  const actualEnd = actualEndDate && endDate
    ? (actualEndDate > endDate ? actualEndDate : endDate)
    : (actualEndDate || endDate || new Date());

  if (plannedEnd && actualEnd > plannedEnd) {
    const delayDays = Math.floor((actualEnd.getTime() - plannedEnd.getTime()) / (1000 * 60 * 60 * 24));
    if (delayDays > 90) {
      criticalIssues.push(`${delayDays} days delayed`);
    } else if (delayDays > 30) {
      warningIssues.push(`${delayDays} days delayed`);
    }
  }

  // 3. Progress health check (if status is not Planning)
  if (project.status !== 'Planning' && project.status !== 'Not Started') {
    const progress = Number(project.progress) || 0;
    if (progress < 10 && project.status === 'In Progress') {
      warningIssues.push('Low progress');
    }
  }

  // Return health status based on issues found
  if (criticalIssues.length > 0) {
    return 'Red';
  } else if (warningIssues.length > 0) {
    return 'Yellow';
  } else {
    // If no issues detected, use manual health status
    return (project.healthStatus as 'Green' | 'Yellow' | 'Red') || 'Green';
  }
};

/**
 * Calculate risk score for a single project
 * New scoring system (total 100 points):
 * - Budget: 0-20 points
 * - Schedule: 0-20 points
 * - Resource: 0-20 points
 * - Dependency: 0-15 points
 * - Complexity: 0-10 points
 * - Health Status: 0-15 points (NEW!)
 */
export const calculateProjectRisk = async (project: Project): Promise<number> => {
  let riskScore = 0;

  // 1. Health Status Risk (0-15 points) - PRIMARY INDICATOR
  // Use automatic health status calculation based on actual metrics
  const actualHealthStatus = calculateAutoHealthStatus(project);
  if (actualHealthStatus === 'Red') {
    riskScore += 15; // Critical issues
  } else if (actualHealthStatus === 'Yellow') {
    riskScore += 8; // Warning signs
  }
  // Green = 0 points (healthy)

  // 2. Budget risk (0-20 points)
  const budget = Number(project.budget) || 0;
  const actualCost = Number(project.actualCost) || 0;
  const forecast = Number(project.forecastedCost) || budget;
  // Use the higher of actualCost or forecastedCost to represent true financial risk
  const costToCompare = Math.max(actualCost, forecast);
  if (budget > 0) {
    const budgetVariance = ((costToCompare - budget) / budget) * 100;
    if (budgetVariance > 30) riskScore += 15;
    else if (budgetVariance > 15) riskScore += 10;
    else if (budgetVariance > 5) riskScore += 5;
  }

  // 3. Schedule risk (0-20 points)
  // Use desiredCompletionDate if available, otherwise fallback to endDate as planned
  const plannedEnd = project.desiredCompletionDate
    ? new Date(project.desiredCompletionDate)
    : (project.endDate ? new Date(project.endDate) : null);

  // Use the later of actualEndDate or endDate, or today if project is ongoing
  const actualEndDate = project.actualEndDate ? new Date(project.actualEndDate) : null;
  const endDate = project.endDate ? new Date(project.endDate) : null;
  const actualEnd = actualEndDate && endDate
    ? (actualEndDate > endDate ? actualEndDate : endDate)
    : (actualEndDate || endDate || new Date());

  if (plannedEnd && actualEnd > plannedEnd) {
    const delayDays = Math.floor((actualEnd.getTime() - plannedEnd.getTime()) / (1000 * 60 * 60 * 24));
    if (delayDays > 90) riskScore += 15;
    else if (delayDays > 30) riskScore += 10;
    else if (delayDays > 7) riskScore += 5;
  }

  // 4. Resource risk (0-20 points)
  const requirements = await ProjectRequirement.count({
    where: { projectId: project.id, isActive: true },
  });
  const allocations = await ResourceAllocation.count({
    where: { projectId: project.id, isActive: true },
  });
  if (requirements > 0) {
    const allocationRate = (allocations / requirements) * 100;
    if (allocationRate < 60) riskScore += 15;
    else if (allocationRate < 80) riskScore += 10;
    else if (allocationRate < 90) riskScore += 5;
  }

  // 5. Dependency risk (0-15 points)
  const dependencies = await ProjectDependency.count({
    where: {
      successorType: 'project',
      successorId: project.id,
      isActive: true,
    },
  });
  if (dependencies > 5) riskScore += 12;
  else if (dependencies > 3) riskScore += 8;
  else if (dependencies > 1) riskScore += 4;

  // 6. Complexity risk (0-10 points)
  if (budget > 10000000) riskScore += 7;
  else if (budget > 5000000) riskScore += 4;

  if (project.desiredStartDate && project.desiredCompletionDate) {
    const start = new Date(project.desiredStartDate);
    const end = new Date(project.desiredCompletionDate);
    const durationDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (durationDays > 365) riskScore += 3;
    else if (durationDays > 180) riskScore += 2;
  }

  return Math.min(100, riskScore);
};

/**
 * Calculate comprehensive risk score for a segment function based on its projects
 * Risk score ranges from 0-100 where:
 * - 0-30: Low risk (Green)
 * - 31-60: Medium risk (Orange)
 * - 61-100: High risk (Red)
 */
export const calculateSegmentFunctionRisk = async (
  segmentFunctionId: number,
  scenarioId: number
): Promise<SegmentFunctionRisk> => {
  // Get all active projects in this segment function
  const projects = await Project.findAll({
    where: {
      segmentFunctionId,
      scenarioId,
      isActive: true,
    },
  });

  if (projects.length === 0) {
    return {
      budgetRisk: 0,
      scheduleRisk: 0,
      resourceRisk: 0,
      dependencyRisk: 0,
      complexityRisk: 0,
      healthRisk: 0,
      totalScore: 0,
      maxRisk: 0,
      distribution: {
        lowRisk: 0,
        mediumRisk: 0,
        highRisk: 0,
        totalProjects: 0,
      },
      projectRisks: [],
      projectsNeedingAttention: 0,
      details: {
        budgetRisk: 'No projects to assess',
        scheduleRisk: 'No projects to assess',
        resourceRisk: 'No projects to assess',
        dependencyRisk: 'No projects to assess',
        complexityRisk: 'No projects to assess',
        healthRisk: 'No projects to assess',
      },
    };
  }

  // Calculate risk for each project
  const projectRisks: ProjectRiskScore[] = await Promise.all(
    projects.map(async (project) => {
      const riskScore = await calculateProjectRisk(project);
      return {
        projectId: project.id,
        projectName: project.name || `Project ${project.id}`,
        riskScore,
        riskLevel: getRiskLevel(riskScore),
      };
    })
  );

  // Calculate distribution
  const distribution: RiskDistribution = {
    lowRisk: projectRisks.filter((p) => p.riskLevel === 'Low').length,
    mediumRisk: projectRisks.filter((p) => p.riskLevel === 'Medium').length,
    highRisk: projectRisks.filter((p) => p.riskLevel === 'High').length,
    totalProjects: projects.length,
  };

  // Get maximum risk score
  const maxRisk = Math.max(...projectRisks.map((p) => p.riskScore), 0);

  // Count projects needing attention (medium or high risk)
  const projectsNeedingAttention = distribution.mediumRisk + distribution.highRisk;

  // 1. Budget Risk (0-25 points)
  const budgetRisk = await calculateBudgetRisk(projects);

  // 2. Schedule Risk (0-25 points)
  const scheduleRisk = await calculateScheduleRisk(projects);

  // 3. Resource Risk (0-20 points)
  const resourceRisk = await calculateResourceRisk(projects);

  // 4. Dependency Risk (0-15 points)
  const dependencyRisk = await calculateDependencyRisk(projects);

  // 5. Complexity Risk (0-15 points)
  const complexityRisk = await calculateComplexityRisk(projects);

  // 6. Health Risk (0-15 points) - NEW!
  const healthRisk = await calculateHealthRisk(projects);

  const totalScore = Math.round(
    budgetRisk.score + scheduleRisk.score + resourceRisk.score + dependencyRisk.score + complexityRisk.score + healthRisk.score
  );

  return {
    budgetRisk: Math.round(budgetRisk.score),
    scheduleRisk: Math.round(scheduleRisk.score),
    resourceRisk: Math.round(resourceRisk.score),
    dependencyRisk: Math.round(dependencyRisk.score),
    complexityRisk: Math.round(complexityRisk.score),
    healthRisk: Math.round(healthRisk.score),
    totalScore: Math.min(100, totalScore), // Cap at 100
    maxRisk,
    distribution,
    projectRisks,
    projectsNeedingAttention,
    details: {
      budgetRisk: budgetRisk.detail,
      scheduleRisk: scheduleRisk.detail,
      resourceRisk: resourceRisk.detail,
      dependencyRisk: dependencyRisk.detail,
      complexityRisk: complexityRisk.detail,
      healthRisk: healthRisk.detail,
    },
  };
};

/**
 * Calculate budget risk based on budget variance
 */
async function calculateBudgetRisk(projects: Project[]): Promise<{ score: number; detail: string }> {
  let totalBudget = 0;
  let totalCost = 0;
  let overBudgetCount = 0;
  let severeOverBudget = 0;

  for (const project of projects) {
    const budget = Number(project.budget) || 0;
    const actualCost = Number(project.actualCost) || 0;
    const forecast = Number(project.forecastedCost) || budget;
    // Use the higher of actualCost or forecastedCost to represent true financial risk
    const costToCompare = Math.max(actualCost, forecast);

    totalBudget += budget;
    totalCost += costToCompare;

    if (costToCompare > budget && budget > 0) {
      overBudgetCount++;
      const variance = ((costToCompare - budget) / budget) * 100;
      if (variance > 20) severeOverBudget++;
    }
  }

  if (totalBudget === 0) {
    return { score: 5, detail: 'No budget data available (+5 base risk)' };
  }

  const overallVariance = ((totalCost - totalBudget) / totalBudget) * 100;
  const overBudgetPercentage = (overBudgetCount / projects.length) * 100;

  let score = 0;
  let detail = '';

  // Score based on overall variance
  if (overallVariance > 30) {
    score += 15;
    detail = `${overallVariance.toFixed(1)}% over budget (+15)`;
  } else if (overallVariance > 15) {
    score += 10;
    detail = `${overallVariance.toFixed(1)}% over budget (+10)`;
  } else if (overallVariance > 5) {
    score += 5;
    detail = `${overallVariance.toFixed(1)}% over budget (+5)`;
  } else if (overallVariance < -5) {
    score += 3;
    detail = `${Math.abs(overallVariance).toFixed(1)}% under budget (+3)`;
  } else {
    detail = `${overallVariance >= 0 ? '+' : ''}${overallVariance.toFixed(1)}% variance (±0)`;
  }

  // Additional risk for multiple projects over budget
  if (severeOverBudget > 0) {
    score += severeOverBudget * 2;
    detail += `, ${severeOverBudget} projects >20% over (+${severeOverBudget * 2})`;
  } else if (overBudgetPercentage > 50) {
    score += 5;
    detail += `, ${overBudgetCount}/${projects.length} over budget (+5)`;
  }

  return { score: Math.min(25, score), detail };
}

/**
 * Calculate schedule risk based on delays
 */
async function calculateScheduleRisk(projects: Project[]): Promise<{ score: number; detail: string }> {
  const now = new Date();
  let delayedCount = 0;
  let severeDelays = 0;
  let totalDelayDays = 0;

  for (const project of projects) {
    // Use desiredCompletionDate if available, otherwise fallback to endDate as planned
    const plannedEnd = project.desiredCompletionDate
      ? new Date(project.desiredCompletionDate)
      : (project.endDate ? new Date(project.endDate) : null);

    // Use the later of actualEndDate or endDate, or today if project is ongoing
    const actualEndDate = project.actualEndDate ? new Date(project.actualEndDate) : null;
    const endDate = project.endDate ? new Date(project.endDate) : null;
    const actualEnd = actualEndDate && endDate
      ? (actualEndDate > endDate ? actualEndDate : endDate)
      : (actualEndDate || endDate || now);

    if (plannedEnd && actualEnd > plannedEnd) {
      delayedCount++;
      const delayDays = Math.floor((actualEnd.getTime() - plannedEnd.getTime()) / (1000 * 60 * 60 * 24));
      totalDelayDays += delayDays;
      if (delayDays > 30) severeDelays++;
    }
  }

  if (projects.length === 0) {
    return { score: 0, detail: 'No projects to assess' };
  }

  const delayedPercentage = (delayedCount / projects.length) * 100;
  const avgDelay = delayedCount > 0 ? totalDelayDays / delayedCount : 0;

  let score = 0;
  let detail = '';

  if (delayedPercentage > 60) {
    score += 15;
    detail = `${delayedCount}/${projects.length} delayed (+15)`;
  } else if (delayedPercentage > 30) {
    score += 10;
    detail = `${delayedCount}/${projects.length} delayed (+10)`;
  } else if (delayedPercentage > 10) {
    score += 5;
    detail = `${delayedCount}/${projects.length} delayed (+5)`;
  } else {
    detail = `${delayedCount}/${projects.length} delayed (±0)`;
  }

  // Additional risk for severe delays
  if (severeDelays > 0) {
    score += severeDelays * 2;
    detail += `, ${severeDelays} >30 days (+${severeDelays * 2})`;
  } else if (avgDelay > 15) {
    score += 5;
    detail += `, avg ${avgDelay.toFixed(0)} days (+5)`;
  }

  return { score: Math.min(25, score), detail };
}

/**
 * Calculate resource risk based on allocation issues
 */
async function calculateResourceRisk(projects: Project[]): Promise<{ score: number; detail: string }> {
  let totalRequirements = 0;
  let totalAllocations = 0;
  let underAllocatedCount = 0;
  let overAllocatedCount = 0;

  for (const project of projects) {
    // Count requirements
    const requirements = await ProjectRequirement.count({
      where: { projectId: project.id, isActive: true },
    });

    // Count allocations
    const allocations = await ResourceAllocation.count({
      where: { projectId: project.id, isActive: true },
    });

    totalRequirements += requirements;
    totalAllocations += allocations;

    const allocationRatio = requirements > 0 ? (allocations / requirements) * 100 : 100;

    if (allocationRatio < 80) underAllocatedCount++;
    if (allocationRatio > 120) overAllocatedCount++;
  }

  const allocationRate = totalRequirements > 0 ? (totalAllocations / totalRequirements) * 100 : 100;

  let score = 0;
  let detail = '';

  if (allocationRate < 60) {
    score += 15;
    detail = `${allocationRate.toFixed(0)}% allocated (+15)`;
  } else if (allocationRate < 80) {
    score += 10;
    detail = `${allocationRate.toFixed(0)}% allocated (+10)`;
  } else if (allocationRate < 90) {
    score += 5;
    detail = `${allocationRate.toFixed(0)}% allocated (+5)`;
  } else if (allocationRate > 120) {
    score += 8;
    detail = `${allocationRate.toFixed(0)}% allocated - over-allocated (+8)`;
  } else {
    detail = `${allocationRate.toFixed(0)}% allocated (±0)`;
  }

  // Additional risk for projects with allocation issues
  if (underAllocatedCount > 0) {
    score += Math.min(5, underAllocatedCount);
    detail += `, ${underAllocatedCount} under-allocated (+${Math.min(5, underAllocatedCount)})`;
  }

  return { score: Math.min(20, score), detail };
}

/**
 * Calculate dependency risk based on project dependencies
 */
async function calculateDependencyRisk(projects: Project[]): Promise<{ score: number; detail: string }> {
  const projectIds = projects.map((p) => p.id);

  if (projectIds.length === 0) {
    return { score: 0, detail: 'No projects to assess' };
  }

  // Count dependencies where these projects are successors (blocked by others)
  const incomingDeps = await ProjectDependency.count({
    where: {
      successorType: 'project',
      successorId: projectIds,
      isActive: true,
    },
  });

  // Count dependencies where these projects are predecessors (blocking others)
  const outgoingDeps = await ProjectDependency.count({
    where: {
      predecessorType: 'project',
      predecessorId: projectIds,
      isActive: true,
    },
  });

  const totalDeps = incomingDeps + outgoingDeps;
  const avgDepsPerProject = totalDeps / projects.length;

  let score = 0;
  let detail = '';

  if (avgDepsPerProject > 5) {
    score += 12;
    detail = `${totalDeps} dependencies (${avgDepsPerProject.toFixed(1)}/project) (+12)`;
  } else if (avgDepsPerProject > 3) {
    score += 8;
    detail = `${totalDeps} dependencies (${avgDepsPerProject.toFixed(1)}/project) (+8)`;
  } else if (avgDepsPerProject > 1) {
    score += 4;
    detail = `${totalDeps} dependencies (${avgDepsPerProject.toFixed(1)}/project) (+4)`;
  } else {
    detail = `${totalDeps} dependencies (±0)`;
  }

  // Additional risk for high incoming dependencies (blocked by many)
  const avgIncoming = incomingDeps / projects.length;
  if (avgIncoming > 3) {
    score += 3;
    detail += `, blocked by ${incomingDeps} (+3)`;
  }

  return { score: Math.min(15, score), detail };
}

/**
 * Calculate complexity risk based on project characteristics
 */
async function calculateComplexityRisk(projects: Project[]): Promise<{ score: number; detail: string }> {
  let largeProjectCount = 0;
  let highValueCount = 0;
  let longDurationCount = 0;

  for (const project of projects) {
    const budget = Number(project.budget) || 0;

    // Large budget = complex
    if (budget > 5000000) largeProjectCount++;
    if (budget > 10000000) highValueCount++;

    // Long duration = complex
    if (project.desiredStartDate && project.desiredCompletionDate) {
      const start = new Date(project.desiredStartDate);
      const end = new Date(project.desiredCompletionDate);
      const durationDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      if (durationDays > 180) longDurationCount++;
    }
  }

  const complexityFactors = [];
  let score = 0;

  if (projects.length > 15) {
    score += 5;
    complexityFactors.push(`${projects.length} projects (+5)`);
  } else if (projects.length > 10) {
    score += 3;
    complexityFactors.push(`${projects.length} projects (+3)`);
  }

  if (highValueCount > 0) {
    score += 5;
    complexityFactors.push(`${highValueCount} >$10M (+5)`);
  } else if (largeProjectCount > 0) {
    score += 3;
    complexityFactors.push(`${largeProjectCount} >$5M (+3)`);
  }

  if (longDurationCount > 0) {
    score += Math.min(5, longDurationCount * 2);
    complexityFactors.push(`${longDurationCount} >6mo (+${Math.min(5, longDurationCount * 2)})`);
  }

  const detail = complexityFactors.length > 0 ? complexityFactors.join(', ') : 'Low complexity (±0)';

  return { score: Math.min(15, score), detail };
}

/**
 * Calculate health risk based on project health status
 */
async function calculateHealthRisk(projects: Project[]): Promise<{ score: number; detail: string }> {
  let redCount = 0;
  let yellowCount = 0;
  let greenCount = 0;

  for (const project of projects) {
    // Use automatic health status calculation based on metrics
    const actualHealthStatus = calculateAutoHealthStatus(project);
    if (actualHealthStatus === 'Red') redCount++;
    else if (actualHealthStatus === 'Yellow') yellowCount++;
    else if (actualHealthStatus === 'Green') greenCount++;
  }

  const redPercentage = (redCount / projects.length) * 100;
  const yellowPercentage = (yellowCount / projects.length) * 100;

  let score = 0;
  let detail = '';

  // Critical: Red projects indicate severe issues
  if (redPercentage > 50) {
    score += 15;
    detail = `${redCount}/${projects.length} Red status (+15)`;
  } else if (redPercentage > 25) {
    score += 10;
    detail = `${redCount}/${projects.length} Red status (+10)`;
  } else if (redCount > 0) {
    score += 5;
    detail = `${redCount}/${projects.length} Red status (+5)`;
  } else if (yellowPercentage > 50) {
    score += 8;
    detail = `${yellowCount}/${projects.length} Yellow status (+8)`;
  } else if (yellowCount > 0) {
    score += 4;
    detail = `${yellowCount}/${projects.length} Yellow status (+4)`;
  } else {
    detail = `${greenCount}/${projects.length} Green status (±0)`;
  }

  return { score: Math.min(15, score), detail };
}

