// Tokens de acceso — cámbialos cuando quieras
export const ACCESS_TOKENS = {
  // Admin (Amalga) — ve todos los departamentos
  'amalga2026': {
    role: 'admin',
    label: 'Amalga Operations',
    departments: null, // null = todos
    accent: '#C6842A',
    accentLight: '#fdf3e4',
  },
  // Viewer (Gemini) — solo Vouchers
  'gemini-vouchers': {
    role: 'viewer',
    label: 'Gemini — Vouchers',
    departments: ['Vouchers'],
    accent: '#E07A2F',
    accentLight: '#fef0e4',
  },
};

/**
 * Valida el token del query param ?access=xxx
 * Retorna el config del rol o null si es inválido
 */
export function validateAccess(token) {
  if (!token) return null;
  return ACCESS_TOKENS[token] || null;
}
