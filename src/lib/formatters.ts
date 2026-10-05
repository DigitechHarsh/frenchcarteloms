import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export const TIMEZONE = 'Asia/Kolkata';

/**
 * Format Indian Rupee currency (e.g. Rs 1,24,500)
 * No decimals, Indian number grouping
 */
export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return 'Rs 0';
  const rounded = Math.round(amount);
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  }).format(rounded);
  return `Rs ${formatted}`;
}

/**
 * Get current date in Asia/Kolkata timezone (YYYY-MM-DD)
 */
export function getKolkataDateString(date?: string | Date): string {
  return dayjs(date).tz(TIMEZONE).format('YYYY-MM-DD');
}

/**
 * Format time (e.g. 02:45 PM) in Kolkata timezone
 */
export function formatKolkataTime(dateString?: string): string {
  if (!dateString) return '-';
  return dayjs(dateString).tz(TIMEZONE).format('hh:mm A');
}

/**
 * Format date & time (e.g. 03 Oct, 02:45 PM) in Kolkata timezone
 */
export function formatKolkataDateTime(dateString?: string): string {
  if (!dateString) return '-';
  return dayjs(dateString).tz(TIMEZONE).format('DD MMM, hh:mm A');
}

export { dayjs };
