export const ACCESS_TOKENS = {
  // Admin (Amalga) — ve todos los departamentos + Record Review
  'amalga2026': {
    role: 'admin',
    label: 'Amalga Operations',
    departments: null,
    accent: '#C6842A',
    accentLight: '#fdf3e4',
    showRR: true,
    showPayroll: true,
  },
  // Viewer (Gemini Vouchers) — solo Attendance Vouchers
  'gemini-vouchers': {
    role: 'viewer',
    label: 'Gemini — Vouchers',
    departments: ['Vouchers'],
    accent: '#E07A2F',
    accentLight: '#fef0e4',
    showRR: false,
    showPayroll: false,
  },
  // Record Review TL — Attendance RR + Record Review dashboard
  'rr2026': {
    role: 'rr-admin',
    label: 'Record Review — Operations',
    departments: ['Record Review'],
    accent: '#379AAB',
    accentLight: '#e8f7fa',
    showRR: true,
    showPayroll: false,
  },
};

export function validateAccess(token) {
  if (!token) return null;
  return ACCESS_TOKENS[token] || null;
}
