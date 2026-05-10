import dayjs from 'dayjs';

/**
 * Generate array of date strings between start and end (inclusive)
 */
export function getDateRange(startDate, endDate) {
  const dates = [];
  let current = dayjs(startDate);
  const end = dayjs(endDate);
  while (current.isBefore(end) || current.isSame(end, 'day')) {
    dates.push(current.format('YYYY-MM-DD'));
    current = current.add(1, 'day');
  }
  return dates;
}

/**
 * Format date for display
 */
export function formatDate(date, format = 'MMM D') {
  return dayjs(date).format(format);
}

/**
 * Format date for display as day abbrev + date
 */
export function formatDayDate(date) {
  return {
    day: dayjs(date).format('ddd'),
    date: dayjs(date).format('D'),
    month: dayjs(date).format('MMM'),
  };
}

/**
 * Get current month start and end
 */
export function getCurrentMonthRange() {
  return {
    startDate: dayjs().startOf('month').format('YYYY-MM-DD'),
    endDate: dayjs().endOf('month').format('YYYY-MM-DD'),
  };
}

/**
 * Format currency
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function today() {
  return dayjs().format('YYYY-MM-DD');
}
