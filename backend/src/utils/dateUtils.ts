/**
 * Date utilities with strict calendar date parsing, timezone safety, and zero accidental timezone shifts.
 * Standard format: "YYYY-MM-DD"
 * Weekdays: 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday, 7 = Sunday
 */

/**
 * Validate that a string is a valid calendar date in YYYY-MM-DD format.
 * Validates leap years, month ranges (01-12), and exact days in month.
 */
export function isValidISODateString(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const regex = /^(\d{4})-(\d{2})-(\d{2})$/;
  const match = dateStr.match(regex);
  if (!match) return false;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;

  // Days in month
  const daysInMonth = [
    31,
    isLeapYear(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  if (day < 1 || day > daysInMonth[month - 1]) return false;

  return true;
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Get current calendar date (YYYY-MM-DD) in the specified IANA timezone.
 * Defaults to "UTC" if timezone is missing or invalid.
 */
export function getUserToday(timezone: string = 'UTC'): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(now); // en-CA outputs YYYY-MM-DD
  } catch {
    // Fallback if timezone string is invalid
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

/**
 * Validate IANA timezone identifier.
 */
export function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse YYYY-MM-DD into a UTC Date object set to 00:00:00.000 UTC
 */
export function parseISODateToUTC(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

/**
 * Format a UTC Date object into YYYY-MM-DD
 */
export function formatUTCToISODate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Add or subtract days from a YYYY-MM-DD string safely.
 */
export function addDaysToDateString(dateStr: string, days: number): string {
  const d = parseISODateToUTC(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return formatUTCToISODate(d);
}

/**
 * Calculate difference in calendar days: (dateStrA - dateStrB).
 * If dateStrA is later than dateStrB, result is positive.
 */
export function diffInDays(dateStrA: string, dateStrB: string): number {
  const a = parseISODateToUTC(dateStrA).getTime();
  const b = parseISODateToUTC(dateStrB).getTime();
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((a - b) / msPerDay);
}

/**
 * Get ISO day of week for YYYY-MM-DD.
 * 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday, 7 = Sunday
 */
export function getDayOfWeek(dateStr: string): number {
  const d = parseISODateToUTC(dateStr);
  const day = d.getUTCDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
  return day === 0 ? 7 : day;
}

/**
 * Get the Monday (YYYY-MM-DD) of the week containing dateStr.
 */
export function getStartOfWeek(dateStr: string): string {
  const dayOfWeek = getDayOfWeek(dateStr);
  const daysToSubtract = dayOfWeek - 1; // 1 -> 0, 2 -> 1, ..., 7 -> 6
  return addDaysToDateString(dateStr, -daysToSubtract);
}

/**
 * Get the Sunday (YYYY-MM-DD) of the week containing dateStr.
 */
export function getEndOfWeek(dateStr: string): string {
  const start = getStartOfWeek(dateStr);
  return addDaysToDateString(start, 6);
}

/**
 * Generate an inclusive list of YYYY-MM-DD dates between startDateStr and endDateStr.
 */
export function getDateRange(startDateStr: string, endDateStr: string): string[] {
  const dates: string[] = [];
  let current = startDateStr;
  while (diffInDays(endDateStr, current) >= 0) {
    dates.push(current);
    current = addDaysToDateString(current, 1);
  }
  return dates;
}

/**
 * Validation for 7-day correction window.
 * Allowed: targetDate <= today and targetDate >= today - 7 days.
 */
export function validateCorrectionWindow(
  targetDate: string,
  today: string
): { valid: boolean; error?: string } {
  if (!isValidISODateString(targetDate)) {
    return { valid: false, error: `Invalid date format: ${targetDate}. Expected YYYY-MM-DD.` };
  }

  const diffFromToday = diffInDays(targetDate, today);

  if (diffFromToday > 0) {
    return { valid: false, error: 'Future completion dates are not permitted.' };
  }

  if (diffInDays(today, targetDate) > 7) {
    return {
      valid: false,
      error: 'Cannot record or modify completions older than 7 calendar days.',
    };
  }

  return { valid: true };
}

/**
 * Get short 3-letter month name for date string.
 */
export function getShortMonthName(dateStr: string): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIdx = parseInt(dateStr.split('-')[1], 10) - 1;
  return months[monthIdx] || '';
}
