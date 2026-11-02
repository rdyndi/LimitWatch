import { MONTH_NAMES } from './constants';

export const formatIDR = (num: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.ceil(num || 0));
};

export const formatNumberIDR = (num: number): string => {
  return new Intl.NumberFormat('id-ID').format(Math.ceil(num || 0));
};

export const parseIDR = (val: string | number): number => {
  if (typeof val === 'number') return isNaN(val) ? 0 : Math.ceil(val);
  if (!val) return 0;
  const digitsOnly = val.replace(/[^\d-]/g, '');
  if (digitsOnly === '' || digitsOnly === '-') return 0;
  const num = parseInt(digitsOnly, 10);
  return isNaN(num) ? 0 : Math.ceil(num);
};

export const formatPeriod = (month: number, year: number): string => {
  const monthName = MONTH_NAMES[month] || `Bulan ${month + 1}`;
  return `${monthName} ${year}`;
};

export const formatDateID = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(d);
  } catch {
    return dateStr;
  }
};
