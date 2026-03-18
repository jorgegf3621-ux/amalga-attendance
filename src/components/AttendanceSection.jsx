import { calcAttendancePct, calcAttendanceByDept, fmtPct, getDeptColor } from '../lib/calculations';

export default function AttendanceSection({ data, isAdmin }) {
  const overallPct = calcAttendancePct(data);
  const byDept = calcAttendanceByDept(data);

  const pctColor = (p) => p >= 0.95 ? '#10b981' : p >= 0.85 ? '#f59e0b' : '#ef4444';

  // Viewer (Vouchers) usa el accent color naranja para la barra overall
  const overallBarColor = isAdmin ? pctColor(overallPct) : 'var(--accent)';
  const overallTextColor = isAdmin ? pctColor(overallPct) : 'var(--accent)';

  return (
    <div className="animate-fade-up delay-1">
      <h2 className="text-sm font-medium uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Attendance Rate</h2>

      <div className="card p-6 mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Overall</span>
          <span className="font-mono text-2xl font-bold" style={{ color: overallTextColor }}>{fmtPct(overallPct)}</span>
        </div>
        <div className="w-full h-3 rounded-full overflow-hidden mt-2" style={{ background: 'var(--bar-bg)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${overallPct * 100}%`, background: overallBarColor }}
          />
        </div>
      </div>

      {isAdmin && byDept.length > 1 && (
        <div className="space-y-3">
          {byDept.map(d => (
            <div key={d.department} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: getDeptColor(d.department) }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{d.department}</span>
                </div>
                <span className="font-mono text-lg font-semibold" style={{ color: pctColor(d.pct) }}>
                  {fmtPct(d.pct)}
                </span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bar-bg)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${d.pct * 100}%`, background: getDeptColor(d.department) }}
                />
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{d.measured} measured days</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
