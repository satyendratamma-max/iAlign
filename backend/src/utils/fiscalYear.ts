/**
 * Fiscal Year Utility
 *
 * Calculates the current fiscal year based on the current date.
 *
 * Fiscal year start rules:
 * - If October ends on a Sunday: Fiscal year starts November 1st
 * - Otherwise: Fiscal year starts on the last Monday of October
 *
 * For example:
 * - October 2024 ends on Thursday -> FY25 starts Oct 28, 2024 (last Monday)
 * - October 2025 ends on Friday -> FY26 starts Oct 27, 2025 (last Monday)
 * - If Oct ends on Sunday -> FY starts Nov 1st
 */

/**
 * Get the fiscal year start date for a given calendar year
 * Uses UTC to avoid timezone issues
 * @param calendarYear - The calendar year to calculate for
 * @returns The start date of the fiscal year in UTC
 */
function getFiscalYearStartDate(calendarYear: number): Date {
  // Get October 31st of the given year in UTC
  const oct31 = new Date(Date.UTC(calendarYear, 9, 31)); // Month 9 = October (0-indexed)
  const dayOfWeek = oct31.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  if (dayOfWeek === 0) {
    // October ends on Sunday -> Fiscal year starts November 1st
    return new Date(Date.UTC(calendarYear, 10, 1)); // Month 10 = November
  } else {
    // October doesn't end on Sunday -> Find last Monday of October
    // Calculate days to subtract to get to the last Monday
    const daysToLastMonday = (dayOfWeek + 6) % 7; // Days from last Monday to Oct 31
    const lastMonday = 31 - daysToLastMonday;
    return new Date(Date.UTC(calendarYear, 9, lastMonday)); // Month 9 = October
  }
}

/**
 * Get the current fiscal year in format "FYxx"
 * @param date - Optional date to calculate from (defaults to current date)
 * @returns Fiscal year string (e.g., "FY26")
 */
export function getCurrentFiscalYear(date: Date = new Date()): string {
  // Normalize the input date to start of day in UTC for consistent comparison
  const normalizedDate = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  ));
  const year = normalizedDate.getUTCFullYear();

  // The fiscal year number corresponds to the year in which it ENDS (next calendar year)
  // For example, FY25 starts in late October 2024 and ends in October 2025

  // Get the fiscal year start date for the current calendar year
  const currentYearFYStart = getFiscalYearStartDate(year);

  // Determine which fiscal year we're in
  let fiscalYear: number;
  if (normalizedDate >= currentYearFYStart) {
    // We're on or after the fiscal year start for this calendar year
    // The fiscal year ending in the NEXT calendar year has started
    // So we're in FY (year + 1)
    fiscalYear = year + 1;
  } else {
    // We're before the fiscal year start for this calendar year
    // So we're still in the fiscal year that ends this calendar year
    // So we're in FY (year)
    fiscalYear = year;
  }

  // Return in format "FYxx" (last 2 digits of year)
  return `FY${fiscalYear.toString().slice(-2)}`;
}

/**
 * Get an array of fiscal years for a given range
 * @param startYear - Starting fiscal year (e.g., 24 for FY24)
 * @param count - Number of fiscal years to generate
 * @returns Array of fiscal year strings (e.g., ["FY24", "FY25", "FY26"])
 */
export function getFiscalYears(startYear: number, count: number): string[] {
  const years: string[] = [];
  for (let i = 0; i < count; i++) {
    const year = (startYear + i).toString().padStart(2, '0');
    years.push(`FY${year}`);
  }
  return years;
}

/**
 * Get an array of fiscal years including current and future years
 * @param futureYears - Number of future years to include (default: 2)
 * @param date - Optional date to calculate from (defaults to current date)
 * @returns Array of fiscal year strings (e.g., ["FY26", "FY27", "FY28"])
 */
export function getCurrentAndFutureFiscalYears(futureYears: number = 2, date: Date = new Date()): string[] {
  const currentFY = getCurrentFiscalYear(date);
  const currentFYNumber = parseInt(currentFY.slice(2), 10);

  const years: string[] = [];
  for (let i = 0; i <= futureYears; i++) {
    const year = (currentFYNumber + i).toString().padStart(2, '0');
    years.push(`FY${year}`);
  }
  return years;
}

/**
 * Get an array of fiscal years including previous, current, and future years
 * @param previousYears - Number of previous years to include (default: 1)
 * @param futureYears - Number of future years to include (default: 2)
 * @param date - Optional date to calculate from (defaults to current date)
 * @returns Array of fiscal year strings (e.g., ["FY25", "FY26", "FY27", "FY28"])
 */
export function getFiscalYearRange(
  previousYears: number = 1,
  futureYears: number = 2,
  date: Date = new Date()
): string[] {
  const currentFY = getCurrentFiscalYear(date);
  const currentFYNumber = parseInt(currentFY.slice(2), 10);

  const years: string[] = [];
  for (let i = -previousYears; i <= futureYears; i++) {
    const year = (currentFYNumber + i).toString().padStart(2, '0');
    years.push(`FY${year}`);
  }
  return years;
}
