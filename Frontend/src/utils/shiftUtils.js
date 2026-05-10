/**
 * Shift options for dropdown
 */
export const SHIFT_OPTIONS = [
  { value: 0,    label: 'A',    display: 'Absent' },
  { value: 1,    label: 'P',    display: 'Present' },
  { value: 1.5,  label: 'P½',   display: 'Half Shift' },
  { value: 2,    label: '2P',   display: '2 Shifts' },
  { value: 2.5,  label: '2.5P', display: '2.5 Shifts' },
  { value: 3,    label: '3P',   display: '3 Shifts' },
  { value: 3.5,  label: '3.5P', display: '3.5 Shifts' },
  { value: 4,    label: '4P',   display: '4 Shifts' },
  { value: 'custom', label: 'Custom', display: 'Custom Shift' },
];

/**
 * Get color class based on shift value
 */
export function getShiftColorClass(value) {
  const num = parseFloat(value);
  if (isNaN(num) || num === 0) return 'shift-absent';
  if (num === 1.5) return 'shift-half';
  if (num >= 2) return 'shift-high';
  return 'shift-present';
}

/**
 * Get shift label
 */
export function getShiftLabel(value) {
  if (value === null || value === undefined || value === '') return 'A';
  const opt = SHIFT_OPTIONS.find(o => o.value === parseFloat(value));
  return opt ? opt.label : String(value);
}

/**
 * Get text color for shift badge
 */
export function getShiftBadgeStyle(value) {
  const num = parseFloat(value);
  if (isNaN(num) || num === 0) return { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' };
  if (num === 1.5) return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' };
  if (num >= 2) return { bg: '#faf5ff', text: '#7c3aed', border: '#e9d5ff' };
  return { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' };
}

/**
 * Department options
 */
export const DEPARTMENTS = [
  'Mistry',
  'Carpenter',
  'Assistant',
  'Painter',
  'Extra',
  'Molder',
  'Rustom',
  'Other',
];
