/**
 * Calcula attendance % de un set de registros.
 * Solo considera días medidos (is_measured_day === 1).
 * Attendance % = sum(attendance_min) / sum(measure_shift_min)
 */
export function calcAttendancePct(records) {
  const measured = records.filter(r => r.is_measured_day === 1);
  if (!measured.length) return 0;

  const totalShift = measured.reduce((s, r) => s + (r.measure_shift_min || 0), 0);
  const totalAtt = measured.reduce((s, r) => s + (r.attendance_min || 0), 0);

  return totalShift > 0 ? totalAtt / totalShift : 0;
}

/**
 * Calcula attendance % por departamento.
 * Retorna array: [{ department, pct, measured, total }]
 */
export function calcAttendanceByDept(records) {
  const byDept = {};

  records.forEach(r => {
    const dept = r.department || 'Unknown';
    if (!byDept[dept]) byDept[dept] = [];
    byDept[dept].push(r);
  });

  return Object.entries(byDept)
    .map(([department, recs]) => ({
      department,
      pct: calcAttendancePct(recs),
      measured: recs.filter(r => r.is_measured_day === 1).length,
      total: recs.length,
    }))
    .sort((a, b) => a.department.localeCompare(b.department));
}

/**
 * Calcula attendance % por agente.
 */
export function calcAttendanceByAgent(records) {
  const byAgent = {};

  records.forEach(r => {
    const agent = r.agent || 'Unknown';
    if (!byAgent[agent]) byAgent[agent] = { records: [], department: r.department };
    byAgent[agent].records.push(r);
  });

  return Object.entries(byAgent)
    .map(([agent, { records: recs, department }]) => ({
      agent,
      department,
      pct: calcAttendancePct(recs),
      measured: recs.filter(r => r.is_measured_day === 1).length,
    }))
    .sort((a, b) => a.agent.localeCompare(b.agent));
}

/**
 * Cuenta códigos de attendance.
 * Retorna: { absences, tardies, ncns, ptos, utos, partialSickLeaves, completeSickLeaves, earlyLogouts, emergencies, onTime }
 */
export function calcCounts(records) {
  const counts = {
    absences: 0,
    tardies: 0,
    ncns: 0,
    ptos: 0,
    utos: 0,
    partialSickLeaves: 0,
    completeSickLeaves: 0,
    earlyLogouts: 0,
    emergencies: 0,
    onTime: 0,
  };

  records.forEach(r => {
    const code = (r.code || '').toUpperCase();
    switch (code) {
      case 'A': counts.absences++; break;
      case 'T': counts.tardies++; break;
      case 'NCNS': counts.ncns++; break;
      case 'PTO': counts.ptos++; break;
      case 'UTO': counts.utos++; break;
      case 'SLW': counts.completeSickLeaves++; break;
      case 'SL': counts.partialSickLeaves++; break;
      case 'ER': counts.emergencies++; break;
      case 'EL':
      case 'EO': counts.earlyLogouts++; break;
      case 'ON': counts.onTime++; break;
    }
  });

  return counts;
}

/**
 * Calcula shrinkage en minutos y horas.
 * Shrinkage = tardy_minutes + absence_minutes (de días medidos)
 */
export function calcShrinkage(records) {
  const measured = records.filter(r => r.is_measured_day === 1);

  const tardyMin = measured.reduce((s, r) => s + (r.tardy_minutes || 0), 0);
  const absenceMin = measured.reduce((s, r) => s + (r.absence_minutes || 0), 0);
  const totalLost = measured.reduce((s, r) => s + (r.lost_minutes || 0), 0);
  const totalShift = measured.reduce((s, r) => s + (r.measure_shift_min || 0), 0);

  return {
    tardyMin,
    absenceMin,
    totalLostMin: totalLost,
    totalShiftMin: totalShift,
    shrinkagePct: totalShift > 0 ? (tardyMin + absenceMin) / totalShift : 0,
  };
}

/**
 * Calcula outliers — top N agentes por cada categoría.
 */
export function calcOutliers(records, topN = 5) {
  const byAgent = {};

  records.forEach(r => {
    const agent = r.agent || 'Unknown';
    if (!byAgent[agent]) {
      byAgent[agent] = { agent, department: r.department, absences: 0, tardies: 0, ncns: 0, utos: 0, ptos: 0, partialSickLeaves: 0, completeSickLeaves: 0, emergencies: 0, tardyMin: 0 };
    }
    const code = (r.code || '').toUpperCase();
    if (code === 'A') byAgent[agent].absences++;
    if (code === 'T') {
      byAgent[agent].tardies++;
      byAgent[agent].tardyMin += (r.tardy_minutes || 0);
    }
    if (code === 'NCNS') byAgent[agent].ncns++;
    if (code === 'UTO') byAgent[agent].utos++;
    if (code === 'PTO') byAgent[agent].ptos++;
    if (code === 'SL') byAgent[agent].partialSickLeaves++;
    if (code === 'SLW') byAgent[agent].completeSickLeaves++;
    if (code === 'ER') byAgent[agent].emergencies++;
  });

  const all = Object.values(byAgent);

  return {
    byAbsences: [...all].sort((a, b) => b.absences - a.absences).slice(0, topN),
    byTardies: [...all].sort((a, b) => b.tardies - a.tardies).slice(0, topN),
    byTardyMinutes: [...all].sort((a, b) => b.tardyMin - a.tardyMin).slice(0, topN),
    byUtos: [...all].sort((a, b) => b.utos - a.utos).slice(0, topN),
    byPtos: [...all].sort((a, b) => b.ptos - a.ptos).slice(0, topN),
    byPartialSickLeaves: [...all].sort((a, b) => b.partialSickLeaves - a.partialSickLeaves).slice(0, topN),
    byCompleteSickLeaves: [...all].sort((a, b) => b.completeSickLeaves - a.completeSickLeaves).slice(0, topN),
    byEmergencies: [...all].sort((a, b) => b.emergencies - a.emergencies).slice(0, topN),
  };
}

/**
 * Helper: formato de porcentaje
 */
export function fmtPct(val) {
  return `${(val * 100).toFixed(2)}%`;
}

/**
 * Helper: formato de minutos a horas:minutos
 */
export function fmtMinToHrs(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/**
 * Helper: color del departamento
 */
export const DEPT_COLORS = {
  'Vouchers': '#E07A2F',
  'Record Review': '#6366f1',
  'EDR': '#2d9cdb',
  'UOS': '#10b981',
  'CNR': '#ef4444',
};

export function getDeptColor(dept) {
  return DEPT_COLORS[dept] || '#64748b';
}

/**
 * Helper: nombre corto del mes
 */
export function monthLabel(ym) {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m) - 1]} ${y}`;
}
