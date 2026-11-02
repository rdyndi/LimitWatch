export const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
] as const;

export const MONTH_SHORT_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
] as const;

export const QUICK_TENORS = [3, 6, 12, 18, 24, 36] as const;

export const COMMON_CATEGORIES = [
  'Makan & Minum',
  'Belanja Bulanan',
  'Transportasi',
  'Hiburan',
  'Tagihan & Utilitas',
  'Kesehatan',
  'Pendidikan',
  'Elektronik',
  'Lainnya'
] as const;

export const CARD_COLORS = [
  { label: 'Slate', value: 'bg-slate-800', text: 'text-slate-800' },
  { label: 'Blue', value: 'bg-blue-600', text: 'text-blue-600' },
  { label: 'Indigo', value: 'bg-indigo-700', text: 'text-indigo-700' },
  { label: 'Emerald', value: 'bg-emerald-700', text: 'text-emerald-700' },
  { label: 'Rose', value: 'bg-rose-700', text: 'text-rose-700' },
  { label: 'Amber', value: 'bg-amber-600', text: 'text-amber-600' },
  { label: 'Violet', value: 'bg-violet-700', text: 'text-violet-700' }
] as const;
