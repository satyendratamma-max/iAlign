/**
 * Utility functions for calculating resource allocation percentages
 */

interface AllocationWithDates {
  allocationPercentage: number;
  startDate?: string;
  endDate?: string;
}

/**
 * Calculates the maximum concurrent allocation percentage for a resource.
 * This function considers time overlaps - it finds the maximum sum of allocation
 * percentages across all overlapping time periods.
 *
 * @param allocations - Array of allocations for a resource
 * @returns Maximum concurrent allocation percentage
 *
 * @example
 * // Resource allocated 50% to Project A (Jan-Mar) and 50% to Project B (Apr-Jun)
 * // Returns 50 (not 100) because projects don't overlap
 *
 * // Resource allocated 50% to Project A (Jan-Jun) and 30% to Project B (Mar-Apr)
 * // Returns 80 (during Mar-Apr both projects overlap)
 */
export const calculateMaxConcurrentAllocation = (allocations: AllocationWithDates[]): number => {
  if (allocations.length === 0) return 0;

  // Filter allocations that have both start and end dates
  const datedAllocations = allocations.filter(a => a.startDate && a.endDate);

  // If no allocations have dates, fall back to simple sum (old behavior for backwards compatibility)
  if (datedAllocations.length === 0) {
    return allocations.reduce((sum, a) => sum + a.allocationPercentage, 0);
  }

  // Create time events for each allocation
  interface TimeEvent {
    time: Date;
    type: 'start' | 'end';
    percentage: number;
  }

  const events: TimeEvent[] = [];

  datedAllocations.forEach(allocation => {
    events.push({
      time: new Date(allocation.startDate!),
      type: 'start',
      percentage: allocation.allocationPercentage,
    });
    events.push({
      time: new Date(allocation.endDate!),
      type: 'end',
      percentage: allocation.allocationPercentage,
    });
  });

  // Sort events by time, with 'end' events before 'start' events at the same time
  events.sort((a, b) => {
    const timeDiff = a.time.getTime() - b.time.getTime();
    if (timeDiff !== 0) return timeDiff;
    // If same time, process 'end' before 'start'
    return a.type === 'end' ? -1 : 1;
  });

  // Track current and maximum allocation
  let currentAllocation = 0;
  let maxAllocation = 0;

  events.forEach(event => {
    if (event.type === 'start') {
      currentAllocation += event.percentage;
      maxAllocation = Math.max(maxAllocation, currentAllocation);
    } else {
      currentAllocation -= event.percentage;
    }
  });

  return maxAllocation;
};

/**
 * Groups allocations by resource ID and calculates max concurrent allocation for each
 *
 * @param allocations - Array of allocations with resourceId field
 * @returns Map of resourceId to max concurrent allocation percentage
 */
export const calculateResourceAllocations = <T extends AllocationWithDates & { resourceId: number }>(
  allocations: T[]
): Map<number, number> => {
  const allocationsByResource = new Map<number, T[]>();

  // Group allocations by resource
  allocations.forEach(allocation => {
    const existing = allocationsByResource.get(allocation.resourceId) || [];
    existing.push(allocation);
    allocationsByResource.set(allocation.resourceId, existing);
  });

  // Calculate max concurrent allocation for each resource
  const result = new Map<number, number>();
  allocationsByResource.forEach((resourceAllocations, resourceId) => {
    result.set(resourceId, calculateMaxConcurrentAllocation(resourceAllocations));
  });

  return result;
};
