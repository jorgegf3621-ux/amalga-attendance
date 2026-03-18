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
    isAgent: false,
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
    isAgent: false,
  },
  // Record Review TL
  'rr2026': {
    role: 'rr-admin',
    label: 'Record Review — Operations',
    departments: ['Record Review'],
    accent: '#379AAB',
    accentLight: '#e8f7fa',
    showRR: true,
    showPayroll: false,
    isAgent: false,
  },
  // Agents
  'rr-steph': {
    role: 'agent',
    label: 'Record Review',
    agentName: 'Stephania Collazo',
    accent: '#379AAB',
    accentLight: '#e8f7fa',
    isAgent: true,
  },
  'rr-alexis': {
    role: 'agent',
    label: 'Record Review',
    agentName: 'Alexis Garcia',
    accent: '#34c98a',
    accentLight: '#e8faf3',
    isAgent: true,
  },
  'rr-elisa': {
    role: 'agent',
    label: 'Record Review',
    agentName: 'Katya Elisa Carballo',
    displayName: 'Elisa',
    accent: '#7c6fd4',
    accentLight: '#f0eeff',
    isAgent: true,
  },
};

export function validateAccess(token) {
  if (!token) return null;
  return ACCESS_TOKENS[token] || null;
}
